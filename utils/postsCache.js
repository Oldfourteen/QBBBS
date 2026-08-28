const COMMUNITY_CACHE_PREFIX = 'community_posts_'
const RECOMMEND_CACHE_KEY = 'recommend_stories_cache'
const META_SUFFIX = '_meta'

const MEMORY_TTL = 5 * 60 * 1000
const STALE_TTL = 45 * 1000

const memoryCache = new Map()

function metaKey(scope, userId = 0) {
  if (scope === 'recommend') return `${RECOMMEND_CACHE_KEY}${META_SUFFIX}`
  return `${COMMUNITY_CACHE_PREFIX}${userId}${META_SUFFIX}`
}

function dataKey(scope, userId = 0) {
  if (scope === 'recommend') return RECOMMEND_CACHE_KEY
  return `${COMMUNITY_CACHE_PREFIX}${userId}`
}

function memKey(scope, userId = 0) {
  return scope === 'recommend' ? 'recommend:0' : `community:${userId}`
}

function readMeta(scope, userId = 0) {
  try {
    return uni.getStorageSync(metaKey(scope, userId)) || null
  } catch (e) {
    return null
  }
}

function writeMeta(scope, userId = 0) {
  try {
    uni.setStorageSync(metaKey(scope, userId), { ts: Date.now() })
  } catch (e) {}
}

export function getMemoryCache(scope, userId = 0) {
  const entry = memoryCache.get(memKey(scope, userId))
  if (!entry) return null
  if (Date.now() - entry.ts > MEMORY_TTL) {
    memoryCache.delete(memKey(scope, userId))
    return null
  }
  return entry.data
}

export function setMemoryCache(scope, userId = 0, data) {
  memoryCache.set(memKey(scope, userId), { data, ts: Date.now() })
}

export function isCacheStale(scope, userId = 0) {
  const memory = memoryCache.get(memKey(scope, userId))
  if (memory && Date.now() - memory.ts <= STALE_TTL) {
    return false
  }
  const meta = readMeta(scope, userId)
  if (!meta || !meta.ts) return true
  return Date.now() - meta.ts > STALE_TTL
}

export function getCommunityPostsCache(userId = 0) {
  const memory = getMemoryCache('community', userId)
  if (memory) return memory
  try {
    const data = uni.getStorageSync(dataKey('community', userId))
    return Array.isArray(data) ? data : null
  } catch (e) {
    return null
  }
}

export function setCommunityPostsCache(userId = 0, posts) {
  setMemoryCache('community', userId, posts)
  writeMeta('community', userId)
  uni.setStorage({
    key: dataKey('community', userId),
    data: posts,
    fail: (e) => console.error('Save community posts cache failed:', e)
  })
}

export function getRecommendStoriesCache() {
  const memory = getMemoryCache('recommend', 0)
  if (memory) return memory
  try {
    const data = uni.getStorageSync(dataKey('recommend', 0))
    return Array.isArray(data) ? data : null
  } catch (e) {
    return null
  }
}

export function setRecommendStoriesCache(stories) {
  setMemoryCache('recommend', 0, stories)
  writeMeta('recommend', 0)
  uni.setStorage({
    key: dataKey('recommend', 0),
    data: stories,
    fail: (e) => console.error('Save recommend stories cache failed:', e)
  })
}

export function clearPostsCache() {
  memoryCache.clear()
  try {
    const { keys } = uni.getStorageInfoSync()
    keys.forEach((key) => {
      if (
        key.startsWith(COMMUNITY_CACHE_PREFIX) ||
        key === RECOMMEND_CACHE_KEY ||
        key.endsWith(META_SUFFIX)
      ) {
        uni.removeStorageSync(key)
      }
    })
  } catch (e) {
    console.error('Clear posts cache failed:', e)
  }
}
