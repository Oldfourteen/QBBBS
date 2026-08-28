<template>
  <view class="page community-page">
    <view class="header">
      <view class="header-inner">
        <lazy-image size="brand-logo" class="brand-logo" :src="require('@/assets/image/qb.png')" mode="aspectFit" />
        <text class="brand">校友圈</text>
        <view class="header-search-btn" @tap="openSearchModal">
          <lazy-image size="header-search-icon" class="header-search-icon" :src="require('@/assets/image/magnifying-glass-solid-full.svg')" mode="aspectFit" />
        </view>
      </view>
    </view>

    <view class="content">
      <view class="header-info">
        <view class="header-info-left">
          <text class="header-desc">这里汇集了校友们的最新分享</text>
        </view>
        <view class="schedule-btn" @tap="goSchedule">
          <text class="schedule-btn-text">课表</text>
        </view>
      </view>

      <view v-if="loading && !posts.length" class="loading">
        <text>加载中...</text>
      </view>

      <view v-else-if="loadError && !posts.length" class="empty">
        <text>{{ loadError }}</text>
        <text class="retry-link" @tap="retryLoad">点击重试</text>
      </view>

      <view v-else-if="posts.length === 0" class="empty">
        <text class="empty-title">暂无帖子</text>
        <text class="empty-desc">快来发布第一个吧！</text>
      </view>

      <view v-else class="posts-wrap">
        <view class="posts-list">
          <view
            class="post-card m-card"
            v-for="post in posts"
            :key="post.post_id || post.id"
            @tap="goDetail(post.post_id || post.id)"
          >
            <view class="post-header">
              <view class="post-avatar-box">
                <lazy-image
                  size="post-avatar"
                  class="post-avatar"
                  :src="post.avatar_url || post.avatar || '/static/avatar/default-avatar/user-avatar1.gif'"
                  mode="aspectFill"
                />
              </view>
              <view class="post-info">
                <view class="post-author-row">
                  <text class="post-author">{{ post.display_title || post.author_name || post.username || '匿名用户' }}</text>
                  <text class="post-type" :class="getTypeClass(post.type)">{{ getTypeLabel(post.type) }}</text>
                </view>
                <text class="post-time">{{ formatTime(post.created_at) }}</text>
              </view>
            </view>

            <text class="post-title">{{ post.title || '无标题' }}</text>
            <text v-if="getPostPreview(post)" class="post-content">{{ getPostPreview(post) }}</text>

            <view class="post-images" v-if="getImages(post).length > 0">
              <view
                v-for="(img, idx) in getImages(post).slice(0, 3)"
                :key="idx"
                class="post-image-wrap"
              >
                <lazy-image size="post-image" class="post-image" :src="img" mode="aspectFill" />
              </view>
            </view>

            <view class="post-actions">
              <view
                class="post-action-chip"
                :class="{ 'is-liked': post.is_liked || post.liked }"
                @tap.stop="handleLike(post)"
              >
                <lazy-image
                  size="action-icon-small"
                  class="action-icon"
                  :src="(post.is_liked || post.liked) ? require('@/assets/image/heart-solid-full-red.svg') : require('@/assets/image/heart-regular-full.svg')"
                  mode="aspectFit"
                />
                <text class="post-action-num">{{ post.likes_count || 0 }}</text>
              </view>
              <view class="post-action-chip">
                <lazy-image size="action-icon-small" class="action-icon" :src="require('@/assets/image/comment-dots-regular-full.svg')" mode="aspectFit" />
                <text class="post-action-num">{{ post.comments_count || 0 }}</text>
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
          :show-end="posts.length > 0"
          @retry="retryLoadMore"
        />
      </view>
    </view>

    <view class="site-fab site-fab--publish" @tap="handlePublish">
      <lazy-image size="fab-icon" class="fab-icon" :src="require('@/assets/image/pen-to-square-solid-full.svg')" mode="aspectFit" />
    </view>

    <view class="site-fab site-fab--nav" @tap="openNavModal">
      <lazy-image size="fab-icon" class="fab-icon" :src="require('@/assets/image/paperclip-solid-full.svg')" mode="aspectFit" />
    </view>

    <view v-if="showBackToTop" class="site-fab site-fab--top" @tap="handleScrollToTop">
      <lazy-image size="fab-icon" class="fab-icon" :src="require('@/assets/image/chevron-up-solid-full.svg')" mode="aspectFit" />
    </view>

    <SearchPostsModal
      :visible="showSearchModal"
      scope="community"
      @close="closeSearchModal"
    />

    <view class="nav-modal" v-if="showNavModal" @tap="closeNavModal">
      <view class="nav-modal-mask"></view>
      <view class="nav-modal-content" @tap.stop>
        <view class="nav-modal-header">
          <text class="nav-modal-title">导航大全</text>
          <view class="nav-modal-close" @tap="closeNavModal">
            <text class="nav-modal-close-icon">×</text>
          </view>
        </view>
        <view class="nav-modal-body">
          <swiper class="nav-swiper" :indicator-dots="true" indicator-color="#d1d5db" indicator-active-color="#3b82f6">
            <swiper-item v-for="(page, pageIndex) in navPages" :key="pageIndex">
              <view class="nav-page">
                <a v-for="(item, idx) in page" :key="idx" :href="item.href" target="_blank" class="nav-item">
                  <img class="nav-favicon" :src="item.icon" alt="" />
                  <text class="nav-name">{{ item.name }}</text>
                </a>
              </view>
            </swiper-item>
          </swiper>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'
