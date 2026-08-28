<template>
  <view class="main-page">
    <swiper
      class="tab-swiper"
      :current="currentIndex"
      :duration="280"
      :disable-touch="!isLoggedIn"
      @change="onSwiperChange"
    >
      <swiper-item>
        <scroll-view scroll-y class="tab-scroll" :enable-back-to-top="currentIndex === 0">
          <home-tab :active="currentIndex === 0" />
        </scroll-view>
      </swiper-item>
      <swiper-item>
        <scroll-view
          scroll-y
          class="tab-scroll"
          :scroll-top="communityScrollTop"
          scroll-with-animation
          :enable-back-to-top="currentIndex === 1"
          :refresher-enabled="!isAppPlus"
          :refresher-triggered="!isAppPlus && communityRefreshing"
          refresher-background="#f0f7ff"
          refresher-default-style="black"
          :refresher-threshold="60"
          @scroll="onCommunityScroll"
          @refresherrefresh="onCommunityRefresh"
          @refresherrestore="onCommunityRefreshRestore"
          @refresherabort="onCommunityRefreshRestore"
          :lower-threshold="100"
          @scrolltolower="onCommunityScrollToLower"
        >
          <community-tab
            ref="communityTab"
            :active="currentIndex === 1"
            :show-back-to-top="communityShowBackToTop"
            @scroll-to-top="scrollCommunityToTop"
          />
        </scroll-view>
      </swiper-item>
      <swiper-item>
        <scroll-view
          scroll-y
          class="tab-scroll"
          :scroll-top="recommendScrollTop"
          scroll-with-animation
          :enable-back-to-top="currentIndex === 2"
          :refresher-enabled="!isAppPlus"
          :refresher-triggered="!isAppPlus && recommendRefreshing"
          refresher-background="#f0f7ff"
          refresher-default-style="black"
          :refresher-threshold="60"
          @scroll="onRecommendScroll"
          @refresherrefresh="onRecommendRefresh"
          @refresherrestore="onRecommendRefreshRestore"
          @refresherabort="onRecommendRefreshRestore"
          :lower-threshold="100"
          @scrolltolower="onRecommendScrollToLower"
        >
          <recommend-tab
            ref="recommendTab"
            :active="currentIndex === 2"
            :show-back-to-top="recommendShowBackToTop"
            @scroll-to-top="scrollRecommendToTop"
          />
        </scroll-view>
      </swiper-item>
      <swiper-item>
        <scroll-view scroll-y class="tab-scroll tab-scroll--profile" :enable-back-to-top="currentIndex === 3">
          <profile-tab :active="currentIndex === 3" />
        </scroll-view>
      </swiper-item>
    </swiper>

    <CustomTabBar
      :current="currentIndex"
      @change="switchTab"
    />
  </view>
</template>

<script>
import HomeTab from '@/components/tabs/HomeTab.vue'
import CommunityTab from '@/components/tabs/CommunityTab.vue'
import RecommendTab from '@/components/tabs/RecommendTab.vue'
import ProfileTab from '@/components/tabs/ProfileTab.vue'
import { parseTabIndex } from '@/utils/tab.js'
import { isLoggedIn } from '@/utils/auth.js'

