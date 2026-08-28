<template>
  <view class="page">
    <view class="header">
      <view class="header-inner">
        <view class="back-btn" @tap="goBack">
          <lazy-image class="back-icon" :src="require('@/assets/image/chevron-left-solid-full.svg')" mode="aspectFit" />
        </view>
        <text class="brand">关于我们</text>
      </view>
    </view>

    <view class="content">
      <view class="card">
        <lazy-image class="card-logo" :src="require('@/assets/image/qb.png')" mode="aspectFit" />
        <text class="title">QB-BBS 青滨校友圈</text>
        <text class="version">版本 1.0.0</text>

        <view class="section">
          <text class="section-title">关于平台</text>
          <text class="section-content">QB-BBS是一个面向青滨校友的交流平台，旨在为校友们提供一个分享、交流、互助的空间。在这里，你可以分享生活点滴、寻求帮助、结识新朋友。</text>
        </view>

        <view class="section">
          <text class="section-title">联系我们</text>
          <text class="contact">如有问题或建议，欢迎反馈</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  onLoad() {
    this.updateTabBar()
  },
  onShow() {
    this.updateTabBar()
  },
  methods: {
    updateTabBar() {
      uni.$emit('tabBarLoginChange')
    },
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style>
.page { min-height: 100vh; background: var(--bg-primary); }
.header { position: fixed; top: 0; left: 0; right: 0; height: 88px; background: var(--header-bg); z-index: 999; }
.header-inner { height: 100%; display: flex; align-items: center; justify-content: center; position: relative; padding-top: 10px; }
.back-btn { position: absolute; left: 16px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
.back-icon { width: 24px; height: 24px; filter: brightness(0) invert(1); }
.brand { font-size: 20px; font-weight: 700; color: var(--text-inverse); }
.content { padding: 108px 16px 20px; }
.card { background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color); padding: 24px; }
.card-logo { width: 60px; height: 60px; margin: 0 auto 16px; display: block; border-radius: 12px; }
.title { font-size: 22px; font-weight: 700; color: var(--text-primary); display: block; text-align: center; margin-bottom: 8px; }
.version { font-size: 14px; color: var(--text-secondary); display: block; text-align: center; margin-bottom: 24px; }
.section { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--border-light); }
.section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.section-title { font-size: 16px; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 12px; }
.section-content { font-size: 14px; color: var(--text-tertiary); line-height: 1.7; display: block; }
.feature { font-size: 14px; color: var(--text-tertiary); display: block; margin-bottom: 8px; }
.contact { font-size: 14px; color: var(--text-tertiary); display: block; }
</style>
