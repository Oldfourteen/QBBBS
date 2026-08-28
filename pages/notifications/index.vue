<template>
  <view class="page">
    <view class="header">
      <view class="header-inner">
        <view class="back-btn" @tap="goBack">
          <lazy-image class="back-icon" :src="require('@/assets/image/chevron-left-solid-full.svg')" mode="aspectFit" />
        </view>
        <text class="brand">消息通知</text>
        <view class="clear-btn" v-if="notifications.length > 0" @tap="handleClearAll">
          <text>清空</text>
        </view>
      </view>
    </view>

    <view class="content">
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-else-if="notifications.length === 0" class="empty">
        <text>暂无消息通知</text>
      </view>
      <view v-else class="notification-list">
        <view
          class="notification-item"
          :class="{ unread: item.is_unread }"
          v-for="item in notifications"
          :key="item.type + '_' + item.id"
          @tap="handleTap(item)"
        >
          <view class="avatar-wrap">
            <lazy-image
              class="actor-avatar"
              :src="resolveAvatarUrl(item.actor_avatar, '/static/avatar/default-avatar/user-avatar1.gif')"
              mode="aspectFill"
            />
            <view v-if="item.is_unread" class="unread-dot" />
          </view>
          <view class="notification-body">
            <view class="notification-header">
              <text class="actor-name">{{ item.actor_name || '匿名用户' }}</text>
              <text class="notification-time">{{ formatTime(item.created_at) }}</text>
            </view>
            <text class="notification-text">
              <text v-if="item.type === 'like'">赞了你的帖子</text>
              <text v-else>回复了你的帖子</text>
            </text>
            <text class="post-title">{{ item.post_title || '无标题' }}</text>
            <text v-if="item.type === 'comment' && item.content" class="comment-content">{{ item.content }}</text>
          </view>
          <view class="delete-btn" @tap.stop="handleDelete(item)">
            <lazy-image class="delete-icon" :src="require('@/assets/image/trash-can-regular-full.svg')" mode="aspectFit" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'
import { formatTime, resolveAvatarUrl } from '@/utils/index.js'
import { getStoredUserInfo, showConfirmModal } from '@/utils/auth.js'

export default {
  data() {
    return {
      notifications: [],
      loading: false,
      hasUnread: false
    }
  },
  onShow() {
    this.loadNotifications()
  },
  onHide() {
    this.markAllReadOnLeave()
  },
  onUnload() {
    this.markAllReadOnLeave()
  },
  methods: {
    formatTime,
    resolveAvatarUrl,
    goBack() {
      uni.navigateBack()
    },
    async loadNotifications() {
      const userInfo = getStoredUserInfo()
      if (!userInfo) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }
      this.loading = true
      try {
        const userId = userInfo.id || userInfo.user_id
        const list = await api.getNotifications(userId)
        this.notifications = list || []
        this.hasUnread = this.notifications.some((item) => item.is_unread)
      } catch (e) {
        console.error('Load notifications failed:', e)
      } finally {
        this.loading = false
      }
    },
    async markAllReadOnLeave() {
      if (!this.hasUnread) return
      const userInfo = getStoredUserInfo()
      if (!userInfo) return
      const userId = userInfo.id || userInfo.user_id
      try {
        await api.markNotificationsRead(userId)
        this.hasUnread = false
        this.notifications = this.notifications.map((item) => ({
          ...item,
          is_unread: false
        }))
        uni.$emit('notificationsRead')
      } catch (e) {
        console.warn('Mark notifications read failed:', e.message || e)
      }
    },
    handleTap(item) {
      const postId = item.post_id
      if (!postId) return
      if (item.type === 'comment') {
        uni.navigateTo({
          url: `/pages/post-detail/index?id=${postId}&commentId=${item.id}`
        })
        return
      }
      uni.navigateTo({
        url: `/pages/post-detail/index?id=${postId}`
      })
    },
    async handleDelete(item) {
      const res = await showConfirmModal({
        title: '提示',
        content: '确定删除这条消息吗？'
      })
      if (!res.confirm) return
      const userInfo = getStoredUserInfo()
      if (!userInfo) return
      try {
        const userId = userInfo.id || userInfo.user_id
        await api.deleteNotification(userId, item.type, item.id)
        this.notifications = this.notifications.filter(
          n => !(n.type === item.type && n.id === item.id)
        )
      } catch (e) {
        console.error('Delete notification failed:', e)
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    },
    async handleClearAll() {
      const res = await showConfirmModal({
        title: '提示',
        content: '确定清空所有消息吗？'
      })
      if (!res.confirm) return
      const userInfo = getStoredUserInfo()
      if (!userInfo) return
      try {
        const userId = userInfo.id || userInfo.user_id
        await api.clearNotifications(userId)
        this.notifications = []
        this.hasUnread = false
        await api.markNotificationsRead(userId)
        uni.$emit('notificationsRead')
      } catch (e) {
        console.error('Clear notifications failed:', e)
        uni.showToast({ title: '清空失败', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg-primary);
}
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 88px;
  background: var(--header-bg);
  z-index: 999;
}
.header-inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding-top: 10px;
}
.back-btn {
  position: absolute;
  left: 16px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.back-icon {
  width: 24px;
  height: 24px;
  filter: brightness(0) invert(1);
}
.brand {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-inverse);
}
.clear-btn {
  position: absolute;
  right: 16px;
  padding: 6px 12px;
}
.clear-btn text {
  font-size: 14px;
  color: var(--text-inverse);
}
.content {
  padding: 108px 16px 20px;
}
.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  font-size: 14px;
}
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  padding: 16px;
}
.notification-item.unread {
  border-color: rgba(220, 38, 38, 0.25);
  background: rgba(220, 38, 38, 0.04);
}
.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}
.actor-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: block;
}
.unread-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background: #dc2626;
  border: 2px solid var(--bg-card);
  border-radius: 50%;
}
.notification-body {
  flex: 1;
  min-width: 0;
}
.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.actor-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.notification-time {
  font-size: 12px;
  color: var(--text-secondary);
}
.notification-text {
  font-size: 14px;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 4px;
}
.post-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: 4px;
}
.comment-content {
  font-size: 13px;
  color: var(--text-tertiary);
  background: var(--bg-input);
  border-radius: 8px;
  padding: 8px 12px;
  display: block;
  word-break: break-all;
}
.delete-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 4px;
}
.delete-icon {
  width: 16px;
  height: 16px;
  opacity: 0.5;
}
</style>
