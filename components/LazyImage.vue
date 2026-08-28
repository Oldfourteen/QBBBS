<template>
  <image
    :src="resolvedSrc"
    :lazy-load="lazyLoad"
    :class="imageClass"
    :style="imageStyle"
    :mode="mode"
    v-on="$listeners"
  />
</template>

<script>
import { BASE_URL } from '@/utils/api.js'

/**
 * H5 的 uni-image 默认 320x240px，只在外层 overflow:hidden 会裁切而不会缩小。
 * 必须把宽高（px）直接设到 <image> 节点上。
 */
const SIZE_MAP = {
  'site-brand__logo': { w: 32, h: 32 },
  'site-hero__image': { w: 260, h: 220 },
  'site-auth-logo': { w: 48, h: 48 },
  'site-header__icon': { w: 22, h: 22 },
  'site-icon': { w: 20, h: 20 },
  'brand-logo': { w: 32, h: 32 },
  'header-search-icon': { w: 22, h: 22 },
  'post-avatar': { w: 40, h: 40, round: true },
  'post-image': { w: 80, h: 80, radius: 8 },
  'action-icon': { w: 24, h: 24 },
  'action-icon-small': { w: 18, h: 18 },
  'fab-icon': { w: 22, h: 22 },
  'tab-icon': { w: 20, h: 20 },
  'menu-icon': { w: 20, h: 20 },
  'prompt-avatar': { w: 80, h: 80, round: true },
  'avatar': { w: 80, h: 80, round: true },
  'avatar-picker': { w: 56, h: 56, round: true },
  'preview-avatar': { w: 120, h: 120, round: true },
  'avatar-img': { w: 64, h: 64, radius: 12 },
  'back-icon': { w: 24, h: 24 },
  'card-logo': { w: 48, h: 48 },
  'comment-avatar': { w: 36, h: 36, round: true },
  'send-icon': { w: 22, h: 22 },
  'delete-icon': { w: 20, h: 20 },
  'section-icon-img': { w: 18, h: 18 },
  'type-icon-img': { w: 20, h: 20 },
  'preview-img': { w: 72, h: 72, radius: 8 },
  'upload-icon-img': { w: 24, h: 24 },
  'btn-icon-img': { w: 18, h: 18 },
  'empty-icon': { w: 80, h: 80 },
  'boost-icon': { w: 24, h: 24 },
  'nav-favicon': { w: 22, h: 22 },
  'story-image': { w: '100%', h: 140, fullWidth: true }
}

function px(n) {
  if (typeof n === 'string') return n
  return `${n}px`
}

function collectVnodeClasses(vnode) {
  const classes = []
  if (!vnode || !vnode.data) return classes
  const data = vnode.data
  if (data.staticClass) {
    classes.push(...String(data.staticClass).split(/\s+/))
  }
  const binding = data.class
  if (!binding) return classes
  if (typeof binding === 'string') {
    classes.push(...binding.split(/\s+/))
  } else if (Array.isArray(binding)) {
    binding.forEach((item) => {
      if (typeof item === 'string') classes.push(...item.split(/\s+/))
      else if (item && typeof item === 'object') {
        Object.keys(item).forEach((key) => { if (item[key]) classes.push(key) })
      }
    })
  } else if (typeof binding === 'object') {
    Object.keys(binding).forEach((key) => { if (binding[key]) classes.push(key) })
  }
  return classes.filter(Boolean)
}

function lookupSize(classes, width, height) {
  if (width || height) {
    const w = Number(width) || Number(height) || 40
    const h = Number(height) || Number(width) || w
    return { w, h }
  }
  for (let i = 0; i < classes.length; i++) {
    if (SIZE_MAP[classes[i]]) return SIZE_MAP[classes[i]]
  }
  return null
}

export default {
  name: 'LazyImage',
  inheritAttrs: false,
  props: {
    lazyLoad: {
      type: [Boolean, String],
      default: true
    },
    mode: {
      type: String,
      default: 'aspectFill'
    },
    /** 显式尺寸键名，如 post-avatar / brand-logo */
    size: {
      type: String,
      default: ''
    },
    width: {
      type: [String, Number],
      default: ''
    },
    height: {
      type: [String, Number],
      default: ''
    }
  },
  computed: {
    classList() {
      const list = collectVnodeClasses(this.$vnode)
      if (this.size) list.push(this.size)
      return list
    },
    imageClass() {
      return ['lazy-img', ...this.classList].join(' ')
    },
    sizeSpec() {
      return lookupSize(this.classList, this.width, this.height)
    },
    imageStyle() {
      const spec = this.sizeSpec
      if (!spec) {
        return {
          display: 'inline-block',
          maxWidth: '100%',
          verticalAlign: 'top'
        }
      }
      const style = {
        display: spec.fullWidth ? 'block' : 'inline-block',
        flexShrink: '0',
        overflow: 'hidden',
        verticalAlign: 'top',
        boxSizing: 'border-box'
      }
      if (spec.fullWidth) {
        style.width = '100%'
        style.height = px(spec.h)
        style.maxHeight = px(spec.h)
      } else {
        style.width = px(spec.w)
        style.height = px(spec.h)
        style.minWidth = px(spec.w)
        style.minHeight = px(spec.h)
        style.maxWidth = px(spec.w)
        style.maxHeight = px(spec.h)
      }
      if (spec.round) style.borderRadius = '50%'
      else if (spec.radius) style.borderRadius = `${spec.radius}px`
      return style
    },
    resolvedSrc() {
      const src = this.$attrs.src
      if (src && typeof src === 'object') {
        return src.default || src
      }
      if (!src || typeof src !== 'string') return src
      if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('//')) {
        return src
      }
      if (src.startsWith('/static') || src.startsWith('/assets')) {
        return src
      }
      if (src.startsWith('/')) {
        return BASE_URL + src
      }
      return src
    }
  },
  mounted() {
    this.applyDomSize()
  },
  updated() {
    this.applyDomSize()
  },
  methods: {
    applyDomSize() {
      const spec = this.sizeSpec
      if (!spec) return
      const el = this.$el
      if (!el || !el.style) return
      if (spec.fullWidth) {
        el.style.width = '100%'
        el.style.height = px(spec.h)
        el.style.maxHeight = px(spec.h)
      } else {
        el.style.width = px(spec.w)
        el.style.height = px(spec.h)
        el.style.minWidth = px(spec.w)
        el.style.minHeight = px(spec.h)
        el.style.maxWidth = px(spec.w)
        el.style.maxHeight = px(spec.h)
      }
      el.style.display = 'inline-block'
      el.style.overflow = 'hidden'
      el.style.boxSizing = 'border-box'
      if (spec.round) el.style.borderRadius = '50%'
      else if (spec.radius) el.style.borderRadius = `${spec.radius}px`
      // H5: uni-image 内部 div 背景图同步容器尺寸
      const inner = el.querySelector && el.querySelector('div')
      if (inner) {
        inner.style.width = '100%'
        inner.style.height = '100%'
      }
    }
  }
}
</script>
