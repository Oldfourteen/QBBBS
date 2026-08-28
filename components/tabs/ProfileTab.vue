<template>
  <view class="profile-page">
    <view class="profile-header">
      <view class="profile-header__inner">
        <lazy-image size="brand-logo" class="brand-logo" :src="require('@/assets/image/qb.png')" mode="aspectFit" />
        <text class="profile-header__title">个人中心</text>
      </view>
    </view>

    <view class="profile-content">
      <view v-if="!isLoggedIn" class="login-prompt flat-card">
        <lazy-image size="prompt-avatar" class="prompt-avatar" src="/static/avatar/default-avatar/user-avatar1.gif" mode="aspectFill" />
        <text class="prompt-title">欢迎来到个人中心</text>
        <text class="prompt-desc">登录后查看您的个人信息和帖子</text>
        <button class="profile-btn profile-btn--primary btn-login" @tap="goLogin">立即登录</button>
      </view>

      <view v-else class="profile-body">
        <view class="profile-card flat-card">
          <view class="profile-card__avatar-wrap">
            <view
              class="profile-card__avatar-inner"
              :class="{ 'is-spinning': isAvatarSpinning }"
              :style="{ transform: `rotate(${avatarRotateDeg}deg)` }"
            >
              <lazy-image size="avatar" class="avatar" :src="userInfo.avatar_url || userInfo.avatar || defaultAvatar" mode="aspectFill" />
            </view>
            <view class="avatar-online-dot" />
          </view>
          <button class="avatar-rotate-action" :class="{ 'is-spinning': isAvatarSpinning }" @tap="toggleAvatarSpin">
            {{ isAvatarSpinning ? '停止' : '旋转' }}
          </button>
          <text class="profile-net-speed">{{ netSpeedText }}</text>
          <text class="profile-name">{{ userInfo.display_title || userInfo.username || userInfo.name || '用户' }}</text>
          <view class="profile-role-badge">
            <text>{{ roleLabel }}</text>
          </view>

          <view class="profile-stats">
            <view class="profile-stat">
              <text class="profile-stat__value">{{ stats.posts != null ? stats.posts : 0 }}</text>
              <text class="profile-stat__label">帖子</text>
            </view>
            <view class="profile-stat-divider" />
            <view class="profile-stat">
              <text class="profile-stat__value">{{ stats.likes != null ? stats.likes : 0 }}</text>
              <text class="profile-stat__label">获赞</text>
            </view>
            <view class="profile-stat-divider" />
            <view class="profile-stat">
              <text class="profile-stat__value">{{ stats.comments != null ? stats.comments : 0 }}</text>
              <text class="profile-stat__label">评论</text>
            </view>
          </view>
        </view>

        <view class="menu-card flat-card">
          <view class="menu-row" @tap="goAvatar">
            <view class="menu-icon-wrap">
              <lazy-image size="menu-icon" class="menu-icon" :src="require('@/assets/image/image-regular-full.svg')" mode="aspectFit" />
            </view>
            <text class="menu-text">更换头像</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-row" @tap="goNotifications">
            <view class="menu-icon-wrap">
              <lazy-image size="menu-icon" class="menu-icon" :src="require('@/assets/image/envelope-solid-full.svg')" mode="aspectFit" />
            </view>
            <text class="menu-text">消息通知</text>
            <view v-if="unreadCount > 0" class="menu-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</view>
            <text v-else class="menu-arrow">›</text>
          </view>
          <view class="menu-row" @tap="goSettings">
            <view class="menu-icon-wrap">
              <lazy-image size="menu-icon" class="menu-icon" :src="require('@/assets/image/gear-solid-full.svg')" mode="aspectFit" />
            </view>
            <text class="menu-text">账号设置</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>

        <view class="posts-card flat-card">
          <view class="posts-card__head">
            <text class="posts-card__title">我的帖子</text>
            <text class="posts-card__count" v-if="myPosts.length">{{ myPosts.length }} 篇</text>
          </view>

          <view v-if="loadingPosts" class="posts-state">
            <text>加载中...</text>
          </view>
          <view v-else-if="myPosts.length === 0" class="posts-state">
            <text>暂无帖子</text>
          </view>
          <view v-else class="posts-list">
            <view
              class="post-row"
              v-for="(post, index) in myPosts"
              :key="post.post_id || post.id || index"
              @tap="goPostDetail(post.post_id || post.id)"
            >
              <view class="post-row__main">
                <text class="post-row__title">{{ post.title || '无标题' }}</text>
                <text class="post-row__meta">{{ formatTime(post.created_at) }} · {{ post.likes_count || 0 }} 赞</text>
              </view>
              <text class="post-row__arrow">›</text>
            </view>
          </view>
        </view>

        <view class="profile-logout-wrap flat-card">
          <button class="profile-logout-btn" @tap="handleLogout">退出登录</button>
        </view>
      </view>
    </view>

    <view class="scroll-tail" aria-hidden="true"></view>
  </view>