import { formatTime, stripHtml } from '@/utils/index.js'
import { fetchCommunityPage } from '@/utils/postPager.js'
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
      posts: [],
      currentPage: 1,
      hasMore: false,
      pageLoading: false,
      loading: false,
      loadError: '',
      loadMoreError: '',
      _alive: true,
      showNavModal: false,
      showSearchModal: false,
      navItems: [
        { href: 'https://jwgl.qdbhu.edu.cn/', icon: 'https://favicon.im/jwgl.qdbhu.edu.cn', name: '青岛滨海学院教务系统' },
        { href: 'https://www.zhihuishu.com/', icon: 'https://favicon.im/www.zhihuishu.com', name: '知到（智慧树）官网' },
        { href: 'https://v8.chaoxing.com/', icon: 'https://favicon.im/chaoxing.com', name: '超星学习通' },
        { href: 'https://www.icourse163.org/', icon: 'https://favicon.im/www.icourse163.org', name: '中国大学MOOC慕课平台' },
        { href: 'https://www.qdbhu.edu.cn/', icon: 'https://favicon.im/www.qdbhu.edu.cn', name: '青岛滨海学院官网' },
        { href: 'http://192.168.0.37/dsksbm/', icon: 'https://favicon.im/192.168.0.37', name: '青岛滨海学院读书考试网站' },
        { href: 'https://itestcloud.unipus.cn/', icon: 'https://favicon.im/itestcloud.unipus.cn', name: 'itest智能测评云平台' },
        { href: 'https://down.gwifi.com.cn/', icon: 'https://favicon.im/down.gwifi.com.cn', name: 'GiWiFi官网（校园网）' },
        { href: 'https://www.aliyun.com/', icon: 'https://favicon.im/www.aliyun.com', name: '阿里云平台' },
        { href: 'https://www.csdn.net/', icon: 'https://favicon.im/www.csdn.net', name: 'CSDN官网' },
        { href: 'https://cloud.tencent.com/', icon: 'https://favicon.im/cloud.tencent.com', name: '腾讯云平台' },
        { href: 'https://cloud.swordsman.com.cn/', icon: 'https://favicon.im/cloud.swordsman.com.cn', name: '剑客云平台' },
        { href: 'https://www.itdog.cn/', icon: 'https://favicon.im/www.itdog.cn', name: 'itdog IP查询' },
        { href: 'https://test.ustc.edu.cn/', icon: 'https://favicon.im/test.ustc.edu.cn', name: '中国科学技术大学测速网站' },
        { href: 'https://github.com/', icon: 'https://favicon.im/github.com', name: 'GitHub官网' },
        { href: 'https://gitee.com/', icon: 'https://favicon.im/gitee.com', name: 'Gitee官网' },
        { href: 'https://tubawinui3.cn/', icon: 'https://favicon.im/tubawinui3.cn', name: '图吧工具箱' },
        { href: 'https://store.steampowered.com/', icon: 'https://favicon.im/store.steampowered.com', name: 'steam官网' },
        { href: 'https://steampp.net/', icon: 'https://favicon.im/steampp.net', name: 'steam++ 加速器' },
        { href: 'https://www.runoob.com/', icon: 'https://favicon.im/www.runoob.com', name: '菜鸟教程官网' },
        { href: 'https://www.bandisoft.com/bandizip/', icon: 'https://favicon.im/www.bandisoft.com', name: 'bandizip解压工具' },
        { href: 'https://www.minecraft.net/zh-hans', icon: 'https://favicon.im/www.minecraft.net', name: 'Minecraft官网' },
        { href: 'https://docs.ocsjs.com/', icon: 'https://favicon.im/docs.ocsjs.com', name: 'OCS网课刷课助手官网' },
        { href: 'https://tk.enncy.cn/', icon: 'https://favicon.im/tk.enncy.cn', name: '言溪题库（配套刷课OCS使用）' },
        { href: 'https://lxmusic.toside.cn/', icon: 'https://favicon.im/lxmusic.toside.cn', name: 'LX Music 免费音乐播放器' },
        { href: 'https://ys.mihoyo.com/cloud/#/', icon: 'https://favicon.im/ys.mihoyo.com', name: '云原神' },
        { href: 'https://scriptcat.org/zh-CN', icon: 'https://favicon.im/scriptcat.org', name: '脚本猫ScriptCat' }
      ]
    }
  },
  computed: {
    navPages() {
      const pages = []
      for (let i = 0; i < this.navItems.length; i += 6) {
        pages.push(this.navItems.slice(i, i + 6))
      }
      return pages
    }
  },
  watch: {
    active(val) {
      if (val && !this.posts.length && !this.pageLoading && !this.loading) {
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
    onTabActive() {
      if (!this.posts.length) {
        this.loadPage(1, false)
      }
    },
    refreshPosts() {
      this.currentPage = 1
      return this.loadPage(1, true)
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
    goFirstPage() {
      if (this.pageLoading || this.currentPage <= 1) return
      this.loadPage(1, true)
    },
    goPrevPage() {
      if (this.pageLoading || this.currentPage <= 1) return
      this.loadPage(this.currentPage - 1, true)
    },
    goNextPage() {
      if (this.pageLoading || !this.hasMore) return
      this.loadPage(this.currentPage + 1, true)
    },
    async goLastPage() {
      if (this.pageLoading || !this.hasMore) return
      this.pageLoading = true
      this.loadError = ''
      try {
        uni.showLoading({ title: '跳转尾页...' })
        let page = this.currentPage
        let lastPosts = this.posts
        let guard = 0
        let hasMore = this.hasMore
        while (hasMore && guard < 200) {
          guard += 1
          const next = await fetchCommunityPage(page + 1)
          if (!next.posts || next.posts.length === 0) {
            hasMore = false
            break
          }
          page += 1
          lastPosts = next.posts
          hasMore = next.hasMore
        }
        this.posts = lastPosts
        this.currentPage = page
        this.hasMore = hasMore
      } catch (e) {
        console.error('Go last page failed:', e)
        this.loadError = e.message || '跳转失败，请稍后重试'
        uni.showToast({ title: this.loadError, icon: 'none' })
      } finally {
        uni.hideLoading()
        this.pageLoading = false
      }
    },
    getTypeClass(type) {
      return 'type-' + (type || 'share')
    },
    getTypeLabel(type) {
      const types = { share: '分享', daily: '日常', help: '求助', anecdote: '爆料' }
      return types[type] || '分享'
    },
    getImages(post) {
      if (!post.images) return []
      try {
        return Array.isArray(post.images) ? post.images : JSON.parse(post.images)
      } catch (e) {
        return []
      }
    },
    getPostPreview(post) {
      return stripHtml(post.content || '')
    },
    async loadPage(page = 1, scrollTop = false) {
      if (this.pageLoading) return
      this.pageLoading = true
      this.loadError = ''
      if (!this.posts.length) {
        this.loading = true
      }
      if (scrollTop) {
        this.$emit('scroll-to-top')
      }

      try {
        const { posts, hasMore } = await fetchCommunityPage(page)
        this.posts = posts
        this.currentPage = page
        this.hasMore = hasMore
        this.loadError = ''
      } catch (e) {
        console.error('Load posts failed:', e)
        this.loadError = e.message || '加载失败，请稍后重试'
      } finally {
        this.loading = false
        this.pageLoading = false
      }
    },
    async handleLike(post) {
      const userInfo = uni.getStorageSync('userInfo')
      if (!userInfo) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        uni.navigateTo({ url: '/pages/login/index' })
        return
      }

      try {
        const userId = userInfo.id || userInfo.user_id
        const res = await api.likePost(post.post_id || post.id, userId)
        post.is_liked = res.is_liked
        post.likes_count = res.likes_count
      } catch (e) {
        console.error('Like failed:', e)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    goDetail(id) {
      uni.navigateTo({ url: `/pages/post-detail/index?id=${id}` })
    },
    handlePublish() {
      const userInfo = uni.getStorageSync('userInfo')
      if (!userInfo) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        uni.navigateTo({ url: '/pages/login/index' })
        return
      }
      uni.navigateTo({ url: '/pages/publish/index' })
    },
    openSearchModal() {
      this.showSearchModal = true
    },
    closeSearchModal() {
      this.showSearchModal = false
    },
    openNavModal() {
      this.showNavModal = true
    },
    closeNavModal() {
      this.showNavModal = false
    },
    handleScrollToTop() {
      this.$emit('scroll-to-top')
    },
    goSchedule() {
      uni.navigateTo({ url: '/pages/schedule/index' })
    }
  }
}
</script>

<style scoped lang="scss">
.page {
  box-sizing: border-box;
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
}

.community-page {
  min-height: 100%;
  background-color: var(--bg-primary);
  background-image: url('/static/image/xiaoyouquan.png');
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
}

@media (prefers-color-scheme: dark) {
  .community-page {
    background-image: url('/static/image/xiaoyouquan%20black.png');
  }
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
  gap: 8px;
  box-sizing: border-box;
}

.brand-logo {
  flex-shrink: 0;
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
  padding: 14px 16px 24px;
  box-sizing: border-box;
}

.header-info {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-info-left {
  flex: 1;
  min-width: 0;
}

.header-desc {
  display: block;
  font-size: 14px;
  color: #ffffff;
  line-height: 1.5;
}

.schedule-btn {
  flex-shrink: 0;
  padding: 8px 16px;
  background: var(--accent-color);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.schedule-btn:active {
  opacity: 0.88;
}

.schedule-btn-text {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  line-height: 1;
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

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
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

@media (prefers-color-scheme: light) {
  .header-desc {
    color: #ffffff;
  }

  .pager {
    background: rgba(248, 250, 252, 0.92);
    border: 1px solid #cbd5e1;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  }

  .pager-info {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #475569;
  }

  .pager-btn {
    background: #94a3b8;
    color: #ffffff;
    border: 2px solid #64748b;
    box-shadow: 0 8px 18px rgba(100, 116, 139, 0.22);
    box-sizing: border-box;
  }

  .pager-btn--ghost {
    background: #a8b2bf;
    color: #ffffff;
    border: 2px solid #64748b;
    box-shadow: 0 8px 18px rgba(100, 116, 139, 0.18);
    box-sizing: border-box;
  }

  .pager-btn:active {
    transform: translateY(1px);
  }

  .site-fab {
    background: #94a3b8;
    border: 2px solid #64748b;
    box-shadow: 0 10px 22px rgba(100, 116, 139, 0.22);
    box-sizing: border-box;
  }

  .site-fab .fab-icon {
    filter: brightness(0) invert(1);
  }
}

.post-card {
  overflow: hidden;
  margin-bottom: 0 !important;
  box-shadow: 0 2px 12px var(--shadow-color);
  transition: transform 0.15s ease;
}

.post-card:active {
  transform: scale(0.995);
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  min-width: 0;
  gap: 12px;
}

.post-avatar-box {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  max-width: 40px;
  max-height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-input);
}

.post-avatar {
  display: block;
  width: 100%;
  height: 100%;
}

.post-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.post-author-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  min-width: 0;
}

.post-author {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
  min-width: 0;
}

.post-type {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.4;
}

.post-type.type-share {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.post-type.type-daily {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.post-type.type-help {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.post-type.type-anecdote {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
}

.post-time {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.3;
}

.post-title {
  display: -webkit-box;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.45;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.post-content {
  display: -webkit-box;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  word-break: break-word;
  white-space: normal;
}

.post-images {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.post-image-wrap {
  width: 80px;
  height: 80px;
  min-width: 80px;
  min-height: 80px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-input);
}

.post-image {
  display: block;
  width: 100%;
  height: 100%;
}

.post-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.post-action-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 56px;
  height: 34px;
  padding: 0 12px;
  border-radius: 17px;
  background: var(--bg-input);
  border: 1px solid var(--border-light);
  box-sizing: border-box;
}

.post-action-chip.is-liked {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.post-action-chip.is-liked .post-action-num {
  color: #ef4444;
  font-weight: 600;
}

.post-action-chip.is-liked .action-icon {
  filter: none !important;
}

.action-icon {
  flex-shrink: 0;
  filter: var(--icon-filter);
}

.post-action-num {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1;
  min-width: 8px;
  text-align: center;
}

/* 导航弹窗 */
.nav-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.nav-modal-content {
  position: relative;
  width: 320px;
  background: var(--bg-card);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.nav-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.nav-modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.nav-modal-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.nav-modal-close-icon {
  font-size: 22px;
  color: var(--text-secondary);
  line-height: 1;
}

.nav-modal-body {
  padding: 12px 16px 20px;
}

.nav-swiper {
  height: 340px;
}

.nav-page {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  text-decoration: none;
}

.nav-item:active {
  background: var(--bg-menu-hover);
}

.nav-favicon {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  flex-shrink: 0;
}

.nav-name {
  font-size: 15px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<style>
page.dark .community-page,
.dark .community-page {
  background-image: url('/static/image/xiaoyouquan%20black.png');
}
</style>
