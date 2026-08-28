<template>
  <view class="page recommend-page">
    <view class="header">
      <view class="header-inner">
        <lazy-image size="brand-logo" class="brand-logo" :src="require('@/assets/image/qbbbs.png')" mode="aspectFit" />
        <text class="brand">青滨志异</text>
        <view class="header-search-btn" @tap="openSearchModal">
          <lazy-image size="header-search-icon" class="header-search-icon" :src="require('@/assets/image/magnifying-glass-solid-full.svg')" mode="aspectFit" />
        </view>
      </view>
    </view>

    <view class="content">
      <view class="page-hero">
        <text class="page-hero__desc">校园难绷事情大爆料</text>
        <scroll-view scroll-x class="hot-words-scroll" :show-scrollbar="false">
          <view class="hot-words">
            <text class="hot-word">难绷</text>
            <text class="hot-word">这期神了</text>
            <text class="hot-word">这不阴？</text>
            <text class="hot-word">喵喵喵</text>
            <text class="hot-word">太神秘了</text>
            <text class="hot-word">逆天</text>
          </view>
        </scroll-view>
      </view>

      <view class="sort-tabs">
        <view class="sort-tabs__track">
          <view class="sort-tab" :class="{ active: sortType === 'boost' }" @tap="switchSort('boost')">
            <text>按助力</text>
          </view>
          <view class="sort-tab" :class="{ active: sortType === 'newest' }" @tap="switchSort('newest')">
            <text>最新发布</text>
          </view>
        </view>
      </view>

      <view v-if="loading && !stories.length" class="loading">
        <text>正在加载爆料...</text>
      </view>

      <view v-else-if="loadError && !stories.length" class="empty">
        <text>{{ loadError }}</text>
        <text class="retry-link" @tap="retryLoad">点击重试</text>
      </view>

      <view v-else-if="stories.length === 0" class="empty">
        <lazy-image size="empty-icon" class="empty-icon" :src="require('@/assets/image/qbbbs.png')" mode="aspectFit" />
        <text class="empty-title">暂无爆料</text>
        <text class="empty-desc">快来分享你的爆料吧！</text>
      </view>

      <view v-else class="stories-wrap">
        <view class="stories-list">
          <view
            class="story-card m-card m-card--story"
            :class="{ 'is-hot': isTopBoosted(story, index) }"
            v-for="(story, index) in stories"
            :key="story.post_id || story.id"
            @tap="goDetail(story.post_id || story.id)"
          >
            <view v-if="getFirstImage(story)" class="story-cover">
              <lazy-image size="story-image" class="story-cover__img" :src="getFirstImage(story)" mode="aspectFill" />
              <view v-if="isTopBoosted(story, index)" class="story-hot-badge">
                <text>🔥 高赞热门</text>
              </view>
            </view>

            <view class="story-body">
              <view class="story-head">
                <text class="story-title">{{ story.title || '爆料' }}</text>
                <text class="story-time">{{ formatTime(story.created_at) }}</text>
              </view>

              <text v-if="getStoryPreview(story)" class="story-content">{{ getStoryPreview(story) }}</text>

              <view class="story-footer">
                <text class="story-tag">爆料</text>
                <view class="story-actions">
                  <view class="story-action-chip" :class="{ 'is-boost': (story.boost_count || 0) > 0 }">
                    <lazy-image size="action-icon-small" class="action-icon boost-icon" :src="require('@/assets/image/bolt-solid-full.svg')" mode="aspectFit" />
                    <text class="story-action-num">{{ story.boost_count || 0 }}</text>
                  </view>
                  <view class="story-action-chip" :class="{ 'is-liked': story.is_liked || story.liked }">
                    <lazy-image
                      size="action-icon-small"
                      class="action-icon"
                      :src="(story.is_liked || story.liked)
                        ? require('@/assets/image/heart-solid-full-red.svg')
                        : require('@/assets/image/heart-regular-full.svg')"
                      mode="aspectFit"
                    />
                    <text class="story-action-num">{{ story.likes_count || 0 }}</text>
                  </view>
                  <view class="story-action-chip">
                    <lazy-image size="action-icon-small" class="action-icon" :src="require('@/assets/image/comment-dots-regular-full.svg')" mode="aspectFit" />
                    <text class="story-action-num">{{ story.comments_count || 0 }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view v-if="isAppPlus" class="pager">
          <text class="pager-info">{{ pageLoading ? '翻页中...' : ('第 ' + currentPage + ' 页') }}</text>
          <view class="pager-actions">
            <button class="pager-btn pager-btn--ghost" :disabled="currentPage <= 1 || pageLoading" @tap="goFirstPage">首页</button>
            <button class="pager-btn" :disabled="currentPage <= 1 || pageLoading" @tap="goPrevPage">上一页</button>
            <button class="pager-btn" :disabled="!hasMore || pageLoading" @tap="goNextPage">下一页</button>
            <button class="pager-btn pager-btn--ghost" :disabled="!hasMore || pageLoading" @tap="goLastPage">尾页</button>
          </view>
        </view>
        <LoadMoreFooter
          v-else
          :loading="pageLoading"
          :has-more="hasMore"
          :error="loadMoreError"
          :show-end="stories.length > 0"
          @retry="retryLoadMore"
        />
      </view>
    </view>

    <view v-if="showBackToTop" class="site-fab site-fab--top" @tap="handleScrollToTop">
      <lazy-image size="fab-icon" class="fab-icon" :src="require('@/assets/image/chevron-up-solid-full.svg')" mode="aspectFit" />
    </view>

    <SearchPostsModal
      :visible="showSearchModal"
      scope="recommend"
      @close="closeSearchModal"
    />

    <view class="scroll-tail" aria-hidden="true"></view>
  </view>
</template>

<script>
import { formatTime, stripHtml } from '@/utils/index.js'
import { fetchRecommendPage } from '@/utils/postPager.js'
import SearchPostsModal from '@/components/SearchPostsModal.vue'
import LoadMoreFooter from '@/components/LoadMoreFooter.vue'

export default {
  components: { SearchPostsModal, LoadMoreFooter },
  props: {
    active: {
      type: Boolean,
      default: false
    },
    showBackToTop: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isAppPlus: process.env.UNI_PLATFORM === 'app-plus',
      stories: [],
      currentPage: 1,
      hasMore: false,
      pageLoading: false,
      loading: false,
      loadError: '',
      loadMoreError: '',
      _alive: true,
      showSearchModal: false,
      sortType: 'boost'
    }
  },
  watch: {
    active(val) {
      if (val && !this.stories.length && !this.pageLoading) {
        this.loadPage(1, false)
      }
    }
  },
  mounted() {
    if (this.active) {
      this.loadPage(1, false)
    }
  },
  beforeDestroy() {
    this._alive = false
  },
  activated() {
    this._alive = true
  },
  deactivated() {
    this._alive = false
  },
  methods: {
    formatTime,
    refreshStories() {
      this.currentPage = 1
      return this.loadPage(1, true)
    },
    goFirstPage() {
      if (this.pageLoading || this.currentPage <= 1) return
      this.loadPage(1, true, false)
    },
    goPrevPage() {
      if (this.pageLoading || this.currentPage <= 1) return
      this.loadPage(this.currentPage - 1, true, false)
    },
    goNextPage() {
      if (this.pageLoading || !this.hasMore) return
      this.loadPage(this.currentPage + 1, true, false)
    },
    async goLastPage() {
      if (this.pageLoading || !this.hasMore) return
      this.pageLoading = true
      this.loadError = ''
      this.loadMoreError = ''
      try {
        uni.showLoading({ title: '跳转尾页...' })
        let page = this.currentPage
        let lastStories = this.stories
        let guard = 0
        let hasMore = this.hasMore
        while (hasMore && guard < 200) {
          guard += 1
          const next = await fetchRecommendPage(page + 1)
          if (!next.posts || next.posts.length === 0) {
            hasMore = false
            break
          }
          let sorted = next.posts
          if (this.sortType === 'newest') {
            sorted = [...sorted].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          }
          page += 1
          lastStories = sorted
          hasMore = next.hasMore
        }
        this.stories = lastStories
        this.currentPage = page
        this.hasMore = hasMore
      } catch (e) {
        console.error('Go last page failed:', e)
        const message = e.message || '跳转失败，请稍后重试'
        this.loadError = message
        uni.showToast({ title: message, icon: 'none' })
      } finally {
        uni.hideLoading()
        this.pageLoading = false
      }
    },
    switchSort(type) {
      if (this.sortType === type) return
      this.sortType = type
      this.currentPage = 1
      this.loadPage(1, true)
    },
    isTopBoosted(story, index) {
      return this.sortType === 'boost' && this.currentPage === 1 && (story.boost_count || 0) > 0 && index < 3
    },
    retryLoad() {
      return this.loadPage(this.currentPage, true)
    },
    loadMore() {
      if (!this.hasMore || this.pageLoading) return
      this.loadPage(this.currentPage + 1, false, true)
    },
    retryLoadMore() {
      if (this.pageLoading) return
      this.loadMoreError = ''
      this.loadPage(this.currentPage + 1, false, true)
    },
    getFirstImage(story) {
      if (!story.images) return null
      try {
        const images = Array.isArray(story.images) ? story.images : JSON.parse(story.images)
        return images.length > 0 ? images[0] : null
      } catch (e) {
        return null
      }
    },
    getStoryPreview(story) {
      return stripHtml(story.content || '').trim()
    },
    async loadPage(page = 1, scrollTop = false, append = false) {
      if (this.pageLoading) return
      this.pageLoading = true
      if (!append) {
        this.loadError = ''
      }
      this.loadMoreError = ''
      if (!this.stories.length && !append) {
        this.loading = true
      }
      if (scrollTop) {
        this.$emit('scroll-to-top')
      }

      try {
        const { posts, hasMore } = await fetchRecommendPage(page)
        let sortedPosts = posts
        if (this.sortType === 'newest') {
          sortedPosts = [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        }
        if (append) {
          this.stories = [...this.stories, ...sortedPosts]
        } else {
          this.stories = sortedPosts
        }
        this.currentPage = page
        this.hasMore = hasMore
        this.loadError = ''
        this.loadMoreError = ''
      } catch (e) {
        console.error('Load stories failed:', e)
        const message = e.message || '加载失败，请稍后重试'
        if (append) {
          this.loadMoreError = message
        } else {
          this.loadError = message
        }
      } finally {
        this.loading = false
        this.pageLoading = false
      }
    },
    goDetail(id) {
      uni.navigateTo({ url: `/pages/post-detail/index?id=${id}` })
    },
    openSearchModal() {
      this.showSearchModal = true
    },
    closeSearchModal() {
      this.showSearchModal = false
    },
    handleScrollToTop() {
      this.$emit('scroll-to-top')
    }
  }
}
</script>

<style scoped lang="scss">
.page {
  background-color: var(--bg-primary);
  box-sizing: border-box;
}

.recommend-page {
  min-height: 100%;
  background-image: url('/static/image/qingbinzhiyi.png');
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
}

@media (prefers-color-scheme: dark) {
  .recommend-page {
    background-image: url('/static/image/qingbinzhiyi%20black.png');
  }
}

page.dark .recommend-page,
.dark .recommend-page {
  background-image: url('/static/image/qingbinzhiyi%20black.png');
}

.header {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: var(--header-bg);
  border-bottom: 1px solid var(--header-border);
  z-index: 999;
  box-sizing: border-box;
}

.header-inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 10px 16px 0;
  box-sizing: border-box;
}