</template>

<script>
import api, { BASE_URL } from '@/utils/api.js'
import { formatTime } from '@/utils/index.js'
import { getStoredUserInfo, logout, showConfirmModal } from '@/utils/auth.js'

export default {
  props: {
    active: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      defaultAvatar: '/static/avatar/default-avatar/user-avatar1.gif',
      userInfo: null,
      isLoggedIn: false,
      avatarRotateDeg: 0,
      isAvatarSpinning: false,
      netSpeedMbps: null,
      netSpeedTesting: false,
      netSpeedError: '',
      networkType: '',
      stats: { posts: 0, likes: 0, comments: 0 },
      myPosts: [],
      loadingPosts: false,
      unreadCount: 0,
      _alive: true
    }
  },
  computed: {
    roleLabel() {
      const role = this.userInfo && this.userInfo.role
      if (role === 'admin') return '管理员'
      if (role === 'webmaster') return '站长'
      return '普通用户'
    },
    netSpeedText() {
      const type = this.networkTypeLabel
      const prefix = type ? `网速（${type}）：` : '网速：'
      if (!this.isLoggedIn) return `${prefix}--`
      if (this.netSpeedTesting) return `${prefix}测试中...`
      if (this.netSpeedError) return `${prefix}--`
      if (this.netSpeedMbps == null) return `${prefix}--`
      return `${prefix}${this.netSpeedMbps.toFixed(1)} Mbps`
    },
    networkTypeLabel() {
      const map = { wifi: 'WiFi', '4g': '4G', '5g': '5G', '3g': '3G', '2g': '2G', unknown: '未知' }
      return this.networkType ? (map[this.networkType] || this.networkType) : ''
    }
  },
  watch: {
    active(val) {
      if (val) this.onTabActive()
    }
  },
  mounted() {
    if (this.active) this.onTabActive()
    uni.$on('userInfoUpdated', this.onUserInfoUpdated)
    uni.$on('tabBarLoginChange', this.checkLogin)
    uni.$on('notificationsRead', this.onNotificationsRead)
  },
  beforeDestroy() {
    this.stopAvatarSpin()
    this.stopNetSpeedMonitor()
    this._alive = false
    uni.$off('userInfoUpdated', this.onUserInfoUpdated)
    uni.$off('tabBarLoginChange', this.checkLogin)
    uni.$off('notificationsRead', this.onNotificationsRead)
  },
  activated() {
    this._alive = true
    if (this.active && this.isLoggedIn) this.startNetSpeedMonitor()
  },
  deactivated() {
    this.stopAvatarSpin()
    this.stopNetSpeedMonitor()
    this._alive = false
  },
  methods: {
    formatTime,
    onTabActive() {
      this.checkLogin()
    },
    onUserInfoUpdated(user) {
      this.userInfo = user
    },
    onNotificationsRead() {
      this.unreadCount = 0
    },
    checkLogin() {
      this.userInfo = getStoredUserInfo()
      this.isLoggedIn = !!this.userInfo
      if (this.isLoggedIn && this.active) {
        this.loadStats()
        this.loadMyPosts()
        this.loadUnreadCount()
        this.startNetSpeedMonitor()
      } else {
        this.stopNetSpeedMonitor()
      }
    },
    toggleAvatarSpin() {
      if (this.isAvatarSpinning) this.stopAvatarSpin()
      else this.startAvatarSpin()
    },
    startAvatarSpin() {
      if (this._avatarSpinTimer) return
      this.isAvatarSpinning = true
      this._avatarSpinTimer = setInterval(() => {
        this.avatarRotateDeg = (this.avatarRotateDeg + 12) % 360
      }, 20)
    },
    stopAvatarSpin() {
      if (!this._avatarSpinTimer) return
      clearInterval(this._avatarSpinTimer)
      this._avatarSpinTimer = null
      this.isAvatarSpinning = false
      this.$nextTick(() => {
        this.avatarRotateDeg = 0
      })
    },
    startNetSpeedMonitor() {
      if (this._netSpeedTimer) return
      this.updateNetworkType()
      this.refreshNetSpeed()
      this._netSpeedTimer = setInterval(() => {
        if (!this._alive) return
        if (!this.isLoggedIn || !this.active) return
        this.updateNetworkType()
        this.refreshNetSpeed()
      }, 60000)
    },
    stopNetSpeedMonitor() {
      if (this._netSpeedTimer) {
        clearInterval(this._netSpeedTimer)
        this._netSpeedTimer = null
      }
      if (this._netSpeedTask && typeof this._netSpeedTask.abort === 'function') {
        this._netSpeedTask.abort()
      }
      this._netSpeedTask = null
      this.netSpeedTesting = false
    },
    updateNetworkType() {
      uni.getNetworkType({
        success: (res) => {
          this.networkType = res?.networkType || ''
        },
        fail: () => {
          this.networkType = ''
        }
      })
    },
    refreshNetSpeed() {
      if (this.netSpeedTesting) return
      if (!this.isLoggedIn || !this.active) return
      this.netSpeedTesting = true
      this.netSpeedError = ''
      const base = BASE_URL || ''
      const url = `${base}/static/avatar/default-avatar/user-avatar2.gif?_t=${Date.now()}`
      const start = Date.now()
      let written = 0
      let expected = 0
      const task = uni.downloadFile({
        url,
        timeout: 12000,
        success: () => {
          const ms = Date.now() - start
          const bytes = written || expected
          if (!ms || !bytes) {
            this.netSpeedMbps = null
            this.netSpeedError = 'empty'
            return
          }
          const bps = bytes / (ms / 1000)
          this.netSpeedMbps = (bps * 8) / 1000000
        },
        fail: () => {
          this.netSpeedMbps = null
          this.netSpeedError = 'fail'
        },
        complete: () => {
          this.netSpeedTesting = false
          this._netSpeedTask = null
        }
      })
      this._netSpeedTask = task
      if (task && typeof task.onProgressUpdate === 'function') {
        task.onProgressUpdate((p) => {
          written = p?.totalBytesWritten || written
          expected = p?.totalBytesExpectedToWrite || expected
        })
      }
    },
    async loadStats() {
      try {
        const userId = this.userInfo?.id || this.userInfo?.user_id
        if (!userId) return
        const stats = await api.getUserStats(userId)
        this.stats = stats || { posts: 0, likes: 0, comments: 0 }
      } catch (e) {
        console.warn('Load stats failed:', e.message || e)
      }
    },
    async loadMyPosts() {
      this.loadingPosts = true
      this.myPosts = []
      try {
        const userId = this.userInfo?.id || this.userInfo?.user_id
        if (!userId) return
        const posts = await api.getUserPosts(userId, { limit: 5 })
        this.myPosts = (posts || []).slice(0, 5)
      } catch (e) {
        console.warn('Load my posts failed:', e.message || e)
      } finally {
        this.loadingPosts = false
      }
    },
    goLogin() {
      uni.navigateTo({ url: '/pages/login/index' })
    },
    goSettings() {
      uni.navigateTo({ url: '/pages/settings/index' })
    },
    goAvatar() {
      uni.navigateTo({ url: '/pages/change-avatar/index' })
    },
    goNotifications() {
      uni.navigateTo({ url: '/pages/notifications/index' })
    },
    async loadUnreadCount() {
      try {
        const userId = this.userInfo?.id || this.userInfo?.user_id
        if (!userId) return
        this.unreadCount = await api.getUnreadNotificationCount(userId)
      } catch (e) {
        console.warn('Load unread count failed:', e.message || e)
      }
    },
    goPostDetail(id) {
      uni.navigateTo({ url: `/pages/post-detail/index?id=${id}` })
    },
    async handleLogout() {
      const res = await showConfirmModal({
        title: '提示',
        content: '确定要退出登录吗？'
      })
      if (!res.confirm) return

      this.userInfo = null
      this.isLoggedIn = false
      this.myPosts = []
      this.stats = { posts: 0, likes: 0, comments: 0 }
      logout()
    }
  }
}
</script>

