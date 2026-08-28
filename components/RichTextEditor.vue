<template>
  <view class="rich-editor">
    <!-- 工具栏 -->
    <view class="toolbar">
      <view class="toolbar-group">
        <view class="tool-btn" :class="{ active: isBold }" @tap="toggleBold" title="加粗">
          <text class="tool-icon">B</text>
        </view>
        <view class="tool-btn" :class="{ active: isItalic }" @tap="toggleItalic" title="斜体">
          <text class="tool-icon" style="font-style: italic;">I</text>
        </view>
        <view class="tool-btn" :class="{ active: isUnderline }" @tap="toggleUnderline" title="下划线">
          <text class="tool-icon" style="text-decoration: underline;">U</text>
        </view>
        <view class="tool-btn" :class="{ active: isStrike }" @tap="toggleStrike" title="删除线">
          <text class="tool-icon" style="text-decoration: line-through;">S</text>
        </view>
      </view>
      <view class="toolbar-divider"></view>
      <view class="toolbar-group">
        <view class="tool-btn" :class="{ active: isH1 }" @tap="toggleHeading('h1')" title="标题1">
          <text class="tool-icon">H1</text>
        </view>
        <view class="tool-btn" :class="{ active: isH2 }" @tap="toggleHeading('h2')" title="标题2">
          <text class="tool-icon">H2</text>
        </view>
      </view>
      <view class="toolbar-divider"></view>
      <view class="toolbar-group">
        <view class="tool-btn" :class="{ active: isOrderedList }" @tap="toggleOrderedList" title="有序列表">
          <text class="tool-icon">1.</text>
        </view>
        <view class="tool-btn" :class="{ active: isUnorderedList }" @tap="toggleUnorderedList" title="无序列表">
          <text class="tool-icon">•</text>
        </view>
      </view>
      <view class="toolbar-divider"></view>
      <view class="toolbar-group">
        <view class="tool-btn" @tap="insertLink" title="链接">
          <text class="tool-icon">Link</text>
        </view>
        <view class="tool-btn" @tap="insertImage" title="图片">
          <text class="tool-icon">Img</text>
        </view>
        <view class="tool-btn" @tap="clearFormat" title="清除格式">
          <text class="tool-icon">Clr</text>
        </view>
      </view>
    </view>

    <!-- 编辑区域 -->
    <view class="editor-wrapper">
      <editor
        id="editor"
        class="editor"
        :placeholder="placeholder"
        :show-img-size="true"
        :show-img-toolbar="true"
        :show-img-resize="true"
        @ready="onEditorReady"
        @input="onInput"
        @statuschange="onStatusChange"
      />
    </view>

    <!-- 链接输入弹窗 -->
    <view class="modal" v-if="showLinkModal" @tap="closeLinkModal">
      <view class="modal-mask"></view>
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">插入链接</text>
          <view class="modal-close" @tap="closeLinkModal">
            <text class="modal-close-icon">×</text>
          </view>
        </view>
        <view class="modal-body">
          <input class="modal-input" v-model="linkUrl" placeholder="请输入链接地址" />
          <input class="modal-input" v-model="linkText" placeholder="请输入链接文字（可选）" />
          <button class="modal-btn" @tap="confirmLink">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'RichTextEditor',
  props: {
    placeholder: {
      type: String,
      default: '请输入内容...'
    },
    value: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      editorCtx: null,
      isBold: false,
      isItalic: false,
      isUnderline: false,
      isStrike: false,
      isH1: false,
      isH2: false,
      isOrderedList: false,
      isUnorderedList: false,
      showLinkModal: false,
      linkUrl: '',
      linkText: '',
      content: ''
    }
  },
  watch: {
    value(val) {
      if (val !== this.content && this.editorCtx) {
        this.editorCtx.setContents({ html: val })
      }
    }
  },
  methods: {
    onEditorReady() {
      uni.createSelectorQuery()
        .in(this)
        .select('#editor')
        .context((res) => {
          this.editorCtx = res.context
          if (this.value) {
            this.editorCtx.setContents({ html: this.value })
          }
        })
        .exec()
    },
    onInput(e) {
      this.content = e.detail.html
      this.$emit('input', e.detail.html)
      this.$emit('change', e.detail.html)
    },
    onStatusChange(e) {
      const formats = e.detail || {}
      this.isBold = !!formats.bold
      this.isItalic = !!formats.italic
      this.isUnderline = !!formats.underline
      this.isStrike = !!formats.strike
      this.isH1 = formats.header === 1
      this.isH2 = formats.header === 2
      this.isOrderedList = !!formats.list && formats.list === 'ordered'
      this.isUnorderedList = !!formats.list && formats.list === 'bullet'
    },
    toggleBold() {
      this.editorCtx && this.editorCtx.format('bold')
    },
    toggleItalic() {
      this.editorCtx && this.editorCtx.format('italic')
    },
    toggleUnderline() {
      this.editorCtx && this.editorCtx.format('underline')
    },
    toggleStrike() {
      this.editorCtx && this.editorCtx.format('strike')
    },
    toggleHeading(level) {
      const header = level === 'h1' ? 1 : 2
      this.editorCtx && this.editorCtx.format('header', header)
    },
    toggleOrderedList() {
      this.editorCtx && this.editorCtx.format('list', 'ordered')
    },
    toggleUnorderedList() {
      this.editorCtx && this.editorCtx.format('list', 'bullet')
    },
    insertLink() {
      this.linkUrl = ''
      this.linkText = ''
      this.showLinkModal = true
    },
    closeLinkModal() {
      this.showLinkModal = false
    },
    confirmLink() {
      if (!this.linkUrl) {
        uni.showToast({ title: '请输入链接地址', icon: 'none' })
        return
      }
      const text = this.linkText || this.linkUrl
      this.editorCtx && this.editorCtx.insertText({
        text: text,
        success: () => {
          this.editorCtx.format('link', this.linkUrl)
        }
      })
      this.showLinkModal = false
    },
    insertImage() {
      uni.chooseImage({
        count: 1,
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0]
          uni.uploadFile({
            url: '/api/upload',
            filePath: tempFilePath,
            name: 'file',
            success: (uploadRes) => {
              try {
                const data = JSON.parse(uploadRes.data)
                const url = data.url || data.data?.url
                if (url) {
                  this.editorCtx && this.editorCtx.insertImage({
                    src: url,
                    alt: '图片'
                  })
                }
              } catch (e) {
                uni.showToast({ title: '图片上传失败', icon: 'none' })
              }
            },
            fail: () => {
              uni.showToast({ title: '图片上传失败', icon: 'none' })
            }
          })
        }
      })
    },
    clearFormat() {
      this.editorCtx && this.editorCtx.removeFormat()
    },
    getContents() {
      return new Promise((resolve) => {
        if (this.editorCtx) {
          this.editorCtx.getContents({
            success: (res) => resolve(res)
          })
        } else {
          resolve({ html: '', text: '' })
        }
      })
    },
    setContents(html) {
      if (this.editorCtx) {
        this.editorCtx.setContents({ html })
      }
    }
  }
}
</script>

<style scoped>
.rich-editor {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-input);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--border-color);
  margin: 0 4px;
}

.tool-btn {
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: transparent;
  transition: all 0.2s;
}

.tool-btn:active {
  background: var(--bg-menu-hover);
  transform: scale(0.95);
}

.tool-btn.active {
  background: var(--accent-color);
}

.tool-btn.active .tool-icon {
  color: #ffffff;
}

.tool-icon {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.editor-wrapper {
  padding: 12px;
  min-height: 200px;
}

.editor {
  min-height: 180px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary);
}

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay-bg);
}

.modal-content {
  position: relative;
  width: 300px;
  background: var(--bg-modal);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}

.modal-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.modal-close-icon {
  font-size: 22px;
  color: var(--text-secondary);
  line-height: 1;
}

.modal-body {
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 15px;
  background: var(--bg-input);
  color: var(--text-primary);
}

.modal-btn {
  width: 100%;
  height: 44px;
  background: var(--accent-color);
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
}
</style>
