<template>
  <view class="login-page">
    <view class="login-card">
      <lazy-image class="login-logo" :src="require('@/assets/image/qb.png')" mode="aspectFit" />
      <text class="login-title">欢迎回来</text>
      <text class="login-subtitle">请登录您的账号</text>

      <view class="login-form">
        <view class="login-field">
          <text class="login-label">QQ邮箱</text>
          <view class="login-inputShell" @tap="focusUsername = true">
            <input
              class="login-input"
              :value="form.username"
              :focus="focusUsername"
              placeholder="请输入注册使用的QQ邮箱"
              placeholder-style="color: #94a3b8;"
              @focus="focusUsername = true"
              @input="onUsernameInput"
              @blur="focusUsername = false"
            />
          </view>
        </view>

        <view class="login-field">
          <text class="login-label">密码</text>
          <view class="login-inputShell login-inputShell--withSuffix" @tap="focusPassword = true">
            <input
              class="login-input"
              :value="form.password"
              :focus="focusPassword"
              placeholder="请输入密码"
              placeholder-style="color: #94a3b8;"
              :password="!pwdVisible"
              @focus="focusPassword = true"
              @input="onPasswordInput"
              @blur="focusPassword = false"
            />
            <view class="login-suffix" @tap.stop="pwdVisible = !pwdVisible">
              <lazy-image
                class="login-suffixIcon"
                :src="pwdVisible ? '/static/image/eye-regular-full.svg' : '/static/image/eye-slash-regular-full.svg'"
                mode="aspectFit"
              />
            </view>
          </view>
        </view>

        <view class="login-field" v-if="captcha.show">
          <text class="login-label">安全验证</text>
          <view
            class="login-captchaBtn"
            :class="{ 'is-verified': captcha.verified, 'is-disabled': captcha.verified }"
              @tap="captcha.verified ? null : openCaptchaModal()"
          >
            <text class="login-captchaBtnText">{{ captcha.verified ? '验证通过' : '点击进行安全验证' }}</text>
          </view>
        </view>

        <view class="login-submit" :class="{ 'is-loading': loading }" @tap="loading ? null : handleLogin()">
          <text class="login-submitText">{{ loading ? '登录中...' : '立即登录' }}</text>
        </view>

        <view class="login-links">
          <text class="login-link" @tap="goRegister">没有账号？立即注册</text>
          <text class="login-link" @tap="goForgot">忘记密码？</text>
        </view>
      </view>
    </view>

    <view class="login-modal" v-if="captcha.modalShow" @tap="closeCaptchaModal">
      <view class="login-modalPanel" @tap.stop>
        <view class="login-modalHead">
          <text class="login-modalTitle">安全验证</text>
          <view class="login-modalClose" @tap="closeCaptchaModal">×</view>
        </view>
        <view class="login-captchaBox">
          <lazy-image v-if="captcha.bgImage" class="login-captchaBg" :src="captcha.bgImage" mode="aspectFit" :lazy-load="false" />
          <view class="login-captchaTarget" :style="{ left: captcha.targetX + 'px', top: captcha.sliderY + 'px' }" />
          <view
            v-if="captcha.sliderImage"
            class="login-captchaSlider"
            :style="{ left: captcha.sliderX + 'px', top: captcha.sliderY + 'px' }"
            @touchstart="sliderStart"
            @touchmove="sliderMove"
            @touchend="sliderEnd"
          >
            <lazy-image :src="captcha.sliderImage" mode="aspectFit" :lazy-load="false" />
          </view>
          <text class="login-captchaTip">{{ captcha.tip }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'
import { navigateToTab } from '@/utils/tab.js'

export default {
  data() {
    return {
      form: { username: '', password: '' },
      loading: false,
      pwdVisible: false,
      focusUsername: false,
      focusPassword: false,
      captcha: {
        show: false,
        id: '',
        bgImage: '',
        sliderImage: '',
        sliderX: 0,
        sliderY: 0,
        targetX: 0,
        startX: 0,
        track: [],
        tip: '请拖动滑块完成验证',
        verified: false,
        token: '',
        modalShow: false
      }
    }
  },
  onLoad() {
    this.loadCaptcha()
    this.updateTabBar()
  },
  onShow() {
    this.updateTabBar()
  },
  methods: {
    updateTabBar() {
      uni.$emit('tabBarLoginChange')
    },
    goRegister() { uni.navigateTo({ url: '/pages/register/index' }) },
    goForgot() { uni.navigateTo({ url: '/pages/forgot/index' }) },
    onUsernameInput(e) {
      const val = e.detail ? e.detail.value : e.target.value
      this.form.username = val
    },
    onPasswordInput(e) {
      const val = e.detail ? e.detail.value : e.target.value
      this.form.password = val
    },

    async loadCaptcha() {
      try {
        const res = await api.getCaptcha('SLIDER')
        if (res.success && res.data) {
          this.captcha.id = res.data.id
          this.captcha.bgImage = res.data.bgImage
          this.captcha.sliderImage = res.data.sliderImage
          this.captcha.sliderY = res.data.sliderY || 0
          this.captcha.targetX = res.data.sliderX || 0
          this.captcha.show = true
          this.captcha.tip = '请拖动滑块完成验证'
        }
      } catch (e) {
        console.error('Load captcha failed:', e)
      }
    },

    openCaptchaModal() {
      this.captcha.modalShow = true
      this.captcha.sliderX = 0
      this.captcha.tip = '请拖动滑块完成验证'
    },

    closeCaptchaModal() {
      this.captcha.modalShow = false
      if (!this.captcha.verified) {
        this.captcha.sliderX = 0
      }
    },

    sliderStart(e) {
      this.captcha.startX = e.touches[0].clientX
      this.captcha.track = []
    },

    sliderMove(e) {
      const deltaX = e.touches[0].clientX - this.captcha.startX
      this.captcha.sliderX = Math.max(0, Math.min(deltaX, 260))
      this.captcha.track.push({ x: this.captcha.sliderX, y: this.captcha.sliderY, t: Date.now() })
    },

    async sliderEnd() {
      try {
        const trackList = this.captcha.track
        const endPoint = trackList[trackList.length - 1] || { x: 0, y: 0, t: 0 }
        const startPoint = trackList[0] || { x: 0, y: 0, t: 0 }
        const duration = endPoint.t - startPoint.t
        const res = await api.checkCaptcha({
          id: this.captcha.id,
          track: {
            endX: endPoint.x,
            endY: endPoint.y,
            x: endPoint.x,
            y: endPoint.y,
            trackList,
            duration
          }
        })
        if (res.success) {
          this.captcha.verified = true
          this.captcha.token = res.data.token
          this.captcha.tip = '验证成功'
          setTimeout(() => { this.captcha.modalShow = false }, 800)
        } else {
          this.captcha.tip = '验证失败，请重试'
          this.captcha.sliderX = 0
          this.loadCaptcha()
        }
      } catch (e) {
        this.captcha.tip = '验证失败，请重试'
        this.captcha.sliderX = 0
        this.loadCaptcha()
      }
    },

    async handleLogin() {
      if (!this.form.username) {
        uni.showToast({ title: '请输入用户名', icon: 'none' })
        return
      }
      if (!this.form.password) {
        uni.showToast({ title: '请输入密码', icon: 'none' })
        return
      }
      if (this.captcha.show && !this.captcha.verified) {
        uni.showToast({ title: '请先完成验证码验证', icon: 'none' })
        return
      }

      this.loading = true
      try {
        const res = await api.login({
          username: this.form.username,
          password: this.form.password,
          captchaId: this.captcha.id,
          captchaToken: this.captcha.token
        })

        uni.setStorageSync('userInfo', res.user)
        uni.setStorageSync('token', res.token || 'app-token')
        uni.setStorageSync('loginTime', Date.now())
        uni.$emit('tabBarLoginChange')

        uni.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => { navigateToTab(1) }, 1500)
      } catch (e) {
        uni.showToast({ title: e.message || '登录失败', icon: 'none' })
        this.captcha.verified = false
        this.captcha.sliderX = 0
        this.loadCaptcha()
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  padding: 72px 20px 28px;
  box-sizing: border-box;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 22px;
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-color: var(--border-color);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
  padding: 34px 24px 26px;
  box-sizing: border-box;
}

.login-logo {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  display: block;
  margin: 0 auto 14px;
}

.login-title {
  display: block;
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
  text-align: center;
  letter-spacing: 0.6px;
}

.login-subtitle {
  display: block;
  margin-top: 10px;
  margin-bottom: 26px;
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.6;
}

.login-form {
  width: 100%;
}

.login-field {
  margin-bottom: 18px;
}

.login-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.login-inputShell {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-color: var(--border-color);
  background: rgba(255, 255, 255, 0.04);
  background: var(--bg-input);
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.login-inputShell--withSuffix {
  padding-right: 46px;
  position: relative;
}

.login-input {
  flex: 1;
  width: 100%;
  height: 48px;
  line-height: 48px;
  padding: 0 14px;
  box-sizing: border-box;
  background-color: transparent !important;
  border: 0 !important;
  outline: none;
  color: #f1f5f9;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 500;
  caret-color: #f1f5f9;
  caret-color: var(--text-primary);
  -webkit-appearance: none;
  appearance: none;
}

.login-input:focus {
  outline: none !important;
  box-shadow: none !important;
}

.login-suffix {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-suffixIcon {
  width: 20px;
  height: 20px;
  filter: var(--icon-filter);
}

.login-captchaBtn {
  height: 50px;
  border-radius: 14px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.login-captchaBtn.is-verified {
  background: rgba(52, 211, 153, 0.12);
  border-color: #34d399;
}

.login-captchaBtn.is-disabled {
  opacity: 0.7;
}

.login-captchaBtnText {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.login-captchaBtn.is-verified .login-captchaBtnText {
  color: #6ee7b7;
}

.login-submit {
  margin-top: 10px;
  height: 54px;
  border-radius: 16px;
  background: var(--accent-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-submit.is-loading {
  opacity: 0.75;
}

.login-submitText {
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.6px;
}

.login-links {
  margin-top: 18px;
  display: flex;
  justify-content: space-between;
}

.login-link {
  font-size: 14px;
  color: var(--text-secondary);
}

.login-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  z-index: 9999;
}

.login-modalPanel {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
  background: var(--bg-modal);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.login-modalHead {
  height: 52px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  border-bottom: 1px solid var(--border-color);
}

.login-modalTitle {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary);
}

.login-modalClose {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 22px;
}

.login-captchaBox {
  position: relative;
  width: 100%;
  height: 190px;
  background: var(--bg-captcha);
}

.login-captchaBg {
  width: 100%;
  height: 190px;
}

.login-captchaTarget {
  position: absolute;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.85);
  box-sizing: border-box;
}

.login-captchaSlider {
  position: absolute;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  background: rgba(255, 255, 255, 0.1);
}

.login-captchaTip {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-tertiary);
}
</style>
