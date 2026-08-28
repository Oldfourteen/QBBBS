<template>
  <view class="rich-text-viewer">
    <!-- #ifdef H5 -->
    <view class="rich-text-content" v-html="sanitizedHtml"></view>
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <rich-text class="rich-text-content" :nodes="sanitizedHtml"></rich-text>
    <!-- #endif -->
  </view>
</template>

<script>
import { sanitizeHtml } from '@/utils/sanitizeHtml.js'

export default {
  name: 'RichTextViewer',
  props: {
    html: {
      type: String,
      default: ''
    }
  },
  computed: {
    sanitizedHtml() {
      return sanitizeHtml(this.html)
    }
  }
}
</script>

<style scoped>
.rich-text-viewer {
  width: 100%;
}

.rich-text-content {
  font-size: 15px;
  color: var(--text-tertiary);
  line-height: 1.7;
  word-break: break-word;
}
</style>

<style>
.rich-text-viewer .rich-text-content h1,
.rich-text-viewer .rich-text-content h2,
.rich-text-viewer .rich-text-content h3 {
  font-weight: 700;
  color: var(--text-primary);
  margin: 12px 0 8px;
}

.rich-text-viewer .rich-text-content h1 { font-size: 20px; }
.rich-text-viewer .rich-text-content h2 { font-size: 18px; }
.rich-text-viewer .rich-text-content h3 { font-size: 16px; }

.rich-text-viewer .rich-text-content p {
  margin: 8px 0;
}

.rich-text-viewer .rich-text-content ul,
.rich-text-viewer .rich-text-content ol {
  padding-left: 24px;
  margin: 8px 0;
}

.rich-text-viewer .rich-text-content li {
  margin: 4px 0;
}

.rich-text-viewer .rich-text-content a {
  color: #142850;
  text-decoration: underline;
}

.rich-text-viewer .rich-text-content img {
  max-width: 100%;
  border-radius: 8px;
  margin: 8px 0;
  display: block;
}

.rich-text-viewer .rich-text-content strong,
.rich-text-viewer .rich-text-content b {
  font-weight: 700;
  color: var(--text-primary);
}

.rich-text-viewer .rich-text-content blockquote {
  border-left: 3px solid var(--border-color, #e5e7eb);
  padding-left: 12px;
  margin: 8px 0;
  color: var(--text-secondary);
}
</style>
