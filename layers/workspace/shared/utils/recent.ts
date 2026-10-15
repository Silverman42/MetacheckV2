// FR-1.6: the last 10 lookups, newest first, without duplicates.
export const RECENT_LIMIT = 10

export function addRecent(list: string[], url: string) {
  return [url, ...list.filter(u => u !== url)].slice(0, RECENT_LIMIT)
}