.brand-logo {
  flex-shrink: 0;
  margin-right: 8px;
}

.brand {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-inverse);
  letter-spacing: 0.5px;
}

.header-search-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 5px;
  border-radius: 50%;
}

.header-search-btn:active {
  background: rgba(255, 255, 255, 0.1);
}

.header-search-icon {
  filter: brightness(0) invert(1);
}

.content {
  padding: 14px 16px 0;
  box-sizing: border-box;
}

.scroll-tail {
  height: calc(24px + env(safe-area-inset-bottom));
  flex-shrink: 0;
}

.page-hero {
  margin-bottom: 32px;
}

.page-hero__desc {
  display: block;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 16px;
}

@media (prefers-color-scheme: light) {
  .page-hero__desc {
    color: #142850;
  }
}

.hot-words-scroll {
  width: 100%;
  white-space: nowrap;
}

.hot-words {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}

.hot-word {
  flex-shrink: 0;
  font-size: 11px;
  line-height: 1;
  color: var(--accent-color);
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.25);
  padding: 5px 11px;
  border-radius: 14px;
}

.sort-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.sort-tabs__track {
  display: inline-flex;
  align-items: center;
  background: var(--bg-input);
  border-radius: 18px;
  padding: 2px;
  border: 1px solid var(--border-color);
  box-sizing: border-box;
}