<style scoped lang="scss">
.profile-page {
  width: 100%;
  min-height: 1400px;
  background: var(--bg-primary);
  box-sizing: border-box;
  padding-bottom: calc(var(--tabbar-height) + 48px);
}

.scroll-tail {
  width: 100%;
  height: calc(var(--tabbar-height) + 72px);
  min-height: 120px;
  flex-shrink: 0;
  pointer-events: none;
}

.profile-header {
  position: relative;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: var(--header-bg);
  border-bottom: 1px solid var(--header-border);
  z-index: 10;
  box-sizing: border-box;
  flex-shrink: 0;
}

.profile-header__inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 16px 0;
  box-sizing: border-box;
}

.profile-header__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-inverse);
  letter-spacing: 0.5px;
}

.profile-content {
  padding: 16px;
  box-sizing: border-box;
}

.flat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-sizing: border-box;
  overflow: hidden;
}

.profile-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── 未登录 ── */
.login-prompt {
  text-align: center;
  padding: 48px 24px;
}

.prompt-avatar {
  margin: 0 auto 16px;
  display: block;
}

.prompt-title {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.prompt-desc {
  display: block;
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
  line-height: 1.5;
}

/* ── 用户卡片 ── */
.profile-card {
  padding: 28px 20px 24px;
  text-align: center;
}

.profile-card__avatar-wrap {
  width: 86px;
  height: 86px;
  margin: 0 auto 14px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: visible;
}

.profile-card__avatar-inner {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 260ms ease;
}

.profile-card__avatar-inner.is-spinning {
  transition: none;
}

.avatar-online-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid var(--bg-card);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
  transform: translate(-50%, -50%) translate(32px, 32px);
  box-sizing: border-box;
  z-index: 2;
}

