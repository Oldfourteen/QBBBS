<template>
  <view class="page">
    <view class="header">
      <view class="header-inner">
        <view class="back-btn" @tap="goBack">
          <lazy-image class="back-icon" :src="require('@/assets/image/chevron-left-solid-full.svg')" mode="aspectFit" />
        </view>
        <text class="brand">发布帖子</text>
        <view class="header-action">
          <button class="btn-publish-top" @tap="handleSubmit" :disabled="loading || !title.trim()">
            {{ loading ? '发布中' : '发布' }}
          </button>
        </view>
      </view>
    </view>

    <view class="content">
      <!-- 标题输入 -->
      <view class="title-section">
        <input
          class="title-input"
          v-model="title"
          placeholder="请输入标题，让更多人看到..."
          maxlength="60"
        />
        <text class="title-count">{{ title.length }}/60</text>
      </view>

      <!-- 富文本编辑器 -->
      <view class="editor-section">
        <rich-text-editor
          ref="editor"
          placeholder="分享你的故事、经验或求助内容..."
          @change="onContentChange"
        />
      </view>

      <!-- 分类选择 -->
      <view class="section-card">
        <view class="section-header">
          <view class="section-icon">
            <lazy-image class="section-icon-img" :src="require('@/assets/image/list-solid-full.svg')" mode="aspectFit" />
          </view>
          <text class="section-title">选择分类</text>
        </view>
        <view class="type-selector">
          <view
            class="type-item"
            :class="{ active: type === 'share' }"
            @tap="type = 'share'"
          >
            <lazy-image class="type-icon-img" :src="require('@/assets/image/pen-nib-solid-full.svg')" mode="aspectFit" />
            <text class="type-label">分享</text>
          </view>
          <view
            class="type-item"
            :class="{ active: type === 'daily' }"
            @tap="type = 'daily'"
          >
            <lazy-image class="type-icon-img" :src="require('@/assets/image/image-regular-full.svg')" mode="aspectFit" />
            <text class="type-label">日常</text>
          </view>
          <view
            class="type-item"
            :class="{ active: type === 'help' }"
            @tap="type = 'help'"
          >
            <lazy-image class="type-icon-img" :src="require('@/assets/image/handshake-angle-solid-full.svg')" mode="aspectFit" />
            <text class="type-label">求助</text>
          </view>
        </view>
      </view>

      <!-- 图片上传 -->
      <view class="section-card">
        <view class="section-header">
          <view class="section-icon">
            <lazy-image class="section-icon-img" :src="require('@/assets/image/image-regular-full.svg')" mode="aspectFit" />
          </view>
          <text class="section-title">添加图片</text>
          <text class="section-subtitle">（可选，最多9张）</text>
        </view>
        <view class="image-uploader">
          <view
            class="image-preview"
            v-for="(img, idx) in images"
            :key="idx"
          >
            <lazy-image class="preview-img" :src="img" mode="aspectFill" />
            <view class="image-remove" @tap="removeImage(idx)">
              <text class="remove-icon">×</text>
            </view>
          </view>
          <view class="upload-btn" @tap="chooseImage" v-if="images.length < 9">
            <lazy-image class="upload-icon-img" :src="require('@/assets/image/pen-to-square-solid-full.svg')" mode="aspectFit" />
            <text class="upload-text">添加图片</text>
          </view>
        </view>
      </view>

      <!-- 底部发布按钮 -->
      <view class="bottom-actions">
        <button class="btn-submit" @tap="handleSubmit" :disabled="loading || !title.trim()">
          <lazy-image class="btn-icon-img" :src="require('@/assets/image/pen-to-square-solid-full.svg')" mode="aspectFit" />
          <text class="btn-text">{{ loading ? '发布中...' : '发布帖子' }}</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'
import RichTextEditor from '@/components/RichTextEditor.vue'

