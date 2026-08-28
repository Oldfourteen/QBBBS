import api from './api.js'
import { stripHtml } from './index.js'
import {
  setCommunityPostsCache,
  setRecommendStoriesCache,
  getMemoryCache,
  setMemoryCache,
  isCacheStale
} from './postsCache.js'

const inflight = {
  community: new Map(),
  recommend: null
}

function getUserId() {
  const userInfo = uni.getStorageSync('userInfo')
  return userInfo?.id || userInfo?.user_id || 0
}

function toPostList(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.data)) return data.data
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return toPostList(parsed)
    } catch (e) {}
  }
  return []
}

function previewContent(content, max = 220) {
  if (!content) return ''
  if (typeof content !== 'string') return String(content)
  if (content.length <= max && !content.includes('<')) return content
  const slice = content.length > max * 4 ? content.slice(0, max * 4) : content
  const plain = stripHtml(slice)
  if (plain.length <= max) return plain
  return plain.slice(0, max) + '...'
}

function normalizeImages(images) {
  if (!images) return []
  if (Array.isArray(images)) return images.slice(0, 3)
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed.slice(0, 3) : []
  } catch (e) {
    return []
  }
}

function normalizePostForList(post) {
  return {
    post_id: post.post_id || post.id,
    user_id: post.user_id,
    type: post.type,
    title: post.title,
    content: previewContent(post.content, 220),
    images: normalizeImages(post.images),
    likes_count: post.likes_count || 0,
    comments_count: post.comments_count || 0,
    created_at: post.created_at,
    username: post.username,
    display_title: post.display_title,
    avatar_url: post.avatar_url,
    role: post.role,
    is_liked: !!(post.is_liked || post.liked),
    id: post.post_id || post.id,
    liked: !!(post.is_liked || post.liked)
  }
}

export function formatCommunityPosts(posts) {
  return toPostList(posts).filter((post) => {
    const isAnecdote =
      post.type === 'anecdote' ||
      (post.title && post.title.startsWith('【青滨志异】')) ||
      (post.content && post.content.includes('#奇闻异事'))
    return !isAnecdote
  }).map(normalizePostForList)
}

export function formatRecommendStories(posts) {
  return toPostList(posts).filter((post) => {
    return (
      post.type === 'anecdote' ||
      (post.title && post.title.startsWith('【青滨志异】')) ||
      (post.content && post.content.includes('#爆料'))
    )
  }).map(normalizePostForList)
}

async function requestCommunityPosts(userId, options = {}) {
  // 与 web/page/index/main.html 完全一致：只传 userId
  const posts = await api.getPosts(
    { userId },
    { silent: options.silent, timeout: options.timeout || 10000 }
  )
  const formatted = formatCommunityPosts(posts)
  setMemoryCache('community', userId, formatted)
  setCommunityPostsCache(userId, formatted)
  return formatted
}

async function requestRecommendStories(userId, options = {}) {
  const posts = await api.getPosts(
    { userId },
    { silent: options.silent, timeout: options.timeout || 10000 }
  )
  const formatted = formatRecommendStories(posts)
  setMemoryCache('recommend', 0, formatted)
  setRecommendStoriesCache(formatted)
  return formatted
}

function dedupeCommunity(userId, fetcher) {
  if (inflight.community.has(userId)) {
    return inflight.community.get(userId)
  }
  const promise = fetcher().finally(() => {
    inflight.community.delete(userId)
  })
  inflight.community.set(userId, promise)
  return promise
}

function dedupeRecommend(fetcher) {
  if (inflight.recommend) return inflight.recommend
  inflight.recommend = fetcher().finally(() => {
    inflight.recommend = null
  })
  return inflight.recommend
}

export function getCommunityPostsInstant(userId = getUserId()) {
  const memory = getMemoryCache('community', userId)
  if (memory) return memory
  try {
    const data = uni.getStorageSync(`community_posts_${userId}`)
    return Array.isArray(data) ? data : null
  } catch (e) {
    return null
  }
}

export function getRecommendStoriesInstant() {
  const memory = getMemoryCache('recommend', 0)
  if (memory) return memory
  try {
    const data = uni.getStorageSync('recommend_stories_cache')
    return Array.isArray(data) ? data : null
  } catch (e) {
    return null
  }
}

export async function loadCommunityPosts(options = {}) {
  const { forceRefresh = false, silent = false, onInstant = null, onUpdated = null } = options
  const userId = getUserId()

  if (!forceRefresh) {
    const instant = getCommunityPostsInstant(userId)
    if (instant && instant.length > 0) {
      if (typeof onInstant === 'function') onInstant(instant)
      if (!isCacheStale('community', userId)) {
        return instant
      }
      dedupeCommunity(userId, () => requestCommunityPosts(userId, { silent: true }))
        .then((fresh) => {
          if (typeof onUpdated === 'function') onUpdated(fresh)
        })
        .catch((err) => {
          console.warn('[posts] community background refresh failed:', err.message || err)
        })
      return instant
    }
  }

  return dedupeCommunity(userId, () => requestCommunityPosts(userId, { silent }))
}

export async function loadRecommendStories(options = {}) {
  const { forceRefresh = false, silent = false, onInstant = null, onUpdated = null } = options
  const userId = getUserId()

  if (!forceRefresh) {
    const instant = getRecommendStoriesInstant()
    if (instant && instant.length > 0) {
      if (typeof onInstant === 'function') onInstant(instant)
      if (!isCacheStale('recommend', 0)) {
        return instant
      }
      dedupeRecommend(() => requestRecommendStories(userId, { silent: true }))
        .then((fresh) => {
          if (typeof onUpdated === 'function') onUpdated(fresh)
        })
        .catch((err) => {
          console.warn('[posts] recommend background refresh failed:', err.message || err)
        })
      return instant
    }
  }

  return dedupeRecommend(() => requestRecommendStories(userId, { silent }))
}

export function prefetchPostsFeed(delay = 0) {
  const run = () => {
    loadCommunityPosts({ silent: true }).catch((err) => {
      console.warn('[posts] prefetch community failed:', err.message || err)
    })
    loadRecommendStories({ silent: true }).catch((err) => {
      console.warn('[posts] prefetch recommend failed:', err.message || err)
    })
  }
  if (delay > 0) {
    setTimeout(run, delay)
  } else {
    run()
  }
}