.sort-tab {
  padding: 7px 20px;
  border-radius: 16px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.3;
  transition: background 0.2s, color 0.2s;
}

.sort-tab.active {
  background: var(--accent-color);
  color: var(--text-inverse);
  font-weight: 600;
}

.loading,
.empty {
  text-align: center;
  padding: 48px 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

.empty-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.empty-desc {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
}

.retry-link {
  display: block;
  margin-top: 12px;
  color: var(--accent-color);
  font-size: 14px;
}

.empty-icon {
  margin: 0 auto 16px;
  opacity: 0.6;
}

.stories-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pager {
  margin-top: 14px;
  padding: 12px;
  border-radius: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  box-sizing: border-box;
}

.pager-info {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-input);
  border: 1px solid var(--border-light);
  box-sizing: border-box;
  margin: 0 auto 10px;
}

.pager-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pager-btn {
  flex: 1 1 calc(50% - 10px);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  line-height: 1;
  padding: 0 12px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-inverse);
  background: var(--accent-color);
  border: none;
}

.pager-btn::after {
  border: none;
}

.pager-btn--ghost {
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.pager-btn[disabled] {
  opacity: 0.45;
}

.story-card {
  overflow: hidden;
  transition: transform 0.15s ease;
  box-shadow: 0 2px 12px var(--shadow-color);
}

.story-card:active {
  transform: scale(0.995);
}

.story-card.is-hot {
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.15);
}