export default {
  components: { RichTextEditor },
  data() {
    return {
      title: '',
      content: '',
      type: 'share',
      loading: false,
      images: []
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    onContentChange(html) {
      this.content = html
    },
    chooseImage() {
      const remain = 9 - this.images.length
      uni.chooseImage({
        count: remain,
        success: (res) => {
          const tempPaths = res.tempFilePaths
          uni.showLoading({ title: '上传中...' })
          const uploads = tempPaths.map(path =>
            new Promise((resolve, reject) => {
              uni.uploadFile({
                url: '/api/upload',
                filePath: path,
                name: 'file',
                success: (uploadRes) => {
                  try {
                    const data = JSON.parse(uploadRes.data)
                    const url = data.url || data.data?.url
                    resolve(url || null)
                  } catch (e) {
                    resolve(null)
                  }
                },
                fail: () => resolve(null)
              })
            })
          )
          Promise.all(uploads).then(urls => {
            uni.hideLoading()
            const validUrls = urls.filter(u => u)
            if (validUrls.length) {
              this.images = [...this.images, ...validUrls]
            }
            if (validUrls.length < tempPaths.length) {
              uni.showToast({ title: '部分图片上传失败', icon: 'none' })
            }
          })
        }
      })
    },
    removeImage(index) {
      this.images.splice(index, 1)
    },
    async handleSubmit() {
      if (!this.title.trim()) {
        uni.showToast({ title: '请输入标题', icon: 'none' })
        return
      }
      if (!this.content.trim()) {
        uni.showToast({ title: '请输入内容', icon: 'none' })
        return
      }

      const userInfo = uni.getStorageSync('userInfo')
      if (!userInfo) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        uni.navigateTo({ url: '/pages/login/index' })
        return
      }

      this.loading = true
      try {
        await api.createPost({
          user_id: userInfo.id || userInfo.user_id,
          title: this.title.trim(),
          content: this.content,
          type: this.type,
          images: this.images
        })
        uni.showToast({ title: '发布成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } catch (e) {
        console.error('Publish failed:', e)
        uni.showToast({ title: e.message || '发布失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: var(--bg-primary); }

/* Header */
.header { position: fixed; top: 0; left: 0; right: 0; height: 88px; background: var(--header-bg); z-index: 999; }
.header-inner { height: 100%; display: flex; align-items: center; justify-content: center; position: relative; padding-top: 10px; }
.back-btn { position: absolute; left: 12px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.back-btn:active { background: rgba(255,255,255,0.1); }
.back-icon { width: 22px; height: 22px; filter: brightness(0) invert(1); }
.brand { font-size: 18px; font-weight: 700; color: var(--text-inverse); }
.header-action { position: absolute; right: 16px; }
.btn-publish-top {
  height: 32px;
  padding: 0 16px;
  background: var(--accent-color);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 16px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-publish-top[disabled] { opacity: 0.5; }

/* Content */
.content { padding: 104px 16px 40px; }

/* Title Section */
.title-section {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 16px 18px;
  margin-bottom: 12px;
  position: relative;
}
.title-input {
  width: 100%;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  background: transparent;
  border: none;
  padding: 0;
  line-height: 1.4;
}
.title-input::placeholder {
  color: var(--text-secondary);
  font-weight: 500;
}
.title-count {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

/* Editor Section */
.editor-section {
  margin-bottom: 12px;
}

/* Section Card */
.section-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 12px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.section-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.section-icon-img {
  width: 18px;
  height: 18px;
}
.section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}
.section-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: 4px;
}

/* Type Selector */
.type-selector {
  display: flex;
  gap: 12px;
}
.type-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 0;
  border-radius: 14px;
  background: var(--bg-input);
  border: 2px solid transparent;
  transition: all 0.2s;
}
.type-item:active {
  transform: scale(0.97);
}
.type-item.active {
  background: rgba(59, 130, 246, 0.1);
  border-color: var(--accent-color);
}
.type-icon-img {
  width: 28px;
  height: 28px;
}
.type-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}
.type-item.active .type-label {
  color: var(--accent-color);
}

/* Image Uploader */
.image-uploader {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.image-preview {
  position: relative;
  width: calc(33.333% - 7px);
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
}
.preview-img {
  width: 100%;
  height: 100%;
}
.image-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.remove-icon {
  color: #ffffff;
  font-size: 14px;
  line-height: 1;
}
.upload-btn {
  width: calc(33.333% - 7px);
  aspect-ratio: 1;
  border-radius: 12px;
  border: 2px dashed var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: var(--bg-input);
}
.upload-btn:active {
  border-color: var(--accent-color);
  background: rgba(59, 130, 246, 0.05);
}
.upload-icon-img {
  width: 24px;
  height: 24px;
}
.upload-text {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Bottom Actions */
.bottom-actions {
  margin-top: 8px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}
.btn-submit {
  width: 100%;
  height: 52px;
  background: var(--accent-color);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  border-radius: 12px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-submit[disabled] {
  opacity: 0.5;
}
.btn-icon-img {
  width: 18px;
  height: 18px;
  filter: brightness(0) invert(1);
}
</style>
