<template>
  <view class="custom-tab-bar" v-if="isLoggedIn">
    <view class="tab-bar-inner">
      <view class="tab-slider" :style="sliderStyle"></view>
      <view
        v-for="(item, index) in tabs"
        :key="item.key"
        class="tab-item"
        :class="{ active: currentIndex === index }"
        @tap="handleTap(index)"
      >
        <view class="tab-icon-wrapper">
          <lazy-image size="tab-icon" class="tab-icon"
            :src="currentIndex === index ? item.selectedIconPath : item.iconPath"
            mode="aspectFit"
            :lazy-load="false"
          />
        </view>
        <text class="tab-text">{{ item.text }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { isLoggedIn } from '@/utils/auth.js'

export default {
  props: {
    current: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      isLoggedIn: false,
      tabs: [
        {
          key: 'home',
          text: '首页',
          iconPath: '/static/image/home.svg',
          selectedIconPath: '/static/image/home-active.svg'
        },
        {
          key: 'community',
          text: '校友圈',
          iconPath: '/static/image/community.svg',
          selectedIconPath: '/static/image/community-active.svg'
        },
        {
          key: 'recommend',
          text: '青滨志异',
          iconPath: '/static/image/face-grin-squint-tears-regular-full.svg',
          selectedIconPath: '/static/image/face-grin-squint-tears-regular-full.svg'
        },
        {
          key: 'profile',
          text: '我的',
          iconPath: '/static/image/profile.svg',
          selectedIconPath: '/static/image/profile-active.svg'
        }
      ]
    }
  },
  computed: {
    currentIndex() {
      return this.current
    },
    sliderStyle() {
      const tabWidth = 100 / this.tabs.length
      return {
        transform: `translateX(${this.currentIndex * 100}%)`,
        width: `${tabWidth}%`
      }
    }
  },
  created() {
    this.checkLogin()
    uni.$on('tabBarLoginChange', this.checkLogin)
  },
  beforeDestroy() {
    uni.$off('tabBarLoginChange', this.checkLogin)
  },
  methods: {
    checkLogin() {
      this.isLoggedIn = isLoggedIn()
    },
    handleTap(index) {
      if (this.currentIndex === index) return
      this.$emit('change', index)
    }
  }
}
</script>

<style scoped>
.custom-tab-bar {
  position: fixed;
  bottom: 0;
  left: 12px;
  right: 12px;
  z-index: 9999;
  background: transparent !important;
  border: none !important;
  box-sizing: border-box;
  padding-bottom: env(safe-area-inset-bottom);
  pointer-events: none;
}

.tab-bar-inner {
  position: relative;
  display: flex;
  align-items: center;
  height: 56px;
  margin-bottom: 6px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 4px 24px rgba(20, 40, 80, 0.1);
  overflow: hidden;
  pointer-events: auto;
}

@media (prefers-color-scheme: dark) {
  .tab-bar-inner {
    background: rgba(30, 41, 59, 0.55);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  }
}

.tab-slider {
  position: absolute;
  top: 5px;
  left: 5px;
  height: calc(100% - 10px);
  background: var(--accent-color);
  border-radius: 20px;
  transition: transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
  z-index: 1;
}

.tab-item {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  z-index: 2;
  min-width: 0;
}

.tab-icon-wrapper {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
  flex-shrink: 0;
}

.tab-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.tab-text {
  font-size: 11px;
  color: #000000;
  line-height: 1.2;
  white-space: nowrap;
}

.tab-item.active .tab-text {
  color: #ffffff;
}

.tab-item.active .tab-icon {
  filter: brightness(0) invert(1);
}
</style>

<style>
page.dark .tab-bar-inner,
.dark .tab-bar-inner {
  background: rgba(30, 41, 59, 0.55);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}
</style>
