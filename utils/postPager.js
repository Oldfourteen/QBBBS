import api from './api.js'

export const PAGE_SIZE = 3

export function getPostUserId() {
  const userInfo = uni.getStorageSync('userInfo')
  return userInfo?.id || userInfo?.user_id || 0
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '')
}

function previewContent(content, max = 220) {
  if (!content) return ''
  const text = typeof content === 'string' ? content : String(content)
  if (text.length <= max && !text.includes('<')) return text
  const chunk = text.length > max * 6 ? text.slice(0, max * 6) : text
  const plain = stripHtml(chunk)
  if (plain.length <= max) return plain
  return plain.slice(0, max) + '...'
}

function normalizeImages(images) {
  if (!images) return []
  if (Array.isArray(images)) {
    return images.filter((img) => typeof img === 'string' && img).slice(0, 1)
  }
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed)
      ? parsed.filter((img) => typeof img === 'string' && img).slice(0, 1)
      : []
  } catch (e) {
    return []
  }
}

export function mapPostForList(post) {
  return {
    post_id: post.post_id || post.id,
    user_id: post.user_id,
    type: post.type,
    title: post.title,
    content: previewContent(post.content, 220),
    images: normalizeImages(post.images),
    likes_count: post.likes_count || 0,
    comments_count: post.comments_count || 0,
    boost_count: post.boost_count || 0,
    created_at: post.created_at,
    username: post.username,
    display_title: post.display_title,
    avatar_url: post.avatar_url,
    role: post.role,
    is_liked: !!(post.is_liked || post.liked),
    is_boosted: !!(post.is_boosted || post.boosted),
    id: post.post_id || post.id,
    liked: !!(post.is_liked || post.liked)
  }
}

function toPostArray(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.data)) return data.data
  return []
}

export async function fetchCommunityPage(page = 1) {
  const userId = getPostUserId()

  const raw = await api.getPosts(
    {
      userId,
      page,
      limit: PAGE_SIZE,
      list: 1,
      excludeType: 'anecdote'
    },
    { timeout: 12000, silent: true }
  )

  console.log('[fetchCommunityPage] raw:', raw)
  const posts = toPostArray(raw).map(mapPostForList)
  console.log('[fetchCommunityPage] posts:', posts)

  return {
    posts,
    hasMore: posts.length >= PAGE_SIZE
  }
}

export async function fetchRecommendPage(page = 1) {
  const userId = getPostUserId()

  const raw = await api.getPosts(
    {
      userId,
      page,
      limit: PAGE_SIZE,
      list: 1,
      type: 'anecdote'
    },
    { timeout: 12000, silent: true }
  )

  const posts = toPostArray(raw).map(mapPostForList)

  return {
    posts,
    hasMore: posts.length >= PAGE_SIZE
  }
}