.story-cover {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: var(--bg-input);
}

.story-cover__img {
  width: 100%;
  height: 100%;
}

.story-hot-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  padding: 4px 10px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.92), rgba(234, 88, 12, 0.92));
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.4;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.story-body {
  padding: 14px 14px 12px;
  box-sizing: border-box;
}

.story-head {
  margin-bottom: 10px;
}

.story-title {
  display: -webkit-box;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.45;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.story-time {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.3;
}

.story-content {
  display: -webkit-box;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  word-break: break-word;
  white-space: normal;
}

.story-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
  gap: 10px;
  min-height: 36px;
}

.story-tag {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.3;
}

.story-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.story-action-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 48px;
  height: 32px;
  padding: 0 10px;
  border-radius: 16px;
  background: var(--bg-input);
  border: 1px solid var(--border-light);
  box-sizing: border-box;
}

.story-action-chip.is-boost {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.35);
}

.story-action-chip.is-boost .story-action-num {
  color: #f59e0b;
  font-weight: 600;
}

.story-action-chip.is-boost .boost-icon {
  filter: none !important;
}

.story-action-chip.is-liked .story-action-num {
  color: #ef4444;
}

.story-action-chip.is-liked .action-icon {
  filter: none;
}

.action-icon {
  flex-shrink: 0;
  filter: var(--icon-filter);
}

.story-action-num {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1;
  min-width: 8px;
  text-align: center;
}
</style>
