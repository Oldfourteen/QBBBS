import { clearAuthStorage } from './auth.js'

// App 端使用前端域名访问后端 API（通过 Nginx 反向代理）
export const API_BASES = [
  'https://qbbbs.fun',
  'http://start.awacode.top:20699',
  'https://awacode.top'
]

const STORAGE_ACTIVE_BASE = 'api_active_base'
const REQUEST_TIMEOUT = 10000

function isLocalDevHost() {
  // #ifdef H5
  try {
    const { hostname } = window.location
    return hostname === 'localhost' || hostname === '127.0.0.1'
  } catch (e) {}
  // #endif
  return false
}

function getEffectiveApiBases() {
  // 本地 H5 开发走 devServer 代理，避免跨域与远程 HTTPS 连接被重置
  if (isLocalDevHost()) return ['']
  return API_BASES
}

export const BASE_URL = isLocalDevHost() ? '' : API_BASES[0]

function getPreferredBase() {
  if (isLocalDevHost()) return ''
  try {
    const saved = uni.getStorageSync(STORAGE_ACTIVE_BASE)
    if (saved && API_BASES.includes(saved)) return saved
  } catch (e) {}
  return BASE_URL
}

function rememberBase(base) {
  if (isLocalDevHost() || !base) return
  try {
    uni.setStorageSync(STORAGE_ACTIVE_BASE, base)
  } catch (e) {}
}

function buildAuthHeaders(extra = {}) {
  const headers = { ...extra }
  const token = uni.getStorageSync('token')
  // 与 web 一致：没有 token 时不发送 Authorization 头
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

function appendQuery(url, data) {
  if (!data || typeof data !== 'object') return url
  const parts = []
  Object.keys(data).forEach((key) => {
    const value = data[key]
    if (value === undefined || value === null) return
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  })
  if (!parts.length) return url
  return url + (url.includes('?') ? '&' : '?') + parts.join('&')
}

function parseJsonData(data) {
  if (data === null || data === undefined) return data
  if (typeof data !== 'string') return data
  const text = data.trim()
  if (!text) return data
  if (text[0] !== '{' && text[0] !== '[') return data
  try {
    return JSON.parse(text)
  } catch (e) {
    return data
  }
}

function normalizeFailError(err) {
  const msg = err?.errMsg || err?.message || ''
  if (msg.includes('timeout')) return new Error('请求超时，请检查网络')
  if (msg.includes('ssl') || msg.includes('certificate')) return new Error('SSL 证书校验失败')
  if (msg.includes('network') || msg.includes('Network') || msg.includes('connect')) return new Error('网络连接失败，请检查网络')
  if (msg) return new Error(msg)
  return new Error('网络错误')
}

function classifyErrorForRetry(err, statusCode) {
  // Do not retry on 4xx client errors (except 408/429)
  if (statusCode >= 400 && statusCode < 500 && statusCode !== 408 && statusCode !== 429) {
    return { shouldRetry: false, reason: 'client-error' }
  }
  // Retry on 5xx, network errors, timeout, 408, 429
  if (statusCode >= 500 || statusCode === 408 || statusCode === 429) {
    return { shouldRetry: true, reason: 'server-error' }
  }
  if (err && (err.message || '').includes('超时')) {
    return { shouldRetry: true, reason: 'timeout' }
  }
  if (err && (err.message || '').includes('网络')) {
    return { shouldRetry: true, reason: 'network' }
  }
  return { shouldRetry: true, reason: 'unknown' }
}

function withHardTimeout(promise, ms, message = '请求超时，请检查网络') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}

function uniRequestOnce(url, options) {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: options.method,
      data: options.data,
      timeout: options.timeout,
      header: options.header,
      dataType: 'json',
      sslVerify: options.sslVerify,
      success: resolve,
      fail: (err) => reject(normalizeFailError(err))
    })
  })
}

function getRequestBases() {
  const effectiveBases = getEffectiveApiBases()
  if (isLocalDevHost()) return effectiveBases

  const bases = []
  const preferred = getPreferredBase()
  if (preferred) bases.push(preferred)
  effectiveBases.forEach((base) => {
    if (!bases.includes(base)) bases.push(base)
  })
  return bases
}

