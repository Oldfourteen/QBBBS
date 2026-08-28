<template>
  <view class="search-modal" v-if="visible">
    <view class="search-modal-mask" @tap="handleClose"></view>
    <view class="search-modal-content" @tap.stop>
      <view class="search-modal-topbar">
        <text class="search-modal-title">搜索帖子</text>
        <view class="search-modal-close" @tap="handleClose">
          <text class="search-modal-close-icon">×</text>
        </view>
      </view>

      <view class="search-bar-row">
        <view class="search-input-shell">
          <!-- #ifdef H5 -->
          <input
            class="search-input-box"
            :class="{ 'search-input-box--focused': inputFocus, 'search-input-box--clear': !!query }"
            type="text"
            :focus="inputFocus"
            :value="query"
            placeholder="搜索标题或内容..."
            confirm-type="search"
            @input="onInput"
            @confirm="doSearch"
            @focus="inputFocus = true"
            @blur="inputFocus = false"
          />
          <!-- #endif -->
          <!-- #ifndef H5 -->
          <input
            class="search-input-box site-input site-input--search"
            :class="{ 'search-input-box--focused': inputFocus, 'search-input-box--clear': !!query }"
            type="text"
            :focus="inputFocus"
            :value="query"
            placeholder="搜索标题或内容..."
            confirm-type="search"
            @input="onInput"
            @confirm="doSearch"
            @focus="inputFocus = true"
            @blur="inputFocus = false"
          />
          <!-- #endif -->
          <lazy-image
            class="search-input-icon"
            :src="require('@/assets/image/magnifying-glass-solid-full.svg')"
            mode="aspectFit"
          />
          <view v-if="query" class="search-clear" @tap.stop="clearQuery">
            <text class="search-clear-icon">×</text>
          </view>
        </view>
      </view>

      <scroll-view class="search-modal-body" scroll-y>
        <view v-if="!query.trim()" class="search-empty">
          <view class="search-empty-icon-wrap">
            <lazy-image
              class="search-empty-icon"
              :src="require('@/assets/image/magnifying-glass-solid-full.svg')"
              mode="aspectFit"
            />
          </view>
          <text class="search-empty-title">查找感兴趣的帖子</text>
          <text class="search-empty-desc">输入关键词，搜索标题或正文内容</text>
        </view>

        <view v-else-if="loading" class="search-loading">
          <view class="search-spinner"></view>
          <text class="search-loading-text">正在搜索...</text>
        </view>

        <view v-else-if="error" class="search-empty search-empty--error">
          <text class="search-empty-title">{{ error }}</text>
          <text class="search-empty-desc" @tap="doSearch">点击重试</text>
        </view>

        <view v-else-if="results.length === 0" class="search-empty">
          <view class="search-empty-icon-wrap search-empty-icon-wrap--muted">
            <lazy-image
              class="search-empty-icon"
              :src="require('@/assets/image/file-lines-regular-full.svg')"
              mode="aspectFit"
            />
          </view>
          <text class="search-empty-title">未找到相关帖子</text>
          <text class="search-empty-desc">换个关键词试试吧</text>
        </view>

        <view v-else class="search-results">
          <text class="search-results-count">找到 {{ results.length }} 条结果</text>
          <view
            v-for="post in results"
            :key="post.post_id || post.id"
            class="search-result-item"
            @tap="goDetail(post.post_id || post.id)"
          >
            <view class="search-result-icon">
              <lazy-image
                class="search-result-icon-img"
                :src="require('@/assets/image/file-lines-regular-full.svg')"
                mode="aspectFit"
              />
            </view>
            <view class="search-result-info">
              <text class="search-result-title">{{ post.title || '无标题' }}</text>
              <view class="search-result-meta">
                <text>{{ post.display_title || post.username || '匿名' }}</text>
                <text class="meta-dot">·</text>
                <text>{{ formatDate(post.created_at) }}</text>
              </view>
            </view>
            <text class="search-result-arrow">›</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  name: 'SearchPostsModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    scope: {
      type: String,
      default: 'community',
      validator: (val) => ['community', 'recommend'].includes(val)
    }
  },
  data() {
    return {
      query: '',
      results: [],
      loading: false,
      error: '',
      inputFocus: false,
      debounceTimer: null,
      _alive: true
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.query = ''
        this.results = []
        this.error = ''
        this.loading = false
        this.$nextTick(() => {
          this.inputFocus = true
        })
      } else {
        this.inputFocus = false
        this.clearDebounce()
      }
    }
  },
  beforeDestroy() {
    this._alive = false
    this.clearDebounce()
  },
  methods: {
    clearDebounce() {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
        this.debounceTimer = null
      }
    },
    handleClose() {
      this.$emit('close')
    },
    clearQuery() {
      this.query = ''
      this.results = []
      this.loading = false
      this.error = ''
      this.clearDebounce()
      this.inputFocus = true
    },
    onInput(e) {
      this.query = e.detail ? e.detail.value : e.target.value
      this.clearDebounce()
      const trimmed = this.query.trim()
      if (!trimmed) {
        this.results = []
        this.loading = false
        this.error = ''
        return
      }
      this.debounceTimer = setTimeout(() => {
        this.doSearch()
      }, 300)
    },
    async doSearch() {
      const trimmed = this.query.trim()
      if (!trimmed) return

      this.loading = true
      this.error = ''

      try {
        const userInfo = uni.getStorageSync('userInfo')
        const userId = userInfo?.id || userInfo?.user_id || 0
        const posts = await api.searchPosts(trimmed, userId)
        if (!this._alive) return
        this.results = this.filterByScope(Array.isArray(posts) ? posts : [])
      } catch (e) {
        if (!this._alive) return
        console.error('Search failed:', e)
        this.error = '搜索失败，请重试'
        this.results = []
      } finally {
        if (this._alive) this.loading = false
      }
    },
    filterByScope(posts) {
      if (this.scope === 'community') {
        return posts.filter(post => {
          const isAnecdote = post.type === 'anecdote' ||
            (post.title && post.title.startsWith('【青滨志异】')) ||
            (post.content && post.content.includes('#奇闻异事'))
          return !isAnecdote
        })
      }
      return posts.filter(post => {
        return post.type === 'anecdote' ||
          (post.title && post.title.startsWith('【青滨志异】')) ||
          (post.content && post.content.includes('#爆料'))
      })
    },
    formatDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      if (Number.isNaN(date.getTime())) return ''
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    },
    goDetail(id) {
      this.handleClose()
      uni.navigateTo({ url: `/pages/post-detail/index?id=${id}` })
    }
  }
}
</script>

