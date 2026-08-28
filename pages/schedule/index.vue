<template>
  <view class="page">
    <view class="header">
      <view class="header-inner">
        <view class="back-btn" @tap="goBack">
          <text class="back-icon">←</text>
        </view>
        <text class="header-title">个人课表</text>
      </view>
    </view>

    <view class="content">
      <!-- 设置区域 -->
      <view class="settings-bar">
        <view class="setting-item" @tap="showYearPicker">
          <text class="setting-label">学年</text>
          <text class="setting-value">{{ currentYear }}年</text>
        </view>
        <view class="setting-item" @tap="showDatePicker">
          <text class="setting-label">开学日期</text>
          <text class="setting-value">{{ formatDate(startDate) }}</text>
        </view>
        <view class="setting-item">
          <text class="setting-label">第{{ currentWeek }}周</text>
          <text class="setting-value" :class="{'today-tag': isToday}">今天 {{ todayLabel }}</text>
        </view>
      </view>

      <!-- 课表网格 -->
      <view class="schedule-container">
        <!-- 表头：周一到周日 -->
        <view class="schedule-header">
          <view class="time-header-cell"></view>
          <view 
            v-for="(day, index) in weekDays" 
            :key="index" 
            class="day-header-cell"
            :class="{'today': index === todayIndex}"
          >
            <text class="day-name">{{ day.name }}</text>
            <text class="day-date">{{ day.date }}</text>
          </view>
        </view>

        <!-- 课表主体 -->
        <scroll-view scroll-y class="schedule-body">
          <view 
            v-for="(period, pIndex) in periods" 
            :key="pIndex"
            class="period-row"
            :class="{'break-row': period.isBreak, 'news-row': period.isNews}"
          >
            <!-- 时间段标签 -->
            <view class="period-label">
              <text class="period-name">{{ period.name }}</text>
              <text v-if="period.time" class="period-time">{{ period.time }}</text>
            </view>

            <!-- 每天的课程 -->
            <view 
              v-for="dayIndex in 7" 
              :key="dayIndex - 1"
              class="course-cell"
              :class="{
                'today': (dayIndex - 1) === todayIndex,
                'editable': isEditMode && !period.isBreak && !period.isNews,
                'break-cell': period.isBreak,
                'news-cell': period.isNews
              }"
              @tap="handleCellTap(pIndex, dayIndex - 1)"
            >
              <view v-if="getCourse(pIndex, dayIndex - 1)" class="course-card">
                <text class="course-name">{{ getCourse(pIndex, dayIndex - 1).courseName }}</text>
                <text class="course-room">{{ getCourse(pIndex, dayIndex - 1).room }}</text>
                <text class="course-teacher">{{ getCourse(pIndex, dayIndex - 1).teacher }}</text>
              </view>
              <view v-else-if="isEditMode && !period.isBreak && !period.isNews" class="add-hint">
                <text class="add-icon">+</text>
              </view>
              <view v-else-if="period.isBreak" class="break-content">
                <text>午休</text>
              </view>
              <view v-else-if="period.isNews" class="news-content">
                <text>普训新闻</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="action-bar">
        <text class="action-btn import-btn" @tap="importFromPdf">导入PDF</text>
        <text class="action-btn widget-btn" @tap="addWidget">小组件</text>
        <text class="action-btn edit-btn" @tap="toggleEdit">{{ isEditMode ? '完成' : '编辑' }}</text>
      </view>
    </view>

    <!-- 添加/编辑课程弹窗 -->
    <view class="modal" v-if="showModal" @tap="closeModal">
      <view class="modal-mask"></view>
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingCourse ? '编辑课程' : '添加课程' }}</text>
          <view class="modal-close" @tap="closeModal">
            <text class="modal-close-icon">×</text>
          </view>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">课程名称</text>
            <input 
              class="form-input" 
              v-model="form.courseName" 
              placeholder="请输入课程名称"
              maxlength="20"
            />
          </view>
          <view class="form-item">
            <text class="form-label">任课老师</text>
            <input 
              class="form-input" 
              v-model="form.teacher" 
              placeholder="请输入任课老师"
              maxlength="10"
            />
          </view>
          <view class="form-item">
            <text class="form-label">上课位置</text>
            <input 
              class="form-input" 
              v-model="form.room" 
              placeholder="请输入上课位置"
              maxlength="15"
            />
          </view>
          <view class="form-item">
            <text class="form-label">星期</text>
            <picker mode="selector" :range="weekDayNames" :value="form.dayIndex" @change="onDayChange">
              <view class="form-picker">{{ weekDayNames[form.dayIndex] }}</view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">节次</text>
            <picker mode="selector" :range="periodNames" :value="form.periodIndex" @change="onPeriodChange">
              <view class="form-picker">{{ periodNames[form.periodIndex] }}</view>
            </picker>
          </view>
        </view>
        <view class="modal-footer">
          <button v-if="editingCourse" class="btn-delete" @tap="deleteCourse">删除</button>
          <button class="btn-cancel" @tap="closeModal">取消</button>
          <button class="btn-confirm" @tap="saveCourse">确定</button>
        </view>
      </view>
    </view>

    <!-- 学年选择器 -->
    <picker-view v-if="showYearPickerView" class="picker-view" :value="[yearPickerIndex]" @change="onYearPickerChange">
      <picker-view-column>
        <view v-for="(year, index) in yearOptions" :key="index" class="picker-item">{{ year }}年</view>
      </picker-view-column>
    </picker-view>
  </view>
