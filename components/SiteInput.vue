<template>
  <view class="site-field-control" :class="controlClass">
    <view class="site-field-control__body">
      <!-- #ifdef H5 -->
      <input
        :type="h5InputType"
        class="site-native-input"
        :value="value"
        :placeholder="placeholder"
        @input="onInput"
      />
      <!-- #endif -->
      <!-- #ifndef H5 -->
      <input
        class="site-input"
        :value="value"
        :placeholder="placeholder"
        :password="isMasked"
        @input="onInput"
      />
      <!-- #endif -->
    </view>
    <view
      v-if="passwordToggle"
      class="site-field-action"
      @tap="visible = !visible"
    >
      <lazy-image
        size="site-icon"
        class="site-icon"
        :src="visible ? '/static/image/eye-regular-full.svg' : '/static/image/eye-slash-regular-full.svg'"
        mode="aspectFit"
      />
    </view>
    <slot name="action" />
  </view>
</template>

<script>
export default {
  name: 'SiteInput',
  props: {
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    password: {
      type: Boolean,
      default: false
    },
    passwordToggle: {
      type: Boolean,
      default: false
    },
    hasAction: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      visible: false
    }
  },
  computed: {
    isMasked() {
      return this.password && !this.visible
    },
    h5InputType() {
      if (this.password && !this.visible) return 'password'
      return 'text'
    },
    controlClass() {
      const list = []
      if (this.passwordToggle) list.push('site-field-control--suffix')
      if (this.hasAction) list.push('site-field-control--action')
      return list
    }
  },
  methods: {
    onInput(e) {
      const val = e.detail ? e.detail.value : e.target.value
      this.$emit('input', val)
    }
  }
}
</script>

<style scoped lang="scss">
.site-field-control__body {
  flex: 1;
  min-width: 0;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.site-native-input {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 48px;
  padding: 0 14px;
  margin: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  line-height: 48px;
  color: var(--text-primary);
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
}

.site-native-input::placeholder {
  color: var(--text-secondary);
  font-size: 16px;
}
</style>
