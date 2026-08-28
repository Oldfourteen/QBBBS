/**
 * 用户名黑名单校验工具（Vue / uni-app 端）
 *
 * 仅作为前端预检改善体验，最终以服务端校验为准。
 * 拦截：违规 / 敏感词、系统 / API 保留词、非法字符。
 */

// 违规 / 敏感词：作为子串匹配（命中即禁止，主要用于中文）
const PROFANITY_WORDS = [
  '傻逼', '煞笔', '纱布', '傻b', '煞b', 'sb逼', '死妈', '死爹', '死全家',
  '草泥马', '操你', '操他妈', '日你', '日他妈', '干你', '干妈', '尼玛',
  '你妈', '你爹', '妈的', '他妈的', '鸡巴', '鸡鸡', '屌丝', '傻叉',
  '脑残', '脑瘫', '智障', '弱智', '废物', '去死', '找死', '贱货',
  '婊子', '嫖娼', '黄赌毒', '滚蛋'
]

// 敏感短词：仅完整匹配（避免误伤，例如 "usb" 含 "sb"）
const PROFANITY_EXACT = [
  'sb', 'tmd', 'nm', 'nmsl', 'cnm', 'wcnm', 'fuck', 'shit', 'bitch',
  'dick', 'asshole', 'bastard', 'idiot', 'cunt', 'piss', 'wtf', 'damn'
]

// 系统 / API 保留词：仅完整匹配（防止与接口路径、站点身份冲突）
const RESERVED_WORDS = [
  'api', 'auth', 'user', 'users', 'post', 'posts', 'comment', 'comments',
  'admin', 'administrator', 'webmaster', 'moderator', 'mod', 'staff',
  'captcha', 'docs', 'doc', 'tutorial', 'tutorials', 'schedule', 'upload',
  'uploads', 'status', 'health', 'login', 'register', 'logout', 'signin',
  'signup', 'profile', 'settings', 'notification', 'notifications', 'ban',
  'banned', 'tag', 'tags', 'avatar', 'cover',
  'http', 'https', 'www', 'com', 'net', 'org', 'cn', 'edu', 'gov', 'ftp',
  'url', 'localhost', 'null', 'undefined', 'true', 'false', 'void',
  'root', 'system', 'official', 'qb', 'qbbbs', 'bbs', 'superadmin', 'super'
]

const INVALID_CHAR_RE = /[\/\\?#&=%@:;,<>"'`|^$(){}\[\]\s-]/
const CONTROL_CHAR_RE = /[\x00-\x1f\x7f]/

/**
 * 校验用户名是否允许注册
 * @param {string} raw 待校验的用户名
 * @returns {{ valid: boolean, reason: string }}
 */
export function validateUsername(raw) {
  const username = String(raw == null ? '' : raw)

  if (!username || !username.trim()) {
    return { valid: false, reason: '用户名不能为空' }
  }
  if (INVALID_CHAR_RE.test(username) || CONTROL_CHAR_RE.test(username)) {
    return { valid: false, reason: '用户名含有非法字符' }
  }

  const lower = username.toLowerCase()

  for (const w of PROFANITY_WORDS) {
    if (username.includes(w) || lower.includes(w.toLowerCase())) {
      return { valid: false, reason: '用户名含有违规或敏感词汇' }
    }
  }
  for (const w of PROFANITY_EXACT) {
    if (lower === w.toLowerCase()) {
      return { valid: false, reason: '用户名含有违规或敏感词汇' }
    }
  }
  for (const w of RESERVED_WORDS) {
    if (lower === w.toLowerCase()) {
      return { valid: false, reason: '该用户名为系统保留词，请更换' }
    }
  }

  return { valid: true, reason: '' }
}

export default { validateUsername }