</template>

<script>
import api from '@/utils/api.js'
import { choosePdfFile } from '@/utils/schedulePdf.js'

const STORAGE_KEY = 'user_schedule_data'
const PERIODS = [
  { name: '第一节', time: '08:00-08:45', isBreak: false, isNews: false },
  { name: '第二节', time: '08:55-09:40', isBreak: false, isNews: false },
  { name: '第三节', time: '10:00-10:45', isBreak: false, isNews: false },
  { name: '第四节', time: '10:55-11:40', isBreak: false, isNews: false },
  { name: '午休', time: '11:40-13:30', isBreak: true, isNews: false },
  { name: '第五节', time: '13:30-14:15', isBreak: false, isNews: false },
  { name: '第六节', time: '14:25-15:10', isBreak: false, isNews: false },
  { name: '第七节', time: '15:20-16:05', isBreak: false, isNews: false },
  { name: '第八节课', time: '16:15-17:00', isBreak: false, isNews: false },
  { name: '普训新闻', time: '17:00-18:00', isBreak: false, isNews: true },
  { name: '第九节', time: '19:00-21:00', isBreak: false, isNews: false }
]

export default {
  data() {
    return {
      isEditMode: false,
      showModal: false,
      showYearPickerView: false,
      yearPickerIndex: 0,
      currentYear: new Date().getFullYear(),
      startDate: this.getDefaultStartDate(),
      courses: {},
      editingCourse: null,
      form: {
        courseName: '',
        teacher: '',
        room: '',
        dayIndex: 0,
        periodIndex: 0
      },
      periods: PERIODS,
      weekDays: [],
      todayIndex: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1,
      currentWeek: 1,
      isToday: true,
      todayLabel: '',
      importingPdf: false
    }
  },
  computed: {
    weekDayNames() {
      return ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    periodNames() {
      return this.periods.map(p => p.name)
    },
    yearOptions() {
      const years = []
      const current = new Date().getFullYear()
      for (let i = current - 2; i <= current + 2; i++) {
        years.push(i)
      }
      return years
    }
  },
  mounted() {
    this.loadData()
    this.updateWeekInfo()
    this.generateWeekDays()
  },
  methods: {
    getDefaultStartDate() {
      const now = new Date()
      const year = now.getFullYear()
      // 默认9月1日
      const date = new Date(year, 8, 1)
      // 调整到周一
      const day = date.getDay()
      const diff = day === 0 ? -6 : 1 - day
      date.setDate(date.getDate() + diff)
      return date.toISOString().split('T')[0]
    },
    loadData() {
      try {
        const data = uni.getStorageSync(STORAGE_KEY)
        if (data) {
          const parsed = JSON.parse(data)
          this.currentYear = parsed.currentYear || this.currentYear
          this.startDate = parsed.startDate || this.startDate
          this.courses = parsed.courses || {}
        }
      } catch (e) {
        console.error('Load schedule failed:', e)
      }
    },
    saveData() {
      try {
        const data = {
          currentYear: this.currentYear,
          startDate: this.startDate,
          courses: this.courses
        }
        uni.setStorageSync(STORAGE_KEY, JSON.stringify(data))
      } catch (e) {
        console.error('Save schedule failed:', e)
      }
    },
    updateWeekInfo() {
      const now = new Date()
      const start = new Date(this.startDate)
      const diffTime = now.getTime() - start.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      this.currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1)
      
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      this.todayLabel = dayNames[now.getDay()]
    },
    generateWeekDays() {
      const now = new Date()
      const currentDay = now.getDay()
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
      const monday = new Date(now)
      monday.setDate(now.getDate() + mondayOffset)
      
      const days = []
      const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday)
        date.setDate(monday.getDate() + i)
        days.push({
          name: dayNames[i],
          date: `${date.getMonth() + 1}/${date.getDate()}`
        })
      }
      this.weekDays = days
    },
    getCourse(periodIndex, dayIndex) {
      const key = `${dayIndex}_${periodIndex}`
      return this.courses[key] || null
    },
    toggleEdit() {
      this.isEditMode = !this.isEditMode
    },
    handleCellTap(periodIndex, dayIndex) {
      if (!this.isEditMode) return
      if (this.periods[periodIndex].isBreak || this.periods[periodIndex].isNews) return
      
      const key = `${dayIndex}_${periodIndex}`
      const existing = this.courses[key]
      
      if (existing) {
        this.editingCourse = { ...existing, key }
        this.form = { ...existing, dayIndex, periodIndex }
      } else {
        this.editingCourse = null
        this.form = {
          courseName: '',
          teacher: '',
          room: '',
          dayIndex,
          periodIndex
        }
      }
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
      this.editingCourse = null
    },
    saveCourse() {
      if (!this.form.courseName.trim()) {
        uni.showToast({ title: '请输入课程名称', icon: 'none' })
        return
      }
      
      const key = `${this.form.dayIndex}_${this.form.periodIndex}`
      this.courses[key] = {
        courseName: this.form.courseName.trim(),
        teacher: this.form.teacher.trim(),
        room: this.form.room.trim()
      }
      
      this.saveData()
      this.closeModal()
      uni.showToast({ title: '保存成功', icon: 'success' })
    },
    deleteCourse() {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这门课程吗？',
        success: (res) => {
          if (res.confirm) {
            const key = `${this.form.dayIndex}_${this.form.periodIndex}`
            delete this.courses[key]
            this.saveData()
            this.closeModal()
            uni.showToast({ title: '删除成功', icon: 'success' })
          }
        }
      })
    },
    onDayChange(e) {
      this.form.dayIndex = parseInt(e.detail.value)
    },
    onPeriodChange(e) {
      this.form.periodIndex = parseInt(e.detail.value)
    },
    showYearPicker() {
      const index = this.yearOptions.indexOf(this.currentYear)
      this.yearPickerIndex = index >= 0 ? index : 0
      uni.showActionSheet({
        itemList: this.yearOptions.map(y => `${y}年`),
        success: (res) => {
          this.currentYear = this.yearOptions[res.tapIndex]
          this.saveData()
        }
      })
    },
    showDatePicker() {
      uni.showModal({
        title: '设置开学日期',
        editable: true,
        placeholderText: '格式: 2025-09-01',
        content: this.startDate,
        success: (res) => {
          if (res.confirm && res.content) {
            const date = new Date(res.content)
            if (!isNaN(date.getTime())) {
              this.startDate = res.content
              this.updateWeekInfo()
              this.saveData()
            } else {
              uni.showToast({ title: '日期格式错误', icon: 'none' })
            }
          }
        }
      })
    },
    formatDate(dateStr) {
      const date = new Date(dateStr)
      return `${date.getMonth() + 1}月${date.getDate()}日`
    },
    goBack() {
      uni.navigateBack()
    },
    addWidget() {
      uni.showModal({
        title: '添加桌面小组件',
        content: '请长按桌面空白处，选择添加小组件，然后选择"今日课表"（4x4大小）即可在桌面显示今日课程。',
        showCancel: false,
        confirmText: '知道了'
      })
    },
    async importFromPdf() {
      if (this.importingPdf) return

      try {
        const filePath = await choosePdfFile()
        uni.showModal({
          title: '导入课表',
          content: '识别后将覆盖当前课表，是否继续？',
          success: async (res) => {
            if (!res.confirm) return
            await this.parseAndApplyPdf(filePath)
          }
        })
      } catch (err) {
        uni.showToast({
          title: err.message || '选择 PDF 失败',
          icon: 'none'
        })
      }
    },
    async parseAndApplyPdf(filePath) {
      this.importingPdf = true
      uni.showLoading({ title: '正在识别课表...', mask: true })

      try {
        const result = await api.parseSchedulePdf(filePath)
        const importedCourses = result.courses || {}
        const count = result.count || Object.keys(importedCourses).length

        if (!count) {
          throw new Error(result.message || '未能识别课表内容')
        }

        this.courses = importedCourses
        this.saveData()
        uni.showToast({
          title: result.message || `已导入 ${count} 门课程`,
          icon: 'success'
        })
      } catch (err) {
        uni.showToast({
          title: err.message || 'PDF 识别失败',
          icon: 'none',
          duration: 2500
        })
      } finally {
        this.importingPdf = false
        uni.hideLoading()
      }
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100%;
  background-color: var(--bg-primary);
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 88px;
  background: var(--header-bg);
  z-index: 999;
}

