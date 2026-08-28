<template>
  <view class="page">
    <view class="header">
      <view class="header-inner">
        <view class="back-btn" @tap="goBack">
          <lazy-image class="back-icon" :src="require('@/assets/image/chevron-left-solid-full.svg')" mode="aspectFit" />
        </view>
        <text class="brand">帖子详情</text>
      </view>
    </view>

    <view class="content">
      <view class="post-card">
        <view class="post-header">
          <lazy-image class="post-avatar" :src="resolveAvatarUrl(post.avatar_url || post.avatar, '/static/avatar/default-avatar/user-avatar1.gif')" mode="aspectFill" />
          <view class="post-info">
            <text class="post-author">{{ post.display_title || post.author_name || post.username || '匿名用户' }}</text>
            <text class="post-time">{{ formatTime(post.created_at) }}</text>
          </view>
        </view>

        <text class="post-title">{{ post.title || '无标题' }}</text>
        <rich-text-viewer class="post-content" :html="post.content" />

        <view class="post-images" v-if="images.length > 0">
          <lazy-image
            v-for="(img, idx) in images"
            :key="idx"
            class="post-image"
            :src="img"
            mode="aspectFit"
            @tap="previewImage(idx)"
          />
        </view>

        <view class="post-actions">
          <view class="action-btn" :class="{ liked: post.is_liked || post.liked }" @tap="handleLike">
            <lazy-image class="action-icon" :src="(post.is_liked || post.liked) ? '/static/image/heart-solid-full-red.svg' : '/static/image/heart-regular-full.svg'" mode="aspectFit" />
            <text class="action-count">{{ post.likes_count || 0 }}</text>
          </view>
          <view class="action-btn" :class="{ boosted: post.is_boosted }" @tap="handleBoost">
            <lazy-image class="action-icon" :src="post.is_boosted ? require('@/assets/image/bolt-solid-full.svg') : require('@/assets/image/bolt-solid-full.svg')" mode="aspectFit" />
            <text class="action-count">{{ post.boost_count || 0 }}</text>
          </view>
          <view class="action-btn">
            <lazy-image class="action-icon" :src="require('@/assets/image/comment-dots-regular-full.svg')" mode="aspectFit" />
            <text class="action-count">{{ post.comments_count || 0 }}</text>
          </view>
        </view>
      </view>

      <!-- 评论区 -->
      <view class="comments-section">
        <text class="section-title">评论 ({{ rootComments.length }})</text>
        <view v-if="loadingComments" class="loading">
          <text>加载评论中...</text>
        </view>
        <view v-else-if="rootComments.length === 0" class="empty">
          <text>暂无评论，快来发表第一条评论吧！</text>
        </view>
        <view v-else class="comments-list">
          <view
            v-for="comment in rootComments"
            :key="comment.comment_id || comment.id"
            class="comment-block"
          >
            <view
              class="comment-item"
              :class="[
                'comment-target-' + (comment.comment_id || comment.id),
                { highlight: isHighlighted(comment) }
              ]"
            >
              <lazy-image class="comment-avatar" :src="resolveAvatarUrl(comment.avatar_url || comment.avatar, '/static/avatar/default-avatar/user-avatar1.gif')" mode="aspectFill" />
              <view class="comment-body">
                <view class="comment-header">
                  <text class="comment-author">{{ comment.display_title || comment.username || '匿名用户' }}</text>
                  <text class="comment-time">{{ formatTime(comment.created_at) }}</text>
                </view>
                <text class="comment-content">{{ comment.content }}</text>
                <view class="comment-actions">
                  <view class="comment-like" :class="{ liked: comment.is_liked }" @tap="handleCommentLike(comment)">
                    <lazy-image class="action-icon-small" :src="comment.is_liked ? '/static/image/heart-solid-full-red.svg' : '/static/image/heart-regular-full.svg'" mode="aspectFit" />
                    <text @tap.stop="showCommentLikers(comment)">{{ comment.likes_count || 0 }}</text>
                  </view>
                  <text class="comment-reply" @tap="startReply(comment)">回复</text>
                  <text
                    v-if="comment.children.length"
                    class="comment-reply"
                    @tap="toggleReplies(comment.comment_id || comment.id)"
                  >
                    {{ expandedIds.has(comment.comment_id || comment.id) ? '收起回复' : `共${countReplies(comment)}条回复` }}
                  </text>
                </view>
              </view>
            </view>

            <view
              v-if="comment.children.length && expandedIds.has(comment.comment_id || comment.id)"
              class="reply-list"
            >
              <view
                v-for="reply in flattenReplies(comment.children)"
                :key="reply.comment_id || reply.id"
                class="reply-item"
                :style="{ marginLeft: (reply._depth * 10) + 'px' }"
                :class="[
                  'comment-target-' + (reply.comment_id || reply.id),
                  { highlight: isHighlighted(reply) }
                ]"
              >
                <lazy-image class="reply-avatar" :src="resolveAvatarUrl(reply.avatar_url, '/static/avatar/default-avatar/user-avatar1.gif')" mode="aspectFill" />
                <view class="reply-body">
                  <view class="reply-header">
                    <text class="reply-author">{{ reply.display_title || reply.username || '匿名用户' }}</text>
                    <text v-if="getReplyTarget(reply)" class="reply-to">回复 {{ getReplyTarget(reply) }}</text>
                  </view>
                  <text class="reply-content">{{ reply.content }}</text>
                  <view class="comment-actions">
                    <view class="comment-like" :class="{ liked: reply.is_liked }" @tap="handleCommentLike(reply)">
                      <lazy-image class="action-icon-small" :src="reply.is_liked ? '/static/image/heart-solid-full-red.svg' : '/static/image/heart-regular-full.svg'" mode="aspectFit" />
                      <text @tap.stop="showCommentLikers(reply)">{{ reply.likes_count || 0 }}</text>
                    </view>
                    <text class="comment-reply" @tap="startReply(reply)">回复</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部评论输入 -->
    <view class="comment-input-bar">
      <view v-if="replyTarget" class="reply-hint">
        <text>回复 {{ replyTarget.display_title || replyTarget.username }}</text>
        <text class="cancel-reply" @tap="cancelReply">取消</text>
      </view>
      <view class="input-row">
        <input class="comment-input" v-model="newComment" :placeholder="replyTarget ? '写下你的回复...' : '发表评论...'" />
        <button class="comment-submit" @tap="submitComment" :disabled="!newComment.trim()">
          <lazy-image class="send-icon" :src="require('@/assets/image/paper-plane-regular-full.svg')" mode="aspectFit" />
        </button>
      </view>
    </view>

    <view v-if="likerModalVisible" class="modal-mask" @tap="closeLikerModal">
      <view class="modal-panel" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">点赞的人</text>
          <text class="modal-close" @tap="closeLikerModal">关闭</text>
        </view>
        <view v-if="loadingCommentLikers" class="modal-loading">
          <text>加载中...</text>
        </view>
        <view v-else-if="commentLikers.length === 0" class="modal-empty">
          <text>还没有人点赞</text>
        </view>
        <scroll-view v-else scroll-y class="modal-list">
          <view class="modal-user-item" v-for="item in commentLikers" :key="item.like_id">
            <lazy-image class="modal-avatar" :src="resolveAvatarUrl(item.avatar_url, '/static/avatar/default-avatar/user-avatar1.gif')" mode="aspectFill" />
            <view class="modal-user-info">
              <text class="modal-user-name">{{ item.display_title || item.username || '匿名用户' }}</text>
              <text class="modal-user-time">{{ formatTime(item.created_at) }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'
import { formatTime, resolveAvatarUrl } from '@/utils/index.js'

export default {
  data() {
    return {
      postId: null,
      targetCommentId: null,
      post: {},
      images: [],
      rootComments: [],
      expandedIds: new Set(),
      loadingComments: false,
      newComment: '',
      replyTarget: null,
      likerModalVisible: false,
      commentLikers: [],
      loadingCommentLikers: false
    }
  },
  onLoad(options) {
    this.postId = options.id
    this.targetCommentId = options.commentId ? Number(options.commentId) : null
    if (this.postId) {
      this.loadPost()
      this.loadComments()
    }
  },
  onReady() {
    if (this.targetCommentId) {
      this.scrollToComment()
    }
  },
  methods: {
    formatTime,
    resolveAvatarUrl,
    goBack() {
      uni.navigateBack()
    },
    getImages() {
      if (!this.post.images) return []
      try {
        return Array.isArray(this.post.images) ? this.post.images : JSON.parse(this.post.images)
      } catch (e) {
        return []
      }
    },
    async loadPost() {
      try {
        const userInfo = uni.getStorageSync('userInfo')
        const userId = userInfo?.id || userInfo?.user_id || 0
        const post = await api.getPostDetail(this.postId, userId)
        this.post = post
        this.images = this.getImages()
      } catch (e) {
        console.error('Load post failed:', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },
    async loadComments() {
      this.loadingComments = true
      try {
        const userInfo = uni.getStorageSync('userInfo')
        const userId = userInfo?.id || userInfo?.user_id || 0
        const comments = await api.getComments(this.postId, userId)
        this.rootComments = this.buildCommentTree(comments || [])
        if (this.targetCommentId) {
          this.expandToComment(this.targetCommentId, this.rootComments)
          this.$nextTick(() => {
            this.scrollToComment()
          })
        }
      } catch (e) {
        console.error('Load comments failed:', e)
      } finally {
        this.loadingComments = false
      }
    },
    scrollToComment() {
      const query = uni.createSelectorQuery().in(this)
      query.select(`.comment-target-${this.targetCommentId}`).boundingClientRect()
      query.selectViewport().scrollOffset()
      query.exec((res) => {
        if (res && res[0]) {
          const rect = res[0]
          const scrollOffset = res[1]
          const targetTop = rect.top + scrollOffset.scrollTop - 120
          uni.pageScrollTo({ scrollTop: targetTop, duration: 300 })
        }
      })
    },
    previewImage(index) {
      uni.previewImage({
        current: index,
        urls: this.images
      })
    },
    async handleLike() {
      const userInfo = uni.getStorageSync('userInfo')
      if (!userInfo) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      try {
        const userId = userInfo.id || userInfo.user_id
        const res = await api.likePost(this.postId, userId)
        this.post.is_liked = res.is_liked
        this.post.likes_count = res.likes_count
      } catch (e) {
        console.error('Like failed:', e)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    async handleBoost() {
      if (this.post.is_boosted) {
        uni.showToast({ title: '您已经助力过了，每人只能助力一次哦~', icon: 'none' })
        return
      }

      const userInfo = uni.getStorageSync('userInfo')
      if (!userInfo) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      try {
        const userId = userInfo.id || userInfo.user_id
        const res = await api.boostPost(this.postId, userId)
        if (res.already_boosted) {
          this.post.is_boosted = true
          uni.showToast({ title: '您已经助力过了，每人只能助力一次哦~', icon: 'none' })
          return
        }
        this.post.is_boosted = true
        this.post.boost_count = res.boost_count
        uni.showToast({ title: '助力成功！感谢你的支持', icon: 'success' })
      } catch (e) {
        console.error('Boost failed:', e)
        uni.showToast({ title: '助力失败', icon: 'none' })
      }
    },
    async handleCommentLike(comment) {
      const userInfo = uni.getStorageSync('userInfo')
      if (!userInfo) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      try {
        const userId = userInfo.id || userInfo.user_id
        const res = await api.likeComment(comment.comment_id || comment.id, userId)
        comment.is_liked = res.is_liked
        comment.likes_count = res.likes_count
      } catch (e) {
        console.error('Comment like failed:', e)
      }
    },
    buildCommentTree(comments) {
      const map = new Map()
      const normalized = comments.map((comment) => ({ ...comment, children: [] }))
      normalized.forEach((comment) => {
        map.set(comment.comment_id || comment.id, comment)
      })
      const roots = []
      normalized.forEach((comment) => {
        const parentId = comment.parent_id
        if (parentId && map.has(parentId)) {
          map.get(parentId).children.push(comment)
          return
        }
        roots.push(comment)
      })
      const sortChildren = (list) => {
        list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        list.forEach((item) => sortChildren(item.children))
      }
      roots.sort((a, b) => {
        const likeGap = Number(b.likes_count || 0) - Number(a.likes_count || 0)
        if (likeGap !== 0) return likeGap
        return new Date(a.created_at) - new Date(b.created_at)
      })
      sortChildren(roots)
      return roots
    },
    expandToComment(commentId, comments) {
      for (const comment of comments) {
        if ((comment.comment_id || comment.id) === commentId) return true
        if (comment.children.some((child) => (child.comment_id || child.id) === commentId)) {
          this.expandedIds.add(comment.comment_id || comment.id)
          this.expandedIds = new Set(this.expandedIds)
          return true
        }
        if (this.expandToComment(commentId, comment.children)) {
          this.expandedIds.add(comment.comment_id || comment.id)
          this.expandedIds = new Set(this.expandedIds)
          return true
        }
      }
      return false
    },
    countReplies(comment) {
      return comment.children.reduce((sum, child) => sum + 1 + this.countReplies(child), 0)
    },
    flattenReplies(children, depth = 0) {
      const result = []
      children.forEach((child) => {
        result.push({ ...child, _depth: depth })
        if (child.children.length) {
          result.push(...this.flattenReplies(child.children, depth + 1))
        }
      })
      return result
    },
    toggleReplies(commentId) {
      if (this.expandedIds.has(commentId)) {
        this.expandedIds.delete(commentId)
      } else {
        this.expandedIds.add(commentId)
      }
      this.expandedIds = new Set(this.expandedIds)
    },
    getReplyTarget(reply) {
      return reply.parent_display_title || reply.parent_username || ''
    },
    isHighlighted(comment) {
      if (!this.targetCommentId) return false
      return (comment.comment_id || comment.id) === this.targetCommentId
    },
    startReply(comment) {
      this.replyTarget = comment
    },
    cancelReply() {
      this.replyTarget = null
    },
    async showCommentLikers(comment) {
      const commentId = comment.comment_id || comment.id
      if (!commentId || !(comment.likes_count > 0)) {
        uni.showToast({ title: '暂无点赞', icon: 'none' })
        return
      }
      this.likerModalVisible = true
      this.loadingCommentLikers = true
      this.commentLikers = []
      try {
        this.commentLikers = await api.getCommentLikes(commentId) || []
      } catch (e) {
        console.error('Load comment likers failed:', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
        this.likerModalVisible = false
      } finally {
        this.loadingCommentLikers = false
      }
    },
    closeLikerModal() {
      this.likerModalVisible = false
      this.commentLikers = []
    },
    async submitComment() {
      const userInfo = uni.getStorageSync('userInfo')
      if (!userInfo) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }
      if (!this.newComment.trim()) return

      try {
        const userId = userInfo.id || userInfo.user_id
        const payload = {
          user_id: userId,
          content: this.newComment.trim()
        }
        if (this.replyTarget) {
          payload.parent_id = this.replyTarget.comment_id || this.replyTarget.id
        }
        await api.createComment(this.postId, payload)
        this.newComment = ''
        this.replyTarget = null
        uni.showToast({ title: '评论成功', icon: 'success' })
        this.loadComments()
        this.post.comments_count = (this.post.comments_count || 0) + 1
      } catch (e) {
        console.error('Submit comment failed:', e)
        uni.showToast({ title: '评论失败', icon: 'none' })
      }
    }
  }
}
</script>

<style>
.page { min-height: 100vh; background: var(--bg-primary); padding-bottom: 80px; }
.header { position: fixed; top: 0; left: 0; right: 0; height: 88px; background: var(--header-bg); z-index: 999; }
.header-inner { height: 100%; display: flex; align-items: center; justify-content: center; position: relative; padding-top: 10px; }
.back-btn { position: absolute; left: 16px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
.back-icon { width: 24px; height: 24px; filter: brightness(0) invert(1); }
.brand { font-size: 20px; font-weight: 700; color: var(--text-inverse); }
.content { padding: 108px 16px 20px; }
.post-card { background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color); padding: 20px; margin-bottom: 16px; }
.post-header { display: flex; align-items: center; margin-bottom: 16px; }
.post-avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 12px; }
.post-info { flex: 1; }
.post-author { font-size: 16px; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 2px; }
.post-time { font-size: 12px; color: var(--text-secondary); }
.post-title { font-size: 18px; font-weight: 700; color: var(--text-primary); display: block; margin-bottom: 12px; }
.post-content { display: block; margin-bottom: 16px; }
.post-images { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.post-image { width: calc(50% - 4px); border-radius: 8px; }
.post-actions { display: flex; justify-content: space-around; padding-top: 16px; border-top: 1px solid var(--border-light); }
.action-btn { display: flex; align-items: center; gap: 8px; padding: 8px 20px; }
.action-btn.liked .action-count { color: #ef4444; }
.action-btn.boosted .action-count { color: #f59e0b; }
.action-icon { width: 20px; height: 20px; }
.action-count { font-size: 14px; color: var(--text-secondary); }
.comments-section { background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color); padding: 16px; }
.section-title { font-size: 16px; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 16px; }
.loading, .empty { text-align: center; padding: 20px; color: var(--text-secondary); font-size: 14px; }
.comments-list { display: flex; flex-direction: column; gap: 16px; }
.comment-item { display: flex; gap: 12px; }
.comment-item.highlight {
  animation: highlightPulse 2s ease;
}
@keyframes highlightPulse {
  0% { background: rgba(59, 130, 246, 0.15); }
  100% { background: transparent; }
}
.comment-avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
.comment-body { flex: 1; }
.comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.comment-author { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.comment-time { font-size: 12px; color: var(--text-secondary); }
.comment-content { font-size: 14px; color: var(--text-tertiary); line-height: 1.6; display: block; margin-bottom: 8px; }
.comment-actions { display: flex; gap: 16px; }
.comment-like { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-secondary); }
.comment-like.liked { color: #ef4444; }
.comment-reply { font-size: 12px; color: var(--accent-color); }
.reply-list { margin-left: 48px; margin-top: 8px; display: flex; flex-direction: column; gap: 10px; padding-left: 12px; border-left: 2px solid var(--border-light); }
.reply-item { display: flex; gap: 10px; }
.reply-avatar { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; }
.reply-body { flex: 1; min-width: 0; }
.reply-header { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
.reply-author { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.reply-to { font-size: 12px; color: var(--text-secondary); }
.reply-content { font-size: 13px; color: var(--text-tertiary); line-height: 1.6; display: block; margin-bottom: 6px; }
.action-icon-small { width: 14px; height: 14px; }
.comment-input-bar { position: fixed; bottom: 0; left: 0; right: 0; background: var(--bg-card); border-top: 1px solid var(--border-color); padding: 8px 16px; z-index: 1000; }
.reply-hint { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 12px; color: var(--text-secondary); }
.cancel-reply { color: var(--accent-color); }
.input-row { display: flex; align-items: center; gap: 12px; }
.modal-mask { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); z-index: 1001; display: flex; align-items: flex-end; }
.modal-panel { width: 100%; max-height: 60vh; background: var(--bg-card); border-radius: 16px 16px 0 0; padding: 16px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.modal-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.modal-close { font-size: 14px; color: var(--accent-color); }
.modal-list { max-height: 45vh; }
.modal-loading, .modal-empty { text-align: center; padding: 24px; color: var(--text-secondary); font-size: 14px; }
.modal-user-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border-light); }
.modal-avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
.modal-user-info { flex: 1; }
.modal-user-name { font-size: 14px; font-weight: 600; color: var(--text-primary); display: block; }
.modal-user-time { font-size: 12px; color: var(--text-secondary); }
.comment-input { flex: 1; height: 40px; padding: 0 16px; background: var(--bg-comment-input); border-radius: 20px; font-size: 14px; border: none; color: var(--text-primary); }
.comment-submit { width: 40px; height: 40px; background: var(--accent-color); border-radius: 12px; display: flex; align-items: center; justify-content: center; border: none; padding: 0; }
.comment-submit[disabled] { opacity: 0.5; }
.send-icon { width: 18px; height: 18px; }
</style>