const request = async (options) => {
  const silent = !!options.silent
  const method = (options.method || 'GET').toUpperCase()

  let path = options.url
  let data = options.data

  if (method === 'GET' && data) {
    path = appendQuery(path, data)
    data = undefined
  }

  const header = buildAuthHeaders(options.header)
  if (method === 'GET' || method === 'DELETE') {
    delete header['Content-Type']
  } else if (!header['Content-Type']) {
    header['Content-Type'] = 'application/json'
  }

  const timeout = options.timeout || REQUEST_TIMEOUT
  const maxRetries = (options.retries !== undefined) ? options.retries : 1
  let lastError = null
  const bases = options.singleBase ? [getPreferredBase() || BASE_URL] : getRequestBases()

  for (const base of bases) {
    const url = base + path
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(800 * Math.pow(2, attempt - 1), 4000)
        console.log(`[API Retry] Waiting ${delay}ms before retry ${attempt} for ${url}`)
        await new Promise(r => setTimeout(r, delay))
      }
      try {
        const res = await withHardTimeout(
          uniRequestOnce(url, {
            method,
            data,
            timeout,
            header,
            sslVerify: false
          }),
          timeout + 1000
        )

        const body = parseJsonData(res.data)
        console.log('[API] success:', { url, statusCode: res.statusCode, bodyType: typeof body, isArray: Array.isArray(body), bodyLength: Array.isArray(body) ? body.length : 0 })

        if (res.statusCode >= 200 && res.statusCode < 300) {
          rememberBase(base)
          return body
        }

        if (res.statusCode === 401) {
          clearAuthStorage()
          uni.$emit('tabBarLoginChange')
          if (!silent) {
            uni.showToast({ title: '请先登录', icon: 'none' })
            uni.navigateTo({ url: '/pages/login/index' })
          }
          throw new Error('未授权')
        }

        const msg = body?.error || body?.message || `请求失败(${res.statusCode})`
        lastError = new Error(msg)
        lastError.statusCode = res.statusCode

        const { shouldRetry } = classifyErrorForRetry(lastError, res.statusCode)
        if (!shouldRetry) break
      } catch (err) {
        if (err.message === '未授权') throw err
        lastError = err instanceof Error ? err : normalizeFailError(err)
        console.warn('[API]', url, `attempt ${attempt + 1}`, lastError.message)

        const { shouldRetry } = classifyErrorForRetry(lastError, lastError.statusCode)
        if (!shouldRetry) break
      }
    }
  }

  if (!silent) {
    uni.showToast({ title: lastError?.message || '网络错误', icon: 'none' })
  }
  throw lastError || new Error('网络错误')
}

function uploadOnce(url, options) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url,
      filePath: options.filePath,
      name: options.name,
      header: options.header,
      success: resolve,
      fail: (err) => reject(normalizeFailError(err))
    })
  })
}

async function uploadWithFallback(path, options) {
  let lastError = null
  for (const base of getRequestBases()) {
    try {
      const res = await uploadOnce(base + path, options)
      const body = parseJsonData(res.data)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        rememberBase(base)
        return body
      }
      lastError = new Error(body?.error || body?.message || '上传失败')
      lastError.statusCode = res.statusCode
    } catch (err) {
      lastError = err
    }
  }
  throw lastError || new Error('上传失败')
}

