const LOGIN_EXPIRE_MS = 72 * 60 * 60 * 1000
const AUTH_KEYS = ['userInfo', 'token', 'loginTime']

export function getStoredUserInfo() {
  const userInfo = uni.getStorageSync('userInfo')
  const loginTime = uni.getStorageSync('loginTime')

  if (!userInfo) return null

  if (loginTime && Date.now() - loginTime > LOGIN_EXPIRE_MS) {
    clearAuthStorage()
    return null
  }

  return userInfo
}

export function isLoggedIn() {
  return !!getStoredUserInfo()
}

export function clearAuthStorage() {
  AUTH_KEYS.forEach((key) => {
    try {
      uni.removeStorageSync(key)
    } catch (e) {}
  })
}

export function logout(options = {}) {
  const { silent = false } = options
  clearAuthStorage()
  uni.$emit('tabBarLoginChange')
  uni.$emit('userInfoUpdated', null)
  if (!silent) {
    uni.showToast({ title: '已退出登录', icon: 'success' })
  }
}

export function showConfirmModal(options = {}) {
  return new Promise((resolve) => {
    uni.showModal({
      title: options.title || '提示',
      content: options.content || '',
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      showCancel: options.showCancel !== false,
      success: (res) => resolve(res),
      fail: () => resolve({ confirm: false, cancel: true })
    })
  })
}
