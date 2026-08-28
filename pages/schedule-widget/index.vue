<template>
  <view class="widget-page">
    <view class="widget-header">
      <text class="widget-title">今日课表</text>
      <text class="widget-date">{{ todayDate }}</text>
    </view>
    <view class="widget-body">
      <view v-if="todayCourses.length === 0" class="widget-empty">
        <text>今日暂无课程</text>
      </view>
      <view v-else class="widget-list">
        <view 
          v-for="(course, index) in todayCourses" 
          :key="index"
          class="widget-item"
          :class="{'current': course.isCurrent}"
        >
          <view class="widget-time">{{ course.time }}</view>
          <view class="widget-info">
            <text class="widget-course-name">{{ course.courseName }}</text>
            <text class="widget-course-room">{{ course.room }}</text>
          </view>
        </view>
      </view>
    </view>
    <view class="widget-footer">
      <text class="widget-tip">第{{ currentWeek }}周 {{ weekDayName }}</text>
    </view>
  </view>
</template>

<script>
const STORAGE_KEY = 'user_schedule_data'
const PERIODS = [
  { name: '第一节', time: '08:00-08:45' },
  { name: '第二节', time: '08:55-09:40' },
  { name: '第三节', time: '10:00-10:45' },
  { name: '第四节', time: '10:55-11:40' },
  { name: '午休', time: '11:40-13:30', isBreak: true },
  { name: '第五节', time: '13:30-14:15' },
  { name: '第六节', time: '14:25-15:10' },
  { name: '第七节', time: '15:20-16:05' },
  { name: '第八节课', time: '16:15-17:00' },
  { name: '普训新闻', time: '17:00-18:00', isNews: true },
  { name: '第九节', time: '19:00-21:00' }
]

export default {
  data() {
    return {
      todayCourses: [],
      todayDate: '',
      currentWeek: 1,
      weekDayName: ''
    }
  },
  mounted() {
    this.loadTodayCourses()
  },
  methods: {
    loadTodayCourses() {
      try {
        const data = uni.getStorageSync(STORAGE_KEY)
        const now = new Date()
        const todayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1
        
        // 设置日期信息
        const month = now.getMonth() + 1
        const date = now.getDate()
        this.todayDate = `${month}月${date}日`
        
        const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        this.weekDayName = weekDays[todayIndex]
        
        let courses = {}
        let startDate = ''
        
        if (data) {
          const parsed = JSON.parse(data)
          courses = parsed.courses || {}
          startDate = parsed.startDate || ''
        }
        
        // 计算当前周
        if (startDate) {
          const start = new Date(startDate)
          const diffTime = now.getTime() - start.getTime()
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          this.currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1)
        }
        
        // 获取今日课程
        const todayCourses = []
        PERIODS.forEach((period, periodIndex) => {
          if (period.isBreak || period.isNews) return
          
          const key = `${todayIndex}_${periodIndex}`
          const course = courses[key]
          
          if (course) {
            todayCourses.push({
              ...course,
              time: period.time,
              periodName: period.name,
              isCurrent: this.isCurrentPeriod(period.time)
            })
          }
        })
        
        this.todayCourses = todayCourses
      } catch (e) {
        console.error('Load widget courses failed:', e)
      }
    },
    isCurrentPeriod(timeRange) {
      if (!timeRange) return false
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTime = currentHour * 60 + currentMinute
      
      const [start, end] = timeRange.split('-')
      const [startHour, startMinute] = start.split(':').map(Number)
      const [endHour, endMinute] = end.split(':').map(Number)
      
      const startTime = startHour * 60 + startMinute
      const endTime = endHour * 60 + endMinute
      
      return currentTime >= startTime && currentTime <= endTime
    }
  }
}
</script>

<style scoped>
.widget-page {
  width: 100%;
  height: 100%;
  background: #f0f7ff;
  display: flex;
  flex-direction: column;
  padding: 12px;
  box-sizing: border-box;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.widget-title {
  font-size: 16px;
  font-weight: 700;
  color: #16305f;
}

.widget-date {
  font-size: 12px;
  color: #5f78a5;
}

.widget-body {
  flex: 1;
  overflow: hidden;
}

.widget-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 14px;
  color: #5f78a5;
}

.widget-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.widget-item {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 8px 10px;
  gap: 10px;
}

.widget-item.current {
  background: #ffffff;
  border: 1px solid #142850;
}

.widget-time {
  font-size: 11px;
  color: #5f78a5;
  white-space: nowrap;
  min-width: 70px;
}

.widget-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.widget-course-name {
  font-size: 13px;
  font-weight: 600;
  color: #16305f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.widget-course-room {
  font-size: 11px;
  color: #5f78a5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.widget-footer {
  margin-top: 8px;
  text-align: center;
}

.widget-tip {
  font-size: 11px;
  color: #5f78a5;
}
</style>
