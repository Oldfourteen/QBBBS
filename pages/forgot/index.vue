<template>
  <view class="auth-page">
    <view class="auth-card">
      <lazy-image class="auth-logo" :src="require('@/assets/image/qb.png')" mode="aspectFit" />
      <text class="auth-title">找回密码</text>
      <text class="auth-subtitle">请输入您的注册邮箱</text>

      <view class="auth-form">
        <view class="auth-field">
          <text class="auth-label">邮箱地址</text>
          <view class="auth-inputShell" @tap="focusEmail = true">
            <input
              class="auth-input"
              :value="email"
              :focus="focusEmail"
              placeholder="请输入注册邮箱"
              placeholder-style="color: #94a3b8;"
              @focus="focusEmail = true"
              @input="onEmailInput"
              @blur="focusEmail = false"
            />
          </view>
        </view>

        <view class="auth-field">
          <text class="auth-label">验证码</text>
          <view class="auth-inputShell auth-inputShell--withAction" @tap="focusCode = true">
            <input
              class="auth-input"
              :value="code"
              :focus="focusCode"
              placeholder="请输入邮箱验证码"
              placeholder-style="color: #94a3b8;"
              @focus="focusCode = true"
              @input="onCodeInput"
              @blur="focusCode = false"
            />
            <view
              class="auth-codeBtn"
              :class="{ 'is-disabled': codeSending }"
              @tap.stop="codeSending ? null : sendCode()"
            >
              <text class="auth-codeBtnText">{{ codeText }}</text>
            </view>
          </view>
        </view>

        <view class="auth-field">
          <text class="auth-label">新密码</text>
          <view class="auth-inputShell auth-inputShell--withSuffix" @tap="focusNewPassword = true">
            <input
              class="auth-input"
              :value="newPassword"
              :focus="focusNewPassword"
              placeholder="请输入新密码"
              placeholder-style="color: #94a3b8;"
              :password="!pwdVisible"
              @focus="focusNewPassword = true"
              @input="onNewPasswordInput"
              @blur="focusNewPassword = false"
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

        <view class="auth-submit" :class="{ 'is-loading': loading }" @tap="loading ? null : handleReset()">
          <text class="auth-submitText">{{ loading ? '重置中...' : '重置密码' }}</text>
        </view>

        <view class="auth-links auth-links--center">
          <text class="auth-link" @tap="goLogin">想起密码？立即登录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  data() {
    return {
      email: '',
      code: '',
      newPassword: '',
      pwdVisible: false,
      focusEmail: false,
      focusCode: false,
      focusNewPassword: false,
      loading: false,
      codeSending: false,
      codeText: '获取验证码',
      codeTimer: null
    }
  },
  onLoad() {
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
    onEmailInput(e) {
      const val = e.detail ? e.detail.value : e.target.value
      this.email = val
    },
    onCodeInput(e) {
      const val = e.detail ? e.detail.value : e.target.value
      this.code = val
    },
    onNewPasswordInput(e) {
      const val = e.detail ? e.detail.value : e.target.value
      this.newPassword = val
    },

    async sendCode() {
      if (!this.email) {
        uni.showToast({ title: '请输入邮箱', icon: 'none' })
        return
      }
      if (this.codeSending) return

      this.codeSending = true
      try {
        await api.sendResetCode(this.email)
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

    async handleReset() {
      if (!this.email || !this.code || !this.newPassword) {
        uni.showToast({ title: '请填写所有字段', icon: 'none' })
        return
      }

      this.loading = true
      try {
        await api.resetPassword({
          email: this.email,
          code: this.code,
          newPassword: this.newPassword
        })
        uni.showToast({ title: '密码重置成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateTo({ url: '/pages/login/index' })
        }, 1500)
      } catch (e) {
        uni.showToast({ title: e.message || '重置失败', icon: 'none' })
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
</style>
