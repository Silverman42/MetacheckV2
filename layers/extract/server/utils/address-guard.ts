import { lookup as dnsLookup } from 'node:dns'
import type { LookupAddress, LookupOptions } from 'node:dns'
import ipaddr from 'ipaddr.js'
import { ExtractFailure } from './extract-failure'

// SSRF guard (PRD §9.4, fixes B4). Only globally routable unicast addresses may be fetched:
// loopback, private, link-local (incl. cloud metadata 169.254.169.254), CGNAT, multicast,
// reserved, NAT64/6to4/Teredo and IPv4-mapped forms of any of those are refused.

export function isPublicAddress(address: string): boolean {
  if (!ipaddr.isValid(address)) return false
  let parsed = ipaddr.parse(address)
  if (parsed.kind() === 'ipv6' && (parsed as ipaddr.IPv6).isIPv4MappedAddress()) {
    parsed = (parsed as ipaddr.IPv6).toIPv4Address()
  }
  return parsed.range() === 'unicast'
}

const ALLOWED_PORTS = new Set(['', '80', '443'])

/** Checks that need no network: scheme, port, credentials, literal IPs. */
export function assertFetchableUrl(url: URL) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ExtractFailure('INVALID_URL', 400, 'Only http and https addresses can be checked.')
  }
  if (!ALLOWED_PORTS.has(url.port)) {
    throw new ExtractFailure('BLOCKED_ADDRESS', 400, 'Only the standard web ports (80 and 443) can be checked.')
  }
  if (url.username || url.password) {
    throw new ExtractFailure('INVALID_URL', 400, 'Remove the username and password from the URL.')
  }
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (ipaddr.isValid(host) && !isPublicAddress(host)) {
    throw new ExtractFailure('BLOCKED_ADDRESS', 400, 'Private, local and reserved addresses can’t be checked.')
  }
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new ExtractFailure('BLOCKED_ADDRESS', 400, 'Private, local and reserved addresses can’t be checked.')
  }
}

type LookupCallback = (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void

/**
 * A drop-in for dns.lookup used as the socket's lookup function, so the address that is
 * checked is the address that is connected to (no DNS-rebinding gap). Every resolved address
 * must be public.
 */
export function guardedLookup(hostname: string, options: LookupOptions, callback: LookupCallback) {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, [])
    const list = addresses as LookupAddress[]
    if (!list.length || list.some(a => !isPublicAddress(a.address))) {
      return callback(new BlockedAddressError(hostname), [])
    }
    if (options.all) return callback(null, list)
    callback(null, list[0]!.address, list[0]!.family)
  })
}

export class BlockedAddressError extends Error {
  code = 'EBLOCKED'
  constructor(hostname: string) {
    super(`${hostname} resolves to a private or reserved address`)
  }
}

/**
 * Resolve a hostname and require every address to be public. Used before handing a URL to the
 * rendering service, which connects from its own network where our socket guard can't apply.
 */
export async function assertPublicHost(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, '')
  if (ipaddr.isValid(host)) {
    if (!isPublicAddress(host)) throw new ExtractFailure('BLOCKED_ADDRESS', 400, 'Private, local and reserved addresses can’t be checked.')
    return
  }
  const { lookup } = await import('node:dns/promises')
  let addresses: LookupAddress[]
  try {
    addresses = await lookup(host, { all: true })
  }
  catch {
    throw new ExtractFailure('DNS_ERROR', 502, 'The domain doesn’t resolve. Check the spelling.')
  }
  if (!addresses.length || addresses.some(a => !isPublicAddress(a.address))) {
    throw new ExtractFailure('BLOCKED_ADDRESS', 400, 'That site points to a private or reserved address, so it can’t be checked.')
  }
}
