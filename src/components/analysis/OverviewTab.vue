<script setup lang="ts">
import { computed } from 'vue'
import type { AnalysisSession, MemberActivity, HourlyActivity, MessageType } from '@/types/chat'
import dayjs from 'dayjs'
import { DoughnutChart, ProgressBar } from '@/components/charts'
import type { DoughnutChartData } from '@/components/charts'

const props = defineProps<{
  session: AnalysisSession
  memberActivity: MemberActivity[]
  topMembers: MemberActivity[]
  bottomMembers: MemberActivity[]
  messageTypes: Array<{ type: MessageType; count: number }>
  hourlyActivity: HourlyActivity[]
  timeRange: { start: number; end: number } | null
  selectedYear: number | null
  filteredMessageCount: number
  filteredMemberCount: number
}>()

// 时间跨度
const durationDays = computed(() => {
  if (props.selectedYear) {
    // 选择了特定年份，计算该年的天数
    const isLeapYear =
      (props.selectedYear % 4 === 0 && props.selectedYear % 100 !== 0) || props.selectedYear % 400 === 0
    return isLeapYear ? 366 : 365
  }
  if (!props.timeRange) return 0
  return Math.ceil((props.timeRange.end - props.timeRange.start) / 86400)
})

const dateRangeText = computed(() => {
  if (props.selectedYear) {
    return `${props.selectedYear}年全年`
  }
  if (!props.timeRange) return ''
  const start = dayjs.unix(props.timeRange.start).format('YYYY.MM.DD')
  const end = dayjs.unix(props.timeRange.end).format('YYYY.MM.DD')
  return `${start} - ${end}`
})

// 显示的消息数和成员数
const displayMessageCount = computed(() => {
  return props.selectedYear ? props.filteredMessageCount : props.session.messageCount
})

const displayMemberCount = computed(() => {
  return props.selectedYear ? props.filteredMemberCount : props.session.memberCount
})

// 消息类型名称映射
const typeNames: Record<number, string> = {
  0: '文字',
  1: '图片',
  2: '语音',
  3: '视频',
  4: '文件',
  5: '表情',
  6: '系统',
  99: '其他',
}

// 消息类型图表数据
const typeChartData = computed<DoughnutChartData>(() => {
  return {
    labels: props.messageTypes.map((t) => typeNames[t.type] || '未知'),
    values: props.messageTypes.map((t) => t.count),
  }
})

// 最活跃时段
const peakHour = computed(() => {
  if (!props.hourlyActivity.length) return null
  const peak = props.hourlyActivity.reduce(
    (max, h) => (h.messageCount > max.messageCount ? h : max),
    props.hourlyActivity[0]
  )
  return peak
})

// 图片消息数量
const imageCount = computed(() => {
  const imageType = props.messageTypes.find((t) => t.type === 1)
  return imageType?.count || 0
})

// 获取排名徽章
function getRankBadge(index: number): string {
  const badges = ['🥇', '🥈', '🥉']
  return badges[index] || `${index + 1}`
}
</script>

<template>
  <div class="space-y-6">
    <!-- 群聊身份卡 -->
    <div class="rounded-2xl bg-linear-to-br from-pink-400 via-pink-500 to-pink-600 p-6 text-white shadow-lg">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-2xl font-bold">{{ session.name }}</h2>
          <p class="mt-1 text-white/80">
            平台: {{ session.platform.toUpperCase() }} · {{ session.type === 'group' ? '群聊' : '私聊' }}
          </p>
        </div>
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
          <UIcon name="i-heroicons-chat-bubble-left-right" class="h-6 w-6" />
        </div>
      </div>

      <div class="mt-6 grid grid-cols-3 gap-4">
        <div class="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
          <p class="text-2xl font-bold">{{ displayMessageCount }}</p>
          <p class="text-sm text-white/70">{{ selectedYear ? '筛选消息' : '消息总数' }}</p>
        </div>
        <div class="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
          <p class="text-2xl font-bold">{{ displayMemberCount }}</p>
          <p class="text-sm text-white/70">{{ selectedYear ? '活跃成员' : '群成员' }}</p>
        </div>
        <div class="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
          <p class="text-2xl font-bold">{{ durationDays }}</p>
          <p class="text-sm text-white/70">天</p>
        </div>
      </div>

      <p class="mt-4 text-sm text-white/60">
        {{ dateRangeText }}
      </p>
    </div>

    <!-- 关键指标卡片 -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <!-- 龙王 -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-2xl dark:bg-amber-900/30">
            🏆
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">龙王</p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ topMembers[0]?.name || '-' }}
            </p>
          </div>
        </div>
        <div class="mt-3 flex items-baseline gap-1">
          <span class="text-2xl font-bold text-amber-500">{{ topMembers[0]?.messageCount || 0 }}</span>
          <span class="text-sm text-gray-500">条</span>
          <span class="ml-2 text-sm text-gray-400">({{ topMembers[0]?.percentage || 0 }}%)</span>
        </div>
      </div>

      <!-- 潜水王 -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl dark:bg-blue-900/30">
            🤫
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">潜水王</p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ bottomMembers[0]?.name || '-' }}
            </p>
          </div>
        </div>
        <div class="mt-3 flex items-baseline gap-1">
          <span class="text-2xl font-bold text-blue-500">{{ bottomMembers[0]?.messageCount || 0 }}</span>
          <span class="text-sm text-gray-500">条</span>
          <span class="ml-2 text-sm text-gray-400">({{ bottomMembers[0]?.percentage || 0 }}%)</span>
        </div>
      </div>

      <!-- 图片/表情 -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100 text-2xl dark:bg-pink-900/30">
            📸
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">图片消息</p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">{{ imageCount }} 张</p>
          </div>
        </div>
        <div class="mt-3 flex items-baseline gap-1">
          <span class="text-sm text-gray-500">最活跃时段:</span>
          <span class="font-semibold text-pink-500">{{ peakHour?.hour || 0 }}:00</span>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- 消息类型分布 -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 class="mb-4 font-semibold text-gray-900 dark:text-white">消息类型分布</h3>
        <DoughnutChart :data="typeChartData" :height="256" />
      </div>

      <!-- Top 成员预览 -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 class="mb-4 font-semibold text-gray-900 dark:text-white">活跃榜 Top 5</h3>
        <div class="space-y-3">
          <div
            v-for="(member, index) in memberActivity.slice(0, 5)"
            :key="member.memberId"
            class="flex items-center gap-3"
          >
            <span class="w-6 text-center text-lg">{{ getRankBadge(index) }}</span>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <span class="font-medium text-gray-900 dark:text-white">{{ member.name }}</span>
                <span class="text-sm text-gray-500">{{ member.messageCount }}</span>
              </div>
              <ProgressBar :percentage="member.percentage" color="from-pink-400 to-pink-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