.avatar {
  display: block;
  border: 2px solid var(--bg-card);
  box-sizing: border-box;
}

.avatar-rotate-action {
  width: 74px;
  height: 34px;
  min-height: 34px;
  padding: 0;
  margin: 0 auto 14px;
  border-radius: 999px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.avatar-rotate-action::after {
  border: none;
  display: none;
}

.avatar-rotate-action.is-spinning {
  color: var(--accent-color);
  border-color: rgba(99, 102, 241, 0.35);
  background: rgba(99, 102, 241, 0.08);
}

.avatar-rotate-action:active {
  opacity: 0.92;
}

.profile-net-speed {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.profile-name {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.profile-role-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 20px;
  background: var(--bg-input);
  margin-bottom: 20px;
}

.profile-role-badge text {
  font-size: 12px;
  color: var(--text-secondary);
}

.profile-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 0 4px;
  border-top: 1px solid var(--border-light);
}

.profile-stat {
  flex: 1;
  text-align: center;
}

.profile-stat__value {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: var(--accent-color);
  line-height: 1.2;
  margin-bottom: 4px;
}

.profile-stat__label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
}

.profile-stat-divider {
  width: 1px;
  height: 28px;
  background: var(--border-light);
  flex-shrink: 0;
}

.profile-logout-wrap {
  padding: 12px 16px;
  margin-top: 4px;
}

.profile-logout-btn {
  width: 100%;
  height: 44px;
  min-height: 44px;
  max-height: 44px;
  padding: 0 24px;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #f87171;
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.35);
  border-radius: 12px;
  line-height: 44px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.profile-logout-btn::after {
  border: none;
  display: none;
}

.profile-logout-btn:active {
  background: rgba(248, 113, 113, 0.16);
  opacity: 0.92;
}

/* ── 菜单 ── */
.menu-card {
  padding: 4px 0;
}

.menu-row {
  display: flex;
  align-items: center;
  min-height: 56px;
  padding: 0 16px;
  box-sizing: border-box;
}

.menu-row:active {
  background: var(--bg-menu-hover);
}

.menu-icon-wrap {
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  border-radius: 10px;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
  overflow: hidden;
}

.menu-text {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  color: var(--text-primary);
}

.menu-arrow {
  font-size: 20px;
  color: var(--text-tertiary);
  line-height: 1;
  flex-shrink: 0;
  margin-left: 8px;
}

.menu-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #dc2626;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: 8px;
}

/* ── 帖子列表 ── */
.posts-card {
  padding: 16px;
}

.posts-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.posts-card__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.posts-card__count {
  font-size: 12px;
  color: var(--text-secondary);
}

.posts-state {
  text-align: center;
  padding: 28px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.posts-list {
  margin-top: 8px;
}

.post-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
  box-sizing: border-box;
}

.post-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.post-row:active {
  opacity: 0.75;
}

.post-row__main {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.post-row__title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-row__meta {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.3;
}

.post-row__arrow {
  font-size: 18px;
  color: var(--text-tertiary);
  flex-shrink: 0;
  margin-left: 10px;
  line-height: 1;
}
</style>
