<template>
  <view class="auth-page">
    <view class="auth-card">
      <lazy-image class="auth-logo" :src="require('@/assets/image/qb.png')" mode="aspectFit" />
      <text class="auth-title">创建账号</text>
      <text class="auth-subtitle">加入青滨校友圈</text>

      <view class="auth-form">
        <view class="auth-field">
          <text class="auth-label">用户名</text>
          <view class="auth-inputShell" @tap="focusUsername = true">
            <input
              class="auth-input"
              :value="form.username"
              :focus="focusUsername"
              placeholder="请输入用户名"
              placeholder-style="color: #94a3b8;"
              @focus="focusUsername = true"
              @input="onUsernameInput"
              @blur="focusUsername = false"
            />
          </view>
        </view>

        <view class="auth-field">
          <text class="auth-label">邮箱</text>
          <view class="auth-inputShell" @tap="focusEmail = true">
            <input
              class="auth-input"
              :value="form.email"
              :focus="focusEmail"
              placeholder="请输入邮箱"
              placeholder-style="color: #94a3b8;"
              @focus="focusEmail = true"
              @input="onEmailInput"
              @blur="focusEmail = false"
            />
          </view>
        </view>

        <view class="auth-field">
          <text class="auth-label">密码</text>
          <view class="auth-inputShell auth-inputShell--withSuffix" @tap="focusPassword = true">
            <input
              class="auth-input"
              :value="form.password"
              :focus="focusPassword"
              placeholder="请输入密码"
              placeholder-style="color: #94a3b8;"
              :password="!pwdVisible"
              @focus="focusPassword = true"
              @input="onPasswordInput"
              @blur="focusPassword = false"
            />
            <view class="auth-suffix" @tap.stop="pwdVisible = !pwdVisible">
              <lazy-image
                class="auth-suffixIcon"
                :src="pwdVisible ? '/static/image/eye-regular-full.svg' : '/static/image/eye-slash-regular-full.svg'"
                mode="aspectFit"
              />
            </view>
          </view>
        </view>

        <view class="auth-field" v-if="captcha.show">
          <text class="auth-label">安全验证</text>
          <view
            class="auth-captchaBtn"
            :class="{ 'is-verified': captcha.verified, 'is-disabled': captcha.verified }"
            @tap="captcha.verified ? null : openCaptchaModal()"
          >
            <text class="auth-captchaBtnText">{{ captcha.verified ? '验证通过' : '点击进行安全验证' }}</text>
          </view>
        </view>

        <view class="auth-field">
          <text class="auth-label">邮箱验证码</text>
          <view class="auth-inputShell auth-inputShell--withAction" @tap="focusEmailCode = true">
            <input
              class="auth-input"
              :value="form.emailCode"
              :focus="focusEmailCode"
              placeholder="请输入邮箱验证码"
              placeholder-style="color: #94a3b8;"
              @focus="focusEmailCode = true"
              @input="onEmailCodeInput"
              @blur="focusEmailCode = false"
            />
            <view
              class="auth-codeBtn"
              :class="{ 'is-disabled': codeSending }"
              @tap.stop="codeSending ? null : sendEmailCode()"
            >
              <text class="auth-codeBtnText">{{ codeText }}</text>
            </view>
          </view>
        </view>

        <view class="auth-submit" :class="{ 'is-loading': loading }" @tap="loading ? null : handleRegister()">
          <text class="auth-submitText">{{ loading ? '注册中...' : '立即注册' }}</text>
        </view>

        <view class="auth-links auth-links--center">
          <text class="auth-link" @tap="goLogin">已有账号？立即登录</text>
        </view>
      </view>
    </view>

    <view class="auth-modal" v-if="captcha.modalShow" @tap="closeCaptchaModal">
      <view class="auth-modalPanel" @tap.stop>
        <view class="auth-modalHead">
          <text class="auth-modalTitle">安全验证</text>
          <view class="auth-modalClose" @tap="closeCaptchaModal">×</view>
        </view>
        <view class="auth-captchaBox">
          <lazy-image v-if="captcha.bgImage" class="auth-captchaBg" :src="captcha.bgImage" mode="aspectFit" :lazy-load="false" />
          <view class="auth-captchaTarget" :style="{ left: captcha.targetX + 'px', top: captcha.sliderY + 'px' }" />
          <view
            v-if="captcha.sliderImage"
            class="auth-captchaSlider"
            :style="{ left: captcha.sliderX + 'px', top: captcha.sliderY + 'px' }"
            @touchstart="sliderStart"
            @touchmove="sliderMove"
            @touchend="sliderEnd"
          >
            <lazy-image :src="captcha.sliderImage" mode="aspectFit" :lazy-load="false" />
          </view>
          <text class="auth-captchaTip">{{ captcha.tip }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'
import { validateUsername } from '@/utils/username-blacklist.js'

export default {
  data() {
    return {
      form: { username: '', email: '', password: '', emailCode: '' },
      loading: false,
      pwdVisible: false,
      focusUsername: false,
      focusEmail: false,
      focusPassword: false,
      focusEmailCode: false,
      codeSending: false,
      codeText: '获取验证码',
      codeTimer: null,
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
  onUnload() {
    if (this.codeTimer) clearInterval(this.codeTimer)
  },
  methods: {
    updateTabBar() {
      uni.$emit('tabBarLoginChange')
    },
    goLogin() { uni.navigateTo({ url: '/pages/login/index' }) },
    onUsernameInput(e) {
      const val = e.detail ? e.detail.value : e.target.value
      this.form.username = val
    },
    onEmailInput(e) {
      const val = e.detail ? e.detail.value : e.target.value
      this.form.email = val
    },
    onPasswordInput(e) {
      const val = e.detail ? e.detail.value : e.target.value
      this.form.password = val
    },
    onEmailCodeInput(e) {
      const val = e.detail ? e.detail.value : e.target.value
      this.form.emailCode = val
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
            trackList: trackList,
            duration: duration
          }
        })
        if (res.success) {
          this.captcha.verified = true
          this.captcha.token = res.data.token
          this.captcha.tip = '验证成功'
          setTimeout(() => {
            this.captcha.modalShow = false
          }, 800)
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

    async sendEmailCode() {
      if (!this.form.email) {
        uni.showToast({ title: '请输入邮箱', icon: 'none' })
        return
      }
      if (this.codeSending) return

      this.codeSending = true
      try {
        await api.sendEmailCode(this.form.email)
        uni.showToast({ title: '验证码已发送', icon: 'success' })
        let countdown = 60
        this.codeText = `${countdown}s`
        this.codeTimer = setInterval(() => {
          countdown--
          if (countdown <= 0) {
            clearInterval(this.codeTimer)
            this.codeSending = false
            this.codeText = '获取验证码'
          } else {
            this.codeText = `${countdown}s`
          }
        }, 1000)
      } catch (e) {
        uni.showToast({ title: e.message || '发送失败', icon: 'none' })
        this.codeSending = false
      }
    },

    async handleRegister() {
      if (!this.form.username) {
        uni.showToast({ title: '请输入用户名', icon: 'none' })
        return
      }
      // 用户名黑名单预检（违规词 / 系统保留词 / 非法字符）
      const usernameCheck = validateUsername(this.form.username)
      if (!usernameCheck.valid) {
        uni.showToast({ title: usernameCheck.reason, icon: 'none' })
        return
      }
      if (!this.form.email) {
        uni.showToast({ title: '请输入邮箱', icon: 'none' })
        return
      }
      if (!this.form.password) {
        uni.showToast({ title: '请输入密码', icon: 'none' })
        return
      }
      if (!this.form.emailCode) {
        uni.showToast({ title: '请输入邮箱验证码', icon: 'none' })
        return
      }
      if (this.captcha.show && !this.captcha.verified) {
        uni.showToast({ title: '请先完成验证码验证', icon: 'none' })
        return
      }

      this.loading = true
      try {
        await api.register({
          username: this.form.username,
          email: this.form.email,
          password: this.form.password,
          emailCode: this.form.emailCode,
          captchaId: this.captcha.id,
          captchaToken: this.captcha.token
        })
        uni.showToast({ title: '注册成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateTo({ url: '/pages/login/index' })
        }, 1500)
      } catch (e) {
        uni.showToast({ title: e.message || '注册失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  padding: 72px 20px 28px;
  box-sizing: border-box;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
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

.auth-logo {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  display: block;
  margin: 0 auto 14px;
}

.auth-title {
  display: block;
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
  text-align: center;
  letter-spacing: 0.6px;
}

.auth-subtitle {
  display: block;
  margin-top: 10px;
  margin-bottom: 26px;
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.6;
}

.auth-form {
  width: 100%;
}

.auth-field {
  margin-bottom: 18px;
}

.auth-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.auth-inputShell {
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
  position: relative;
}

.auth-inputShell--withSuffix {
  padding-right: 46px;
}

.auth-inputShell--withAction {
  padding-right: 108px;
}

.auth-input {
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

.auth-input:focus {
  outline: none !important;
  box-shadow: none !important;
}

.auth-suffix {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-suffixIcon {
  width: 20px;
  height: 20px;
  filter: var(--icon-filter);
}

.auth-codeBtn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  background: var(--accent-color);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.auth-codeBtn.is-disabled {
  opacity: 0.6;
}

.auth-codeBtnText {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}

.auth-captchaBtn {
  height: 50px;
  border-radius: 14px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.auth-captchaBtn.is-verified {
  background: rgba(52, 211, 153, 0.12);
  border-color: #34d399;
}

.auth-captchaBtn.is-disabled {
  opacity: 0.7;
}

.auth-captchaBtnText {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.auth-captchaBtn.is-verified .auth-captchaBtnText {
  color: #6ee7b7;
}

.auth-submit {
  margin-top: 10px;
  height: 54px;
  border-radius: 16px;
  background: var(--accent-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-submit.is-loading {
  opacity: 0.75;
}

.auth-submitText {
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.6px;
}

.auth-links {
  margin-top: 18px;
  display: flex;
  justify-content: space-between;
}

.auth-links--center {
  justify-content: center;
}

.auth-link {
  font-size: 14px;
  color: var(--text-secondary);
}

.auth-modal {
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

.auth-modalPanel {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
  background: var(--bg-modal);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.auth-modalHead {
  height: 52px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  border-bottom: 1px solid var(--border-color);
}

.auth-modalTitle {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary);
}

.auth-modalClose {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 22px;
}

.auth-captchaBox {
  position: relative;
  width: 100%;
  height: 190px;
  background: var(--bg-captcha);
}

.auth-captchaBg {
  width: 100%;
  height: 190px;
}

.auth-captchaTarget {
  position: absolute;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.85);
  box-sizing: border-box;
}

.auth-captchaSlider {
  position: absolute;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  background: rgba(255, 255, 255, 0.1);
}

.auth-captchaTip {
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
