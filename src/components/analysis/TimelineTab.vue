<script setup lang="ts">
import { computed } from 'vue'
import type { HourlyActivity, DailyActivity } from '@/types/chat'
import dayjs from 'dayjs'
import { LineChart, BarChart } from '@/components/charts'
import type { LineChartData, BarChartData } from '@/components/charts'

const props = defineProps<{
  dailyActivity: DailyActivity[]
  hourlyActivity: HourlyActivity[]
  timeRange: { start: number; end: number } | null
}>()

// 检测是否跨年
const isMultiYear = computed(() => {
  if (props.dailyActivity.length < 2) return false
  const years = new Set(props.dailyActivity.map((d) => dayjs(d.date).year()))
  return years.size > 1
})

// 每日趋势图数据
const dailyChartData = computed<LineChartData>(() => {
  // 如果跨年，显示年份；否则只显示月/日
  const dateFormat = isMultiYear.value ? 'YYYY/MM/DD' : 'MM/DD'

  return {
    labels: props.dailyActivity.map((d) => dayjs(d.date).format(dateFormat)),
    values: props.dailyActivity.map((d) => d.messageCount),
  }
})

// 24小时分布图数据
const hourlyChartData = computed<BarChartData>(() => {
  return {
    labels: props.hourlyActivity.map((h) => `${h.hour}:00`),
    values: props.hourlyActivity.map((h) => h.messageCount),
  }
})

// 分析指标
const peakHour = computed(() => {
  if (!props.hourlyActivity.length) return null
  return props.hourlyActivity.reduce((max, h) => (h.messageCount > max.messageCount ? h : max), props.hourlyActivity[0])
})

const lateNightRatio = computed(() => {
  // 深夜定义为 0-6 点
  const lateNight = props.hourlyActivity
    .filter((h) => h.hour >= 0 && h.hour < 6)
    .reduce((sum, h) => sum + h.messageCount, 0)
  const total = props.hourlyActivity.reduce((sum, h) => sum + h.messageCount, 0)
  return total > 0 ? Math.round((lateNight / total) * 100) : 0
})

const morningRatio = computed(() => {
  // 早间定义为 6-12 点
  const morning = props.hourlyActivity
    .filter((h) => h.hour >= 6 && h.hour < 12)
    .reduce((sum, h) => sum + h.messageCount, 0)
  const total = props.hourlyActivity.reduce((sum, h) => sum + h.messageCount, 0)
  return total > 0 ? Math.round((morning / total) * 100) : 0
})

const afternoonRatio = computed(() => {
  // 下午定义为 12-18 点
  const afternoon = props.hourlyActivity
    .filter((h) => h.hour >= 12 && h.hour < 18)
    .reduce((sum, h) => sum + h.messageCount, 0)
  const total = props.hourlyActivity.reduce((sum, h) => sum + h.messageCount, 0)
  return total > 0 ? Math.round((afternoon / total) * 100) : 0
})

const eveningRatio = computed(() => {
  // 晚间定义为 18-24 点
  const evening = props.hourlyActivity
    .filter((h) => h.hour >= 18 && h.hour < 24)
    .reduce((sum, h) => sum + h.messageCount, 0)
  const total = props.hourlyActivity.reduce((sum, h) => sum + h.messageCount, 0)
  return total > 0 ? Math.round((evening / total) * 100) : 0
})

// 最活跃的一天
const peakDay = computed(() => {
  if (!props.dailyActivity.length) return null
  return props.dailyActivity.reduce((max, d) => (d.messageCount > max.messageCount ? d : max), props.dailyActivity[0])
})

// 平均每日消息数
const avgDailyMessages = computed(() => {
  if (!props.dailyActivity.length) return 0
  const total = props.dailyActivity.reduce((sum, d) => sum + d.messageCount, 0)
  return Math.round(total / props.dailyActivity.length)
})
</script>

<template>
  <div class="space-y-6">
    <!-- 标题 -->
    <div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">时间维度分析</h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">探索群聊的活跃规律</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400">最活跃时段</p>
        <p class="mt-1 text-2xl font-bold text-pink-600 dark:text-pink-400">{{ peakHour?.hour || 0 }}:00</p>
        <p class="mt-1 text-xs text-gray-400">{{ peakHour?.messageCount || 0 }} 条消息</p>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400">最活跃日期</p>
        <p class="mt-1 text-2xl font-bold text-pink-600 dark:text-pink-400">
          {{ peakDay ? dayjs(peakDay.date).format('MM/DD') : '-' }}
        </p>
        <p class="mt-1 text-xs text-gray-400">{{ peakDay?.messageCount || 0 }} 条消息</p>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400">日均消息</p>
        <p class="mt-1 text-2xl font-bold text-pink-600 dark:text-pink-400">
          {{ avgDailyMessages }}
        </p>
        <p class="mt-1 text-xs text-gray-400">条/天</p>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400">夜猫子指数</p>
        <p class="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{{ lateNightRatio }}%</p>
        <p class="mt-1 text-xs text-gray-400">深夜活跃占比</p>
      </div>
    </div>

    <!-- 每日趋势 -->
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h3 class="mb-4 font-semibold text-gray-900 dark:text-white">每日消息趋势</h3>
      <LineChart :data="dailyChartData" :height="288" />
    </div>

    <!-- 24小时分布 -->
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h3 class="mb-4 font-semibold text-gray-900 dark:text-white">24小时活跃分布</h3>
      <BarChart
        :data="hourlyChartData"
        :height="256"
        :x-label-filter="(_, index) => (index % 3 === 0 ? `${index}:00` : '')"
      />

      <!-- 时段分析 -->
      <div class="mt-6 grid grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-xs text-gray-500 dark:text-gray-400">凌晨 0-6点</div>
          <div class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ lateNightRatio }}%</div>
          <div class="mx-auto mt-2 h-1 w-full max-w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div class="h-full rounded-full bg-pink-300 transition-all" :style="{ width: `${lateNightRatio}%` }" />
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs text-gray-500 dark:text-gray-400">上午 6-12点</div>
          <div class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ morningRatio }}%</div>
          <div class="mx-auto mt-2 h-1 w-full max-w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div class="h-full rounded-full bg-pink-400 transition-all" :style="{ width: `${morningRatio}%` }" />
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs text-gray-500 dark:text-gray-400">下午 12-18点</div>
          <div class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ afternoonRatio }}%</div>
          <div class="mx-auto mt-2 h-1 w-full max-w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div class="h-full rounded-full bg-pink-500 transition-all" :style="{ width: `${afternoonRatio}%` }" />
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs text-gray-500 dark:text-gray-400">晚上 18-24点</div>
          <div class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ eveningRatio }}%</div>
          <div class="mx-auto mt-2 h-1 w-full max-w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div class="h-full rounded-full bg-pink-600 transition-all" :style="{ width: `${eveningRatio}%` }" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
