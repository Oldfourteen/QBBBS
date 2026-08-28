<template>
  <view class="site-page">
    <view class="site-header">
      <view class="site-header__inner">
        <view class="site-brand">
          <lazy-image size="site-brand__logo" class="site-brand__logo" :src="require('@/assets/image/qb.png')" mode="aspectFit" />
          <text>QB-BBS</text>
        </view>
      </view>
    </view>

    <view class="site-hero">
      <view class="site-hero__content">
        <text class="site-hero__title">听见每一次相遇</text>
        <text class="site-hero__subtitle">爱、尊严与自由</text>
        <text class="site-hero__desc">{{ typedDesc }}<text class="typewriter-cursor">_</text></text>

        <view class="site-hero__actions">
          <button class="site-btn site-btn--primary" @tap="handleJoin">{{ isLoggedIn ? '进入社区' : '立即加入' }}</button>
          <button class="site-btn-outline" @tap="handleKnowMore">了解更多</button>
        </view>
      </view>
      <view class="site-hero__visual">
        <lazy-image size="site-hero__image" class="site-hero__image" :src="require('@/assets/image/main.png')" mode="aspectFit" />
      </view>
    </view>
  </view>
</template>

<script>
import { switchMainTab } from '@/utils/tab.js'

export default {
  props: {
    active: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isLoggedIn: false,
      fullDesc: '既来之则安之，不必悔恨当初也不必责怪当下，走好下一步该走的路，大胆的大踏步向前吧，欢迎您加入我们的app',
      typedDesc: '',
      typewriterIndex: 0,
      typewriterDeleting: false,
      typewriterTimer: null
    }
  },
  watch: {
    active(val) {
      if (val) this.onTabActive()
      else this.stopTypewriter()
    }
  },
  mounted() {
    if (this.active) this.onTabActive()
  },
  beforeDestroy() {
    this.stopTypewriter()
  },
  methods: {
    onTabActive() {
      this.checkLogin()
      this.startTypewriter()
    },
    startTypewriter() {
      this.stopTypewriter()
      this.typewriterIndex = 0
      this.typewriterDeleting = false
      this.typedDesc = ''
      this.tickTypewriter()
    },
    stopTypewriter() {
      if (!this.typewriterTimer) return
      clearTimeout(this.typewriterTimer)
      this.typewriterTimer = null
    },
    tickTypewriter() {
      const text = this.fullDesc
      if (!text) return

      if (!this.typewriterDeleting) {
        this.typewriterIndex++
        this.typedDesc = text.slice(0, this.typewriterIndex)
        if (this.typewriterIndex >= text.length) {
          this.typewriterDeleting = true
          this.typewriterTimer = setTimeout(() => this.tickTypewriter(), 2000)
          return
        }
        this.typewriterTimer = setTimeout(() => this.tickTypewriter(), 120)
        return
      }

      this.typewriterIndex--
      this.typedDesc = text.slice(0, this.typewriterIndex)
      if (this.typewriterIndex <= 0) {
        this.typewriterDeleting = false
        this.typewriterTimer = setTimeout(() => this.tickTypewriter(), 500)
        return
      }
      this.typewriterTimer = setTimeout(() => this.tickTypewriter(), 60)
    },
    checkLogin() {
      const userInfo = uni.getStorageSync('userInfo')
      this.isLoggedIn = !!userInfo
    },
    handleJoin() {
      if (this.isLoggedIn) {
        switchMainTab(1)
      } else {
        uni.navigateTo({ url: '/pages/login/index' })
      }
    },
    handleKnowMore() {
      uni.navigateTo({ url: '/pages/about/index' })
    }
  }
}
</script>

<style scoped>
.site-header__inner {
  justify-content: flex-start;
}

.site-hero {
  padding-top: var(--header-height);
}

.typewriter-cursor {
  display: inline-block;
  margin-left: 4rpx;
  animation: typewriter-blink 1s step-end infinite;
}

@keyframes typewriter-blink {
  0%,
  50% {
    opacity: 1;
  }

  50.01%,
  100% {
    opacity: 0;
  }
}
</style>