<style scoped>
.search-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 72px 16px 24px;
}

.search-modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay-bg, rgba(0, 0, 0, 0.6));
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.search-modal-content {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: var(--bg-modal, var(--bg-card, #ffffff));
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.18);
}

.search-modal-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 0;
}

.search-modal-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary, #1f2937);
  letter-spacing: 0.2px;
}

.search-modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--bg-input, #f1f5f9);
  flex-shrink: 0;
}

.search-modal-close:active {
  opacity: 0.7;
}

.search-modal-close-icon {
  font-size: 20px;
  color: var(--text-secondary, #64748b);
  line-height: 1;
  margin-top: -1px;
}

.search-bar-row {
  padding: 14px 20px 16px;
}

.search-input-shell {
  position: relative;
}

.search-input-box {
  display: block;
  width: 100%;
  height: 46px;
  padding: 0 14px 0 42px;
  margin: 0;
  border: 1.5px solid transparent;
  border-radius: 14px;
  background: var(--bg-input, #f8fafc);
  font-size: 15px;
  line-height: 46px;
  color: var(--text-primary, #1f2937);
  box-sizing: border-box;
  outline: none;
  box-shadow: none;
  -webkit-appearance: none;
  appearance: none;
  transition: border-color 0.2s, background 0.2s;
}

.search-input-box--focused {
  border-color: var(--accent-color, #3b82f6);
  background: var(--bg-card, #ffffff);
}

.search-input-box--clear {
  padding-right: 44px;
}

.search-input-box::placeholder {
  color: var(--text-secondary, #64748b);
  font-size: 15px;
}

.search-input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  opacity: 0.45;
  filter: var(--icon-filter, none);
  pointer-events: none;
  z-index: 1;
}

.search-clear {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--border-light, #e2e8f0);
}

.search-clear-icon {
  font-size: 16px;
  color: var(--text-secondary, #64748b);
  line-height: 1;
}

.search-modal-body {
  max-height: 52vh;
  min-height: 160px;
  border-top: 1px solid var(--border-light, #f1f5f9);
}

.search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 24px 40px;
  text-align: center;
}

.search-empty--error .search-empty-desc {
  color: var(--accent-color, #3b82f6);
  margin-top: 8px;
}

.search-empty-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.search-empty-icon-wrap--muted {
  background: var(--bg-input, #f1f5f9);
}

.search-empty-icon {
  width: 26px;
  height: 26px;
  opacity: 0.5;
  filter: var(--icon-filter, none);
}

.search-empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin-bottom: 6px;
}

.search-empty-desc {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
  line-height: 1.5;
}

.search-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 14px;
}

.search-spinner {
  width: 28px;
  height: 28px;
  border: 2.5px solid var(--border-light, #e2e8f0);
  border-top-color: var(--accent-color, #3b82f6);
  border-radius: 50%;
  animation: search-spin 0.7s linear infinite;
}

@keyframes search-spin {
  to { transform: rotate(360deg); }
}

.search-loading-text {
  font-size: 14px;
  color: var(--text-secondary, #64748b);
}

.search-results {
  padding: 12px 12px 16px;
}

.search-results-count {
  display: block;
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  padding: 0 8px 10px;
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 12px 10px;
  border-radius: 12px;
  margin-bottom: 2px;
  transition: background 0.15s;
}

.search-result-item:active {
  background: var(--bg-input, #f3f4f6);
}

.search-result-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.search-result-icon-img {
  width: 18px;
  height: 18px;
  filter: var(--icon-filter, none);
  opacity: 0.7;
}

.search-result-info {
  flex: 1;
  min-width: 0;
}

.search-result-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--text-primary, #1f2937);
  display: block;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-result-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary, #64748b);
}

.meta-dot {
  color: var(--text-secondary, #64748b);
  opacity: 0.6;
}

.search-result-arrow {
  font-size: 20px;
  color: var(--text-secondary, #94a3b8);
  opacity: 0.5;
  margin-left: 4px;
  flex-shrink: 0;
  line-height: 1;
}
</style>
