<template>
  <view class="site-page settings-page">
    <view class="site-header">
      <view class="site-header__inner">
        <view class="site-header__back" @tap="goBack">
          <lazy-image size="site-header__icon" class="site-header__icon" :src="require('@/assets/image/chevron-left-solid-full.svg')" mode="aspectFit" />
        </view>
        <text class="site-header__title">账号设置</text>
      </view>
    </view>

    <view class="settings-content">
      <view v-if="userInfo" class="m-card account-card">
        <lazy-image size="avatar-picker" class="account-avatar" :src="userAvatar" mode="aspectFill" />
        <view class="account-body">
          <text class="account-name">{{ displayName }}</text>
          <text class="account-meta">
            <text>{{ roleLabel }}</text>
            <text v-if="userIdText"> · {{ userIdText }}</text>
          </text>
        </view>
      </view>

      <view v-else class="m-card login-card">
        <view class="login-head">
          <lazy-image size="prompt-avatar" class="login-avatar" src="/static/avatar/default-avatar/user-avatar1.gif" mode="aspectFill" />
          <view class="login-body">
            <text class="login-title">未登录</text>
            <text class="login-desc">登录后可管理头像、通知与账号信息</text>
          </view>
        </view>
        <button class="site-btn site-btn--primary login-btn" @tap="goLogin">去登录</button>
      </view>

      <view class="settings-section">
        <text class="settings-section__title">账号</text>
        <view class="m-card settings-card">
          <view class="menu-row" :class="{ 'is-disabled': !userInfo }" @tap="goAvatar">
            <view class="menu-icon-wrap">
              <lazy-image size="menu-icon" class="menu-icon" :src="require('@/assets/image/image-regular-full.svg')" mode="aspectFit" />
            </view>
            <view class="menu-info">
              <text class="menu-text">更换头像</text>
              <text class="menu-desc">个性化你的个人主页</text>
            </view>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-row" :class="{ 'is-disabled': !userInfo }" @tap="goNotifications">
            <view class="menu-icon-wrap">
              <lazy-image size="menu-icon" class="menu-icon" :src="require('@/assets/image/envelope-solid-full.svg')" mode="aspectFit" />
            </view>
            <view class="menu-info">
              <text class="menu-text">消息通知</text>
              <text class="menu-desc">查看回复与互动提醒</text>
            </view>
            <text class="menu-arrow">›</text>
          </view>
        </view>
      </view>

      <view class="settings-section">
        <text class="settings-section__title">通用</text>
        <view class="m-card settings-card">
          <view class="menu-row" @tap="clearCache">
            <view class="menu-icon-wrap">
              <lazy-image size="menu-icon" class="menu-icon" :src="require('@/assets/image/trash-can-regular-full.svg')" mode="aspectFit" />
            </view>
            <view class="menu-info">
              <text class="menu-text">清除缓存</text>
              <text class="menu-desc">清理本地帖子缓存</text>
            </view>
            <text class="menu-arrow">›</text>
          </view>
        </view>
      </view>

      <view class="settings-section">
        <text class="settings-section__title">关于</text>
        <view class="m-card settings-card">
          <view class="menu-row" @tap="goAbout">
            <view class="menu-icon-wrap">
              <lazy-image size="menu-icon" class="menu-icon" :src="require('@/assets/image/file-lines-regular-full.svg')" mode="aspectFit" />
            </view>
            <view class="menu-info">
              <text class="menu-text">关于我们</text>
              <text class="menu-desc">了解 QB-BBS 与版本信息</text>
            </view>
            <text class="menu-arrow">›</text>
          </view>
        </view>
      </view>

      <view class="settings-footer">
        <text class="settings-footer__text">QB-BBS · 青滨校友圈</text>
      </view>
    </view>
  </view>
</template>

<script>
import { clearPostsCache } from '@/utils/postsCache.js'
import { getStoredUserInfo } from '@/utils/auth.js'

export default {
  data() {
    return {
      defaultAvatar: '/static/avatar/default-avatar/user-avatar1.gif',
      userInfo: null
    }
  },
  computed: {
    displayName() {
      return this.userInfo?.display_title || this.userInfo?.username || this.userInfo?.name || '用户'
    },
    userAvatar() {
      return this.userInfo?.avatar_url || this.userInfo?.avatar || this.defaultAvatar
    },
    roleLabel() {
      const role = this.userInfo?.role
      if (role === 'admin') return '管理员'
      if (role === 'webmaster') return '站长'
      return '普通用户'
    },
    userIdText() {
      const id = this.userInfo?.id || this.userInfo?.user_id
      if (!id) return ''
      return `ID ${id}`
    }
  },
  onShow() {
    this.userInfo = getStoredUserInfo()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    goLogin() {
      uni.navigateTo({ url: '/pages/login/index' })
    },
    goAvatar() {
      if (!this.userInfo) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }
      uni.navigateTo({ url: '/pages/change-avatar/index' })
    },
    goNotifications() {
      if (!this.userInfo) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }
      uni.navigateTo({ url: '/pages/notifications/index' })
    },
    clearCache() {
      clearPostsCache()
      uni.showToast({ title: '已清除', icon: 'success' })
    },
    goAbout() {
      uni.navigateTo({ url: '/pages/about/index' })
    }
  }
}
</script>

<style lang="scss">
.settings-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

.settings-content {
  padding: calc(var(--header-height) + 16px) 16px 28px;
  box-sizing: border-box;
}

.settings-section {
  margin-top: 18px;
}

.settings-section__title {
  display: block;
  padding: 0 4px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.2px;
}

.settings-card {
  padding: 0;
}

.menu-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 12px 0;
  box-sizing: border-box;
}

.menu-desc {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.menu-arrow {
  margin-left: 10px;
  font-size: 22px;
  line-height: 1;
  color: var(--text-secondary);
}

.menu-row.is-disabled {
  opacity: 0.5;
}

.account-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(20, 40, 80, 0.06);
}

.dark .account-card,
page.dark .account-card {
  background: rgba(59, 130, 246, 0.12);
}

.account-avatar {
  border: 2px solid var(--bg-card);
  box-sizing: border-box;
}

.account-body {
  flex: 1;
  min-width: 0;
}

.account-name {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.25;
}

.account-meta {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.login-card {
  padding: 16px;
}

.login-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.login-body {
  flex: 1;
  min-width: 0;
}

.login-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.login-desc {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.login-btn {
  width: 100%;
}

.settings-footer {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  padding-bottom: 8px;
}

.settings-footer__text {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