export default {
  components: {
    HomeTab,
    CommunityTab,
    RecommendTab,
    ProfileTab
  },
  data() {
    return {
      currentIndex: 0,
      isLoggedIn: false,
      isAppPlus: process.env.UNI_PLATFORM === 'app-plus',
      communityScrollTop: 0,
      communityCurrentScrollTop: 0,
      communityShowBackToTop: false,
      communityRefreshing: false,
      recommendScrollTop: 0,
      recommendCurrentScrollTop: 0,
      recommendShowBackToTop: false,
      recommendRefreshing: false,
      _alive: true
    }
  },
  onLoad(options) {
    this.currentIndex = parseTabIndex(options.tab)
    this.checkLogin()
  },
  onShow() {
    this.checkLogin()
  },
  created() {
    uni.$on('switchMainTab', this.handleExternalSwitch)
    uni.$on('tabBarLoginChange', this.checkLogin)
  },
  onUnload() {
    this._alive = false
    uni.$off('switchMainTab', this.handleExternalSwitch)
    uni.$off('tabBarLoginChange', this.checkLogin)
  },
  methods: {
    checkLogin() {
      this.isLoggedIn = isLoggedIn()
      if (!this.isLoggedIn && this.currentIndex !== 0) {
        this.currentIndex = 0
      }
    },
    handleExternalSwitch(index) {
      this.switchTab(index)
    },
    switchTab(index) {
      if (this.currentIndex === index) return
      this.currentIndex = index
    },
    onSwiperChange(e) {
      const index = e.detail.current
      if (this.currentIndex !== index) {
        this.currentIndex = index
      }
    },
    onCommunityScroll(e) {
      const top = e.detail.scrollTop || 0
      this.communityCurrentScrollTop = top
      this.communityShowBackToTop = top > 50
    },
    scrollCommunityToTop() {
      this.communityScrollTop = this.communityCurrentScrollTop
      this.$nextTick(() => {
        this.communityScrollTop = 0
        this.communityShowBackToTop = false
      })
    },
    async onCommunityRefresh() {
      if (this.isAppPlus) return
      if (this.communityRefreshing) return
      this.communityRefreshing = true
      try {
        const tab = this.$refs.communityTab
        if (tab && typeof tab.refreshPosts === 'function') {
          await tab.refreshPosts()
        }
      } catch (e) {
        console.error('Community refresh failed:', e)
      } finally {
        setTimeout(() => {
          if (this._alive) this.communityRefreshing = false
        }, 300)
      }
    },
    onCommunityRefreshRestore() {
      this.communityRefreshing = false
    },
    onCommunityScrollToLower() {
      if (this.isAppPlus) return
      const tab = this.$refs.communityTab
      if (tab && typeof tab.loadMore === 'function') {
        tab.loadMore()
      }
    },
    async onRecommendRefresh() {
      if (this.isAppPlus) return
      if (this.recommendRefreshing) return
      this.recommendRefreshing = true
      try {
        const tab = this.$refs.recommendTab
        if (tab && typeof tab.refreshStories === 'function') {
          await tab.refreshStories()
        }
      } catch (e) {
        console.error('Recommend refresh failed:', e)
      } finally {
        setTimeout(() => {
          if (this._alive) this.recommendRefreshing = false
        }, 300)
      }
    },
    onRecommendScroll(e) {
      const top = e.detail.scrollTop || 0
      this.recommendCurrentScrollTop = top
      this.recommendShowBackToTop = top > 50
    },
    scrollRecommendToTop() {
      this.recommendScrollTop = this.recommendCurrentScrollTop
      this.$nextTick(() => {
        this.recommendScrollTop = 0
        this.recommendShowBackToTop = false
      })
    },
    onRecommendRefreshRestore() {
      this.recommendRefreshing = false
    },
    onRecommendScrollToLower() {
      if (this.isAppPlus) return
      const tab = this.$refs.recommendTab
      if (tab && typeof tab.loadMore === 'function') {
        tab.loadMore()
      }
    }
  }
}
</script>

<style scoped>
.main-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: transparent;
  box-sizing: border-box;
}

.tab-swiper {
  flex: 1;
  height: 0;
}

.tab-swiper ::v-deep uni-swiper-item {
  height: 100%;
}

.tab-swiper ::v-deep .page,
.tab-swiper ::v-deep .site-page {
  padding-bottom: var(--tabbar-height);
  min-height: 100%;
  box-sizing: border-box;
}

.tab-scroll {
  height: 100%;
  box-sizing: border-box;
}
</style>

<style lang="scss">
/* H5 scroll-view 需明确高度链，避免个人页滚动区域过短 */
uni-scroll-view.tab-scroll,
scroll-view.tab-scroll {
  height: 100% !important;
}

uni-scroll-view.tab-scroll .uni-scroll-view,
scroll-view.tab-scroll .uni-scroll-view {
  height: 100% !important;
}

/* 内容区随子节点撑开，避免滚不到底 */
uni-scroll-view.tab-scroll .uni-scroll-view-content,
scroll-view.tab-scroll .uni-scroll-view-content {
  height: auto !important;
  min-height: 100%;
  box-sizing: border-box;
}

/* 个人页：强制内容高度可滚动 */
uni-scroll-view.tab-scroll--profile .uni-scroll-view-content,
scroll-view.tab-scroll--profile .uni-scroll-view-content {
  display: block !important;
  height: auto !important;
  min-height: 100% !important;
  overflow: visible !important;
}

uni-scroll-view.tab-scroll--profile .profile-page,
scroll-view.tab-scroll--profile .profile-page {
  display: block;
  width: 100%;
  min-height: 1400px;
}
</style>
