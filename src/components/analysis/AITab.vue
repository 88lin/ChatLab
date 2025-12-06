<script setup lang="ts">
import { ref } from 'vue'
import { SubTabs } from '@/components/UI'
import ChatExplorer from './ai/ChatExplorer.vue'

// Props
defineProps<{
  sessionId: string
  sessionName: string
  timeFilter?: { startTs: number; endTs: number }
  chatType?: 'group' | 'private'
}>()

// 子 Tab 配置
const subTabs = [
  { id: 'chat-explorer', label: '对话式探索', icon: 'i-heroicons-chat-bubble-left-ellipsis' },
  { id: 'manual', label: '筛选分析', icon: 'i-heroicons-adjustments-horizontal' },
  { id: 'sql', label: 'AI SQL', icon: 'i-heroicons-beaker' },
  { id: 'mbti', label: 'MBTI检测仪', icon: 'i-heroicons-heart' },
]

const activeSubTab = ref('chat-explorer')

// ChatExplorer 组件引用
const chatExplorerRef = ref<InstanceType<typeof ChatExplorer> | null>(null)

// 刷新 AI 配置（供父组件调用）
function refreshAIConfig() {
  chatExplorerRef.value?.refreshConfig()
}

// 暴露方法供父组件调用
defineExpose({
  refreshAIConfig,
})
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- 子 Tab 导航 -->
    <SubTabs class="hidden" v-model="activeSubTab" :items="subTabs" />

    <!-- 子 Tab 内容 -->
    <div class="flex-1 min-h-0 overflow-hidden">
      <Transition name="fade" mode="out-in">
        <!-- 对话式探索 -->
        <ChatExplorer
          v-if="activeSubTab === 'chat-explorer'"
          ref="chatExplorerRef"
          class="h-full"
          :session-id="sessionId"
          :session-name="sessionName"
          :time-filter="timeFilter"
          :chat-type="chatType"
        />

        <!-- 实验室 - 暂未实现 -->
        <div v-else-if="activeSubTab === 'lab'" class="flex h-full items-center justify-center p-6">
          <div
            class="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50"
          >
            <div class="text-center">
              <UIcon name="i-heroicons-beaker" class="mx-auto h-12 w-12 text-gray-400" />
              <p class="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">实验室功能开发中</p>
              <p class="mt-1 text-xs text-gray-400">敬请期待...</p>
            </div>
          </div>
        </div>

        <!-- 筛选分析 - 暂未实现 -->
        <div v-else-if="activeSubTab === 'manual'" class="flex h-full items-center justify-center p-6">
          <div
            class="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50"
          >
            <div class="text-center">
              <UIcon name="i-heroicons-adjustments-horizontal" class="mx-auto h-12 w-12 text-gray-400" />
              <p class="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">筛选分析功能开发中</p>
              <p class="mt-1 text-xs text-gray-400">敬请期待...</p>
            </div>
          </div>
        </div>
        <!-- AI SQL -->
        <div v-else-if="activeSubTab === 'sql'" class="flex h-full items-center justify-center p-6">
          <div
            class="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50"
          >
            <div class="text-center">
              <UIcon name="i-heroicons-beaker" class="mx-auto h-12 w-12 text-gray-400" />
              <p class="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">开发中</p>
              <p class="mt-1 text-xs text-gray-400">敬请期待...</p>
            </div>
          </div>
        </div>
        <!-- MBTI检测仪 -->
        <div v-else-if="activeSubTab === 'mbti'" class="flex h-full items-center justify-center p-6">
          <div
            class="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50"
          >
            <div class="text-center">
              <UIcon name="i-heroicons-beaker" class="mx-auto h-12 w-12 text-gray-400" />
              <p class="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">开发中</p>
              <p class="mt-1 text-xs text-gray-400">敬请期待...</p>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
