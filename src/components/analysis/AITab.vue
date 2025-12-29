<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { SubTabs } from '@/components/UI'
import ChatExplorer from './ai/ChatExplorer.vue'
import SQLLabTab from './SQLLabTab.vue'

// Props
const props = defineProps<{
  sessionId: string
  sessionName: string
  timeFilter?: { startTs: number; endTs: number }
  chatType?: 'group' | 'private'
}>()

const route = useRoute()

// 判断是否为群聊（通过路由名称判断）
const isGroupChat = computed(() => route.name === 'group-chat')

// 仅群聊显示的功能 ID
const groupOnlyTabs = ['mbti', 'cyber-friend', 'campus']

// 所有子 Tab 配置
const allSubTabs = [
  { id: 'chat-explorer', label: '对话式探索', icon: 'i-heroicons-chat-bubble-left-ellipsis' },
  { id: 'sql-lab', label: 'SQL实验室', icon: 'i-heroicons-command-line' },
  {
    id: 'manual',
    label: '筛选分析',
    desc: '计划实现高级筛选功能，可以先按人/按时间/按搜索内容手动筛选，然后再进行AI分析',
    icon: 'i-heroicons-adjustments-horizontal',
  },
  // {
  //   id: 'campus',
  //   label: '阵营9宫格',
  //   desc: '和朋友们聊天的时候产生的一个有趣的想法，群里偶尔会很认真的讨论某个话题，那么是不是可以让AI分析聊天记录，然后针对这个话题，让AI用 守序善良/绝对中立/守序邪恶/混乱邪恶 这样的九宫格把群友划分到对应的格子里面',
  //   icon: 'i-heroicons-squares-2x2',
  // },
]

// 根据聊天类型过滤显示的子 Tab
const subTabs = computed(() => {
  if (isGroupChat.value) {
    // 群聊显示所有 Tab
    return allSubTabs
  }
  // 私聊过滤掉群聊专属功能
  return allSubTabs.filter((tab) => !groupOnlyTabs.includes(tab.id))
})

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
    <SubTabs v-model="activeSubTab" :items="subTabs" persist-key="aiTab" />

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

        <!-- 暂未实现的功能 -->
        <div
          v-else-if="['manual', 'mbti', 'cyber-friend', 'campus'].includes(activeSubTab)"
          class="main-content flex h-full items-center justify-center p-6"
        >
          <div
            class="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50"
          >
            <div class="text-center">
              <UIcon :name="subTabs.find((t) => t.id === activeSubTab)?.icon" class="mx-auto h-12 w-12 text-gray-400" />
              <p class="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                {{ subTabs.find((t) => t.id === activeSubTab)?.label }}功能开发中
              </p>
              <p class="mt-1 max-w-md px-4 text-sm text-gray-500">
                {{ subTabs.find((t) => t.id === activeSubTab)?.desc || '敬请期待...' }}
              </p>

              <div class="mt-8 flex items-center justify-center gap-1 text-xs text-gray-400">
                <span>功能上线通知，欢迎关注我的小红书</span>
                <UButton
                  to="https://www.xiaohongshu.com/user/profile/6841741e000000001d0091b4"
                  target="_blank"
                  variant="link"
                  :padded="false"
                  class="text-xs font-medium"
                >
                  @地瓜
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- SQL 实验室 -->
        <SQLLabTab v-else-if="activeSubTab === 'sql-lab'" class="h-full" :session-id="props.sessionId" />
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
