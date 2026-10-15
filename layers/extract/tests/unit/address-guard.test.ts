import { describe, expect, it } from 'vitest'
import { assertFetchableUrl, isPublicAddress } from '../../server/utils/address-guard'

describe('isPublicAddress (SSRF guard, PRD §9.4)', () => {
  it.each([
    '127.0.0.1', '10.0.0.5', '172.16.3.4', '192.168.1.1', '169.254.169.254', '100.64.0.1',
    '0.0.0.0', '224.0.0.1', '255.255.255.255', '198.18.0.1', '192.0.2.1',
    '::1', '::', 'fe80::1', 'fc00::1', 'fd12:3456::1', 'ff02::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1',
    '64:ff9b::7f00:1', '2002:7f00:1::', 'not-an-ip',
  ])('blocks %s', (address) => {
    expect(isPublicAddress(address)).toBe(false)
  })

  it.each(['93.184.216.34', '8.8.8.8', '2606:4700:4700::1111', '::ffff:8.8.8.8'])('allows %s', (address) => {
    expect(isPublicAddress(address)).toBe(true)
  })
})

describe('assertFetchableUrl', () => {
  it.each([
    'http://127.0.0.1/', 'http://[::1]/', 'http://169.254.169.254/latest/meta-data/',
    'http://localhost/', 'http://printer.local/', 'https://example.com:8443/', 'ftp://example.com/',
    'https://user@example.com/',
  ])('refuses %s', (url) => {
    expect(() => assertFetchableUrl(new URL(url))).toThrow()
  })

  it.each(['https://example.com/', 'http://example.com:80/', 'https://93.184.216.34/'])('accepts %s', (url) => {
    expect(() => assertFetchableUrl(new URL(url))).not.toThrow()
  })
})
