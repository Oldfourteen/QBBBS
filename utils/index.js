import { BASE_URL } from './api.js'

export const formatTime = (timestamp) => {
  if (!timestamp) return '刚刚'
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  
  return date.toLocaleDateString('zh-CN')
}

export const stripHtml = (html) => {
  if (!html) return ''
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/<[^>]*$/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const truncateText = (text, maxLength = 100) => {
  if (!text) return ''
  const stripped = stripHtml(text)
  if (stripped.length <= maxLength) return stripped
  return stripped.substring(0, maxLength) + '...'
}

export const showToast = (title, icon = 'none') => {
  uni.showToast({ title, icon, duration: 2000 })
}

export const showLoading = (title = '加载中...') => {
  uni.showLoading({ title, mask: true })
}

export const hideLoading = () => {
  uni.hideLoading()
}

export const resolveAvatarUrl = (url, fallback = '') => {
  if (!url) return fallback
  if (/^https?:\/\//i.test(url) || /^data:image\//i.test(url)) return url
  if (url.startsWith('/upload/') || url.startsWith('/uploads/')) return BASE_URL + url
  if (url.startsWith('upload/') || url.startsWith('uploads/')) return BASE_URL + '/' + url
  return url
}