.header-inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 10px 16px 0;
}

.back-btn {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 5px;
}

.back-icon {
  font-size: 22px;
  color: var(--text-inverse);
  font-weight: 700;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-inverse);
  margin-top: 5px;
}

.content {
  padding-top: 88px;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 88px);
}

.settings-bar {
  display: flex;
  padding: 12px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
  gap: 16px;
  flex-shrink: 0;
}

.setting-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.setting-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.setting-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.today-tag {
  color: var(--accent-hover);
}

.schedule-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--bg-card);
}

.schedule-header {
  display: flex;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-primary);
}

.time-header-cell {
  width: 60px;
  min-width: 60px;
  padding: 8px 4px;
  border-right: 1px solid var(--border-light);
}

.day-header-cell {
  flex: 1;
  padding: 8px 2px;
  text-align: center;
  border-right: 1px solid var(--border-light);
}

.day-header-cell.today {
  background: rgba(27, 61, 122, 0.08);
}

.day-header-cell:last-child {
  border-right: none;
}

.day-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.day-date {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.schedule-body {
  flex: 1;
  height: 0;
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-top: 1px solid var(--border-light);
  flex-shrink: 0;
}

.action-btn {
  flex: 1;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 10px 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 10px;
}

.action-btn.edit-btn {
  color: #ffffff;
  background: #1b3d7a;
  border-color: #1b3d7a;
}

.period-row {
  display: flex;
  border-bottom: 1px solid var(--border-light);
  min-height: 70px;
}

.period-row.break-row {
  min-height: 50px;
  background: var(--bg-primary);
}

.period-row.news-row {
  min-height: 55px;
  background: rgba(27, 61, 122, 0.04);
}

.period-label {
  width: 60px;
  min-width: 60px;
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px solid var(--border-light);
  background: var(--bg-primary);
}

.period-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

.period-time {
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 2px;
  text-align: center;
}

.course-cell {
  flex: 1;
  padding: 4px 2px;
  border-right: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.course-cell:last-child {
  border-right: none;
}

.course-cell.today {
  background: rgba(27, 61, 122, 0.04);
}

.course-cell.editable {
  cursor: pointer;
}

.course-cell.editable:active {
  background: rgba(27, 61, 122, 0.1);
}

.break-cell {
  background: var(--bg-primary);
}

.news-cell {
  background: rgba(27, 61, 122, 0.04);
}

.course-card {
  width: 100%;
  height: 100%;
  background: #142850;
  border-radius: 6px;
  padding: 4px 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.course-name {
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
  line-height: 1.2;
}

.course-room {
  font-size: 10px;
  color: rgba(255,255,255,0.8);
  text-align: center;
}

.course-teacher {
  font-size: 10px;
  color: rgba(255,255,255,0.7);
  text-align: center;
}

.add-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.add-icon {
  font-size: 20px;
  color: var(--text-secondary);
}

.break-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.news-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
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
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  width: 320px;
  background: var(--bg-card);
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
  font-size: 18px;
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
  padding: 16px 20px;
}

.form-item {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary);
  box-sizing: border-box;
}

.form-picker {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.modal-footer {
  display: flex;
  padding: 0 20px 16px;
  gap: 10px;
}

.btn-cancel {
  flex: 1;
  height: 44px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-confirm {
  flex: 1;
  height: 44px;
  background: #1b3d7a;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete {
  flex: 1;
  height: 44px;
  background: #ef4444;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
