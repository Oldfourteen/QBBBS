export const TAB_KEYS = ['home', 'community', 'recommend', 'profile']

export const TAB_INDEX = {
  home: 0,
  community: 1,
  recommend: 2,
  profile: 3
}

export function parseTabIndex(value) {
  if (value === undefined || value === null || value === '') return 0
  const num = Number(value)
  if (!Number.isNaN(num) && num >= 0 && num < TAB_KEYS.length) return num
  const keyIndex = TAB_KEYS.indexOf(String(value))
  return keyIndex === -1 ? 0 : keyIndex
}

export function navigateToTab(indexOrKey) {
  const index = typeof indexOrKey === 'number'
    ? indexOrKey
    : TAB_INDEX[indexOrKey] ?? 0
  uni.reLaunch({ url: `/pages/main/index?tab=${index}` })
}

export function switchMainTab(indexOrKey) {
  const index = typeof indexOrKey === 'number'
    ? indexOrKey
    : TAB_INDEX[indexOrKey] ?? 0
  uni.$emit('switchMainTab', index)
}
