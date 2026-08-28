<template>
  <view class="load-more">
    <view
      class="load-more__panel"
      :class="{
        'load-more__panel--show': panelVisible,
        'load-more__panel--end': isEnd,
        'load-more__panel--error': !!error
      }"
    >
      <view v-if="loading" class="load-more__pill" @tap.stop>
        <view class="load-more__ring" />
        <text class="load-more__text">正在加载</text>
      </view>

      <view v-else-if="error" class="load-more__pill load-more__pill--tap" @tap="$emit('retry')">
        <text class="load-more__text load-more__text--error">{{ error }}</text>
        <text class="load-more__retry">重试</text>
      </view>

      <view v-else-if="isEnd" class="load-more__end">
        <view class="load-more__line" />
        <text class="load-more__end-text">没有更多了</text>
        <view class="load-more__line" />
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'LoadMoreFooter',
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    hasMore: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    showEnd: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    isEnd() {
      return !this.hasMore && this.showEnd && !this.loading && !this.error
    },
    panelVisible() {
      return this.loading || !!this.error || this.isEnd
    }
  }
}
</script>

<style scoped lang="scss">
.load-more {
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.load-more__panel {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transform: translateY(8px);
  transition:
    max-height 0.34s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.28s ease,
    transform 0.34s cubic-bezier(0.32, 0.72, 0, 1);
}

.load-more__panel--show {
  max-height: 72px;
  opacity: 1;
  transform: translateY(0);
}

.load-more__panel--end.load-more__panel--show {
  max-height: 48px;
}

.load-more__pill {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 36px;
  margin: 8px auto 0;
  padding: 0 16px;
  width: fit-content;
  max-width: calc(100% - 32px);
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 18px;
  box-shadow: 0 1px 6px var(--shadow-color);
  box-sizing: border-box;
}

.load-more__pill--tap:active {
  opacity: 0.82;
  transform: scale(0.98);
}

.load-more__ring {
  width: 14px;
  height: 14px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  flex-shrink: 0;
  animation: load-more-spin 0.65s linear infinite;
}

@keyframes load-more-spin {
  to {
    transform: rotate(360deg);
  }
}

.load-more__text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1;
  white-space: nowrap;
}

.load-more__text--error {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.load-more__retry {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-color);
  line-height: 1;
  flex-shrink: 0;
}

.load-more__end {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px 6px;
}

.load-more__line {
  flex: 1;
  max-width: 40px;
  height: 1px;
  background: var(--border-color);
  opacity: 0.7;
}

.load-more__end-text {
  font-size: 11px;
  color: var(--text-tertiary);
  line-height: 1;
  letter-spacing: 1px;
  opacity: 0.85;
}
</style>
