<template>
  <view class="site-header">
    <view class="site-header__inner">
      <view v-if="showBack" class="site-header__back" @tap="onBack">
        <lazy-image class="site-header__icon" :src="require('@/assets/image/chevron-left-solid-full.svg')" mode="aspectFit" />
      </view>
      <text class="site-header__title">{{ title }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'SiteHeader',
  props: {
    title: {
      type: String,
      default: ''
    },
    showBack: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    onBack() {
      this.$emit('back')
      const pages = getCurrentPages()
      if (pages && pages.length > 1) {
        uni.navigateBack()
      } else {
        uni.switchTab({ url: '/pages/home/index' })
      }
    }
  }
}
</script>
