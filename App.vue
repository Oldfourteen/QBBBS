<script>
export default {
  onLaunch: function() {
    console.log('App Launch')
    // 检查网络连接状态
    this.checkNetwork()
    // 监听系统主题变化
    this.listenThemeChange()
  },
  onShow: function() {
    console.log('App Show')
    this.updateTabBar()
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    updateTabBar() {
      uni.$emit('tabBarLoginChange')
    },
    checkNetwork() {
      uni.getNetworkType({
        success: (res) => {
          if (res.networkType === 'none') {
            uni.showToast({
              title: '网络未连接',
              icon: 'none',
              duration: 3000
            })
          }
        }
      })
    },
    listenThemeChange() {
      // App 根组件没有 $page，不能使用 createMediaQueryObserver
      // 初始主题通过 getSystemInfoSync 获取，系统深色模式由 CSS @media 兜底
      this.syncSystemTheme()
      if (uni.onThemeChange) {
        uni.onThemeChange((res) => {
          this.applyTheme(res.theme)
        })
      }
    },
    syncSystemTheme() {
      try {
        const info = uni.getSystemInfoSync()
        if (info && info.theme) {
          this.applyTheme(info.theme)
        }
      } catch (e) {}
    },
    applyTheme(theme) {
      if (!theme) return
      this.setPageDarkMode(theme === 'dark')
    },
    setPageDarkMode(isDark) {
      const pages = getCurrentPages()
      if (!pages || !pages.length) return
      pages.forEach((page) => {
        try {
          const el = (page.$page && page.$page.$el) || (page.$vm && page.$vm.$el)
          if (el && el.classList) {
            if (isDark) {
              el.classList.add('dark')
            } else {
              el.classList.remove('dark')
            }
          }
        } catch (e) {}
      })
    }
  }
}
</script>

<style lang="scss">
/* #ifndef APP-PLUS-NVUE */
@import './styles/site.scss';

page {
  background-color: #f0f7ff;
  font-family: "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #16305f;
}

/* 网站风格设计令牌（扁平、无渐变） */
page {
  --bg-primary: #f0f7ff;
  --bg-secondary: #f0f7ff;
  --bg-card: #ffffff;
  --bg-input: #f8fafc;
  --bg-modal: #ffffff;
  --bg-captcha: #f8fafc;
  --bg-comment-input: #f1f5f9;
  --bg-menu-hover: #f8fafc;
  --text-primary: #16305f;
  --text-secondary: #5f78a5;
  --text-tertiary: #64748b;
  --text-inverse: #f4f7ff;
  --border-color: #e2e8f0;
  --border-light: #f1f5f9;
  --border-secondary: #7fa3de;
  --accent-color: #142850;
  --accent-hover: #1b3d7a;
  --header-bg: #142850;
  --header-border: #1c3564;
  --fab-bg: #142850;
  --fab-shadow: none;
  --shadow-color: rgba(20, 40, 80, 0.08);
  --overlay-bg: rgba(0, 0, 0, 0.5);
  --profile-bg-overlay: none;
  --profile-glass-bg: #ffffff;
  --profile-glass-border: #e2e8f0;
  --profile-glass-divider: #f1f5f9;
  --profile-glass-blur: 0;
  --profile-glass-shadow: none;
  --profile-glass-glow: none;
  --icon-filter: none;
  --header-height: 88px;
  --tabbar-height: calc(63px + env(safe-area-inset-bottom));
  --card-radius: 12px;
  --btn-radius: 12px;
}

@media (prefers-color-scheme: dark) {
  page {
    --bg-primary: #0b1120;
    --bg-secondary: #0b1120;
    --bg-card: #1e293b;
    --bg-input: #334155;
    --bg-modal: #1e293b;
    --bg-captcha: #334155;
    --bg-comment-input: #334155;
    --bg-menu-hover: #334155;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --text-tertiary: #cbd5e1;
    --text-inverse: #f4f7ff;
    --border-color: #334155;
    --border-light: #334155;
    --border-secondary: #475569;
    --accent-color: #3b82f6;
    --accent-hover: #60a5fa;
    --header-bg: #0f172a;
    --fab-bg: #3b82f6;
    --overlay-bg: rgba(0, 0, 0, 0.7);
    --profile-glass-bg: #1e293b;
    --profile-glass-border: #334155;
    --profile-glass-divider: #334155;
    --icon-filter: brightness(0) invert(1);
    background-color: #0b1120;
  }
}

page.dark,
.dark page {
  --bg-primary: #0b1120;
  --bg-secondary: #0b1120;
  --bg-card: #1e293b;
  --bg-input: #334155;
  --bg-modal: #1e293b;
  --bg-captcha: #334155;
  --bg-comment-input: #334155;
  --bg-menu-hover: #334155;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-tertiary: #cbd5e1;
  --text-inverse: #f4f7ff;
  --border-color: #334155;
  --border-light: #334155;
  --border-secondary: #475569;
  --accent-color: #3b82f6;
  --accent-hover: #60a5fa;
  --header-bg: #0f172a;
  --fab-bg: #3b82f6;
  --overlay-bg: rgba(0, 0, 0, 0.7);
  --profile-glass-bg: #1e293b;
  --profile-glass-border: #334155;
  --profile-glass-divider: #334155;
  --icon-filter: brightness(0) invert(1);
  background-color: #0b1120;
}

.image,
image {
  display: block;
  box-sizing: border-box;
  overflow: hidden;
  flex-shrink: 0;
}

text {
  word-break: break-word;
}

button::after {
  border: none;
}

button {
  margin: 0;
  padding: 0;
  line-height: inherit;
}

button:active,
.btn-submit:active,
.btn-primary:active,
.btn-secondary:active,
.btn-login:active,
.btn-setting:active,
.btn-logout:active,
.btn-captcha:active,
.send-code-btn:active,
.comment-submit:active,
.type-item.active:active,
.fab:active,
.menu-item:active,
.action-btn:active,
.back-btn:active,
.comment-like:active {
  filter: brightness(0.9);
  transform: scale(0.98);
}

* {
  -webkit-tap-highlight-color: transparent;
}

.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
/* #endif */
</style>