export const api = {
  getPosts(params = {}, options = {}) {
    return request({
      url: '/api/posts',
      data: {
        list: 1,
        page: 1,
        limit: 3,
        ...params
      },
      timeout: options.timeout || REQUEST_TIMEOUT,
      silent: options.silent,
      singleBase: true,
      retries: options.retries !== undefined ? options.retries : 1
    })
  },

  getPostDetail(id, userId = 0) {
    return request({ url: `/api/posts/${id}`, data: { userId } })
  },

  createPost(data) {
    return request({ url: '/api/posts', method: 'POST', data })
  },

  likePost(id, user_id) {
    return request({ url: `/api/posts/${id}/like`, method: 'POST', data: { user_id } })
  },

  getPostLikes(postId) {
    return request({ url: `/api/posts/${postId}/likes` })
  },

  getCommentLikes(commentId) {
    return request({ url: `/api/comments/${commentId}/likes` })
  },

  boostPost(id, user_id) {
    return request({ url: `/api/posts/${id}/boost`, method: 'POST', data: { user_id } })
  },

  deletePost(id, user_id) {
    return request({ url: `/api/posts/${id}`, method: 'DELETE', data: { user_id } })
  },

  searchPosts(q, userId = 0) {
    return request({ url: '/api/posts/search', data: { q, userId } })
  },

  getComments(postId, userId = 0) {
    return request({ url: `/api/posts/${postId}/comments`, data: { userId } })
  },

  createComment(postId, data) {
    return request({ url: `/api/posts/${postId}/comments`, method: 'POST', data })
  },

  likeComment(commentId, user_id) {
    return request({ url: `/api/comments/${commentId}/like`, method: 'POST', data: { user_id } })
  },

  deleteComment(commentId, user_id) {
    return request({ url: `/api/comments/${commentId}`, method: 'DELETE', data: { user_id } })
  },

  login(data) {
    return request({ url: '/api/auth/login', method: 'POST', data })
  },

  register(data) {
    return request({ url: '/api/auth/register', method: 'POST', data })
  },

  sendEmailCode(email) {
    return request({ url: '/api/auth/send-email-code', method: 'POST', data: { email } })
  },

  sendResetCode(email) {
    return request({ url: '/api/auth/send-reset-code', method: 'POST', data: { email } })
  },

  resetPassword(data) {
    return request({ url: '/api/auth/reset-password', method: 'POST', data })
  },

  getUserInfo(userId) {
    return request({ url: `/api/user/${userId}` })
  },

  updateUserInfo(userId, data) {
    return request({ url: `/api/user/${userId}`, method: 'PUT', data })
  },

  uploadAvatar(userId, filePath) {
    return uploadWithFallback(`/api/user/${userId}/avatar`, {
      filePath,
      name: 'avatar',
      header: buildAuthHeaders()
    })
  },

  getUserStats(userId) {
    return request({ url: `/api/user/${userId}/stats` }).catch((err) => {
      if (err.statusCode === 404) {
        return api.computeStatsFromPosts(userId)
      }
      throw err
    })
  },

  computeStatsFromPosts(userId) {
    return request({ url: `/api/user/${userId}/posts`, data: { limit: 50 } }).then((posts) => {
      const list = Array.isArray(posts) ? posts : []
      return {
        posts: list.length,
        likes: list.reduce((sum, post) => sum + (Number(post.likes_count) || 0), 0),
        comments: list.reduce((sum, post) => sum + (Number(post.comments_count) || 0), 0)
      }
    })
  },

  getUserPosts(userId, params = {}) {
    return request({ url: `/api/user/${userId}/posts`, data: params })
  },

  getUserPrivacy(userId) {
    return request({ url: `/api/user/${userId}/privacy` })
  },

  updateUserPrivacy(userId, data) {
    return request({ url: `/api/user/${userId}/privacy`, method: 'PUT', data })
  },

  getUserTags(userId) {
    return request({ url: `/api/user/${userId}/tags` })
  },

  updateUserTags(userId, tags) {
    return request({ url: `/api/user/${userId}/tags`, method: 'POST', data: { tags } })
  },

  getNotifications(userId) {
    return request({ url: `/api/user/${userId}/notifications` })
  },

  getUnreadNotificationCount(userId) {
    return request({ url: `/api/user/${userId}/notifications/unread-count`, silent: true })
      .then((res) => Number(res?.count) || 0)
      .catch(() => 0)
  },

  markNotificationsRead(userId) {
    return request({ url: `/api/user/${userId}/notifications/mark-read`, method: 'POST', silent: true })
  },

  deleteNotification(userId, type, notificationId) {
    return request({ url: `/api/user/${userId}/notifications/${type}/${notificationId}`, method: 'DELETE' })
  },

  clearNotifications(userId) {
    return request({ url: `/api/user/${userId}/notifications/clear`, method: 'DELETE' })
  },

  getCaptcha(type = 'SLIDER') {
    return request({ url: '/api/captcha/gen', data: { type } })
  },

  checkCaptcha(data) {
    return request({ url: '/api/captcha/check', method: 'POST', data })
  },

  getTutorials() {
    return request({ url: '/api/tutorials' })
  },

  checkStatus() {
    return request({ url: '/api/status', silent: true })
  },

  parseSchedulePdf(filePath) {
    return uploadWithFallback('/api/schedule/parse-pdf', {
      filePath,
      name: 'pdf',
      header: buildAuthHeaders(),
      timeout: 60000
    })
  }
}

export default api
