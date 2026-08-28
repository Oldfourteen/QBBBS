export function getPostUserId() {
  const userInfo = uni.getStorageSync('userInfo')
  return userInfo?.id || userInfo?.user_id || 0
}

export function toPostArray(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.data)) return data.data
  return []
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '')
}

// 先截断再 stripHtml，避免对整篇长 HTML 做正则（会卡死 App 主线程）
function previewContent(content, max = 220) {
  if (!content) return ''
  const text = typeof content === 'string' ? content : String(content)
  if (text.length <= max && !text.includes('<')) return text
  const chunk = text.length > max * 6 ? text.slice(0, max * 6) : text
  const plain = stripHtml(chunk)
  if (plain.length <= max) return plain
  return plain.slice(0, max) + '...'
}

// 与 web/page/index/main.html 完全一致
export function isCommunityAnecdote(post) {
  return (
    post.type === 'anecdote' ||
    (post.type === 'share' &&
      ((post.title && post.title.startsWith('【青滨志异】')) ||
        (post.content && String(post.content).includes('#奇闻异事'))))
  )
}

// 与 web/page/recommend/recommend.html 完全一致
export function isRecommendStory(post) {
  return (
    post.type === 'anecdote' ||
    (post.type === 'share' &&
      ((post.title && post.title.startsWith('【青滨志异】')) ||
        (post.content && String(post.content).includes('#奇闻异事'))))
  )
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

export function filterCommunityPosts(raw, max = 20) {
  const list = toPostArray(raw)
  const result = []
  for (let i = 0; i < list.length && result.length < max; i++) {
    const post = list[i]
    if (!isCommunityAnecdote(post)) {
      result.push(mapPostForList(post))
    }
  }
  return result
}

export function filterRecommendStories(raw, max = 20) {
  const list = toPostArray(raw)
  const result = []
  for (let i = 0; i < list.length && result.length < max; i++) {
    const post = list[i]
    if (isRecommendStory(post)) {
      result.push(mapPostForList(post))
    }
  }
  return result
}
