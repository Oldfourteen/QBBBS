<template>
  <view class="page">
    <view class="header">
      <view class="header-inner">
        <view class="back-btn" @tap="goBack">
          <lazy-image class="back-icon" :src="require('@/assets/image/chevron-left-solid-full.svg')" mode="aspectFit" />
        </view>
        <text class="brand">更换头像</text>
      </view>
    </view>

    <view class="content">
      <view class="avatar-section">
        <text class="section-title">选择默认头像</text>
        <view class="default-avatars">
          <view
            v-for="(item, index) in defaultAvatars"
            :key="index"
            class="avatar-option"
            :class="{ active: selectedAvatar === item }"
            @tap="selectDefaultAvatar(item)"
          >
            <lazy-image size="avatar-picker" :src="item" mode="aspectFill" />
          </view>
        </view>
      </view>

      <text class="section-title">或上传自定义头像</text>
      <view class="upload-area">
        <lazy-image v-if="previewAvatar || defaultAvatar" size="preview-avatar" class="preview-avatar" :src="previewAvatar || defaultAvatar" mode="aspectFill" />
        <view v-else class="preview-avatar preview-empty"></view>
        <button class="btn-upload" @tap="chooseImage">选择图片文件</button>
        <text class="upload-tip">支持 JPG, PNG, GIF. 最大 2MB.</text>
      </view>

      <view class="actions">
        <button class="btn-cancel" @tap="goBack">取消</button>
        <button class="btn-save" @tap="saveAvatar">保存更改</button>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  data() {
    return {
      defaultAvatars: [
        '/static/avatar/default-avatar/user-avatar1.gif',
        '/static/avatar/default-avatar/user-avatar2.gif',
        '/static/avatar/default-avatar/user-avatar3.gif',
        '/static/avatar/default-avatar/user-avatar4.gif'
      ],
      defaultAvatar: '/static/avatar/default-avatar/user-avatar1.gif',
      selectedAvatar: '',
      previewAvatar: '',
      customFilePath: '',
      userInfo: null
    }
  },
  onLoad() {
    this.userInfo = uni.getStorageSync('userInfo')
    console.log('[ChangeAvatar] userInfo from storage:', this.userInfo)
    const currentAvatar = this.userInfo?.avatar_url || this.userInfo?.avatar || ''
    console.log('[ChangeAvatar] currentAvatar:', currentAvatar)
    if (currentAvatar) {
      this.previewAvatar = currentAvatar
      if (this.defaultAvatars.includes(currentAvatar)) {
        this.selectedAvatar = currentAvatar
      }
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    selectDefaultAvatar(url) {
      this.selectedAvatar = url
      this.previewAvatar = url
      this.customFilePath = ''
    },
    chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const filePath = res.tempFilePaths[0]
          const size = res.tempFiles[0]?.size || 0
          if (size > 2 * 1024 * 1024) {
            uni.showToast({ title: '图片不能超过2MB', icon: 'none' })
            return
          }
          this.customFilePath = filePath
          this.previewAvatar = filePath
          this.selectedAvatar = ''
        }
      })
    },
    async saveAvatar() {
      const userId = this.userInfo?.id || this.userInfo?.user_id
      if (!userId) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      uni.showLoading({ title: '保存中...' })

      try {
        let avatarUrl = ''

        if (this.customFilePath) {
          const res = await api.uploadAvatar(userId, this.customFilePath)
          avatarUrl = res.avatar_url
        } else if (this.selectedAvatar) {
          await api.updateUserInfo(userId, { avatar_url: this.selectedAvatar })
          avatarUrl = this.selectedAvatar
        } else {
          uni.hideLoading()
          uni.showToast({ title: '请选择头像', icon: 'none' })
          return
        }

        const updatedUser = { ...this.userInfo, avatar_url: avatarUrl, avatar: avatarUrl }
        uni.setStorageSync('userInfo', updatedUser)
        uni.$emit('userInfoUpdated', updatedUser)

        uni.hideLoading()
        uni.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 800)
      } catch (e) {
        uni.hideLoading()
        uni.showToast({ title: e.message || '保存失败', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: var(--bg-primary); display: flex; flex-direction: column; }
.header { position: fixed; top: 0; left: 0; right: 0; height: 88px; background: var(--header-bg); z-index: 999; }
.header-inner { height: 100%; display: flex; align-items: center; justify-content: center; position: relative; padding-top: 10px; }
.back-btn { position: absolute; left: 16px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
.back-icon { width: 24px; height: 24px; filter: brightness(0) invert(1); }
.brand { font-size: 20px; font-weight: 700; color: var(--text-inverse); }
.content { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 108px 20px 60px; box-sizing: border-box; }
.avatar-section { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px 16px 24px; margin-bottom: 32px; }
.section-title { font-size: 16px; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 16px; }
.avatar-section .section-title { margin-bottom: 20px; }
.default-avatars { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; justify-items: center; padding: 4px 0; }
.avatar-option { width: 56px; height: 56px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 2px solid transparent; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s; }
.avatar-option.active { border-color: var(--accent-color); box-shadow: 0 0 0 2px rgba(143, 182, 255, 0.25); }
.upload-area { display: flex; flex-direction: column; align-items: center; margin-bottom: 40px; }
.preview-avatar { margin-bottom: 16px; background: var(--bg-card); }
.preview-empty { width: 120px; height: 120px; border-radius: 50%; background: var(--bg-secondary); }
.btn-upload { padding: 10px 24px; background: transparent; color: var(--accent-color); border: 1px solid var(--accent-color); border-radius: 12px; font-size: 14px; margin-bottom: 8px; }
.upload-tip { font-size: 12px; color: var(--text-secondary); }
.actions { display: flex; gap: 16px; justify-content: center; }
.btn-cancel { padding: 12px 32px; background: transparent; color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 12px; font-size: 14px; }
.btn-save { padding: 12px 32px; background: var(--accent-color); color: #ffffff; border-radius: 12px; font-size: 14px; border: none; }
</style>
