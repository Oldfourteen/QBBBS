# QBBBS - 青滨校友圈 App


<div align="center">

<img title="" src="./qblogo.png" alt="QBBBS-LOGO" width="200">

[![qbbbs.fun](https://img.shields.io/badge/QBBBS-qbbbs.fun-142850?style=flat-square)](https://qbbbs.fun)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](./LICENSE)
[![Vue](https://img.shields.io/badge/Vue-2.6.14-4FC08D?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![uni-app](https://img.shields.io/badge/uni--app-2.x-2B9839?style=flat-square)](https://uniapp.dcloud.net.cn/)
[![Node.js](https://img.shields.io/badge/Node.js-14%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

---

本项目基于**青岛滨海学院个人建站 QBBBS - 青滨校友圈** 而设立App，数据层面与**https://qbbbs.fun:8088**网站内容后端数据相连。技术层面上该App**基于Uniapp设计**，使用**Vue3**语言进行开发，状态管理采取Vue官方的**Vuex**来构建，因涉及安全原因，~~后端的API接口就不在此仓库展示~~，望理解。

---

## 项目设计初心

本项目基于学校而设计，目的是构建一个共同自由平等的学校社区交流平台，该平台的个人数据均经过严格的加密处理，项目基于Nginx反向代理保证服务器的安全性，对于服务器进行了多项TCP、UDP防护，IDC渠道合法合规，平台社区协议细则：[QB-BBS - 青滨校友圈](https://qbbbs.fun/?r=JTJGcGFnZSUyRnJlZyUyRmFncmVlbWVudC5odG1s)

## 项目结构

```
app/                                # 项目根目录
│
├── pages/                          # 页面目录
│   ├── main/                       # 主入口页
│   ├── home/                       # 首页
│   ├── community/                  # 校友圈
│   ├── recommend/                  # 青滨志异
│   ├── profile/                    # 个人中心
│   ├── login/                      # 登录
│   ├── register/                   # 注册
│   ├── forgot/                     # 忘记密码
│   ├── post-detail/                # 帖子详情
│   ├── publish/                    # 发布帖子
│   ├── settings/                   # 设置
│   ├── notifications/              # 消息通知
│   ├── about/                      # 关于
│   ├── change-avatar/              # 更换头像
│   ├── schedule/                   # 课表
│   └── schedule-widget/            # 今日课表小组件
│
├── components/                     # 公共组件
│   ├── tabs/                       # 底部 Tab 业务页（Home/Community/Recommend/Profile）
│   │   ├── HomeTab.vue
│   │   ├── CommunityTab.vue
│   │   ├── RecommendTab.vue
│   │   └── ProfileTab.vue
│   ├── CustomTabBar.vue            # 自定义底部导航栏
│   ├── LazyImage.vue               # 图片懒加载组件
│   ├── LoadMoreFooter.vue          # 加载更多/底部状态
│   ├── RichTextEditor.vue          # 富文本编辑器
│   ├── RichTextViewer.vue          # 富文本渲染器
│   ├── SearchPostsModal.vue        # 搜索弹窗
│   ├── SiteHeader.vue              # 站点头部
│   └── SiteInput.vue               # 站点输入框
│
├── assets/                         # 图标资源
│   └── image/         
│
├── static/                         # 静态资源
│   ├── image/                      # tabbar 图标、背景图、部分 ui 图标
│   └── avatar/                     # 默认头像
│       └── default-avatar/
│
├── styles/                         # 全局样式
│   └── site.scss                  
│
├── utils/                          # 工具函数
│   ├── api.js                      # API 请求封装
│   ├── auth.js                     # 登录态/鉴权
│   ├── index.js                    # 通用工具
│   ├── postFilters.js / postPager.js / postsLoader.js / postsCache.js
│   ├── sanitizeHtml.js             # XSS 富文本清洗
│   ├── schedulePdf.js              # 课表 PDF 导出
│   ├── tab.js                      # Tab 辅助
│   └── username-blacklist.js       # 用户名黑名单
│
├── App.vue                         # uniapp应用入口
├── main.js                         # 主入口
├── manifest.json                   # 应用配置
├── pages.json                      # 页面路由注册 + easycom + tabBar 配置
├── uni.scss                        # uni-app全局scss变量
├── vue.config.js                   # webpack/devServer代理
├── babel.config.js                 # babel配置
├── postcss.config.js               # postcss配置
├── package.json/package-lock.json  # 依赖管理
├── .gitignore                      # git的忽略规则
├── README.md                       # 项目说明
├── qblogo.png                      # logo
```

## 运行环境

- Node.js（14或者16LTS）

- npm

## 开发命令

```bash
# 安装依赖
npm install

# App开发
npm run dev:app

# 构建App
npm run build:app
```

## 注意事项

1. 推荐在VsCode或HBuilderX中打开此项目进行开发和调试
2. 本项目不涉及该站的后端API

---


