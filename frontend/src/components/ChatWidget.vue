<template>
  <div class="ai-root">
    <!-- 悬浮按钮 -->
    <button v-if="!open" class="ai-fab" @click="open = true" title="AI 助手" aria-label="打开 AI 助手">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4z"/>
        <path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/>
      </svg>
    </button>

    <!-- 对话面板 -->
    <transition name="ai-pop">
      <section v-if="open" ref="panelEl" class="ai-panel glass-card" :style="panelStyle">
        <header class="ai-header" @mousedown="onDragStart">
          <span class="ai-dot led-pulse"></span>
          <span class="ai-title">AI 招聘分析助手</span>
          <span class="ai-hint">ESC 关闭</span>
        </header>

        <div ref="bodyEl" class="ai-body">
          <div v-if="messages.length === 0" class="ai-empty">
            你好，我是基于平台真实招聘数据的 AI 助手。<br/>
            试试问我：「北京平均薪资多少？」「哪些行业需求最大？」「推荐几个热门技能」
          </div>
          <div v-for="(m, i) in messages" :key="i"
               class="msg" :class="m.role === 'user' ? 'msg-user' : 'msg-ai'">
            {{ m.content }}
          </div>
          <div v-if="loading" class="msg msg-ai">思考中…</div>
        </div>

        <footer class="ai-input">
          <textarea v-model="input" rows="1" ref="taEl"
                    placeholder="输入你的问题…（Enter 发送，Shift+Enter 换行，ESC 关闭窗口）"
                    @keydown.enter.exact.prevent="send"></textarea>
          <button class="ai-send" :disabled="loading || !input.trim()" @click="send">发送</button>
        </footer>
      </section>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

const open = ref(false)
const input = ref('')
const loading = ref(false)
const messages = ref([])
const bodyEl = ref(null)
const panelEl = ref(null)

function close() {
  open.value = false
  // 复位面板位置，下次打开回到右下角初始位
  panelStyle.right = '24px'; panelStyle.bottom = '24px'
  panelStyle.left = 'auto'; panelStyle.top = 'auto'
}

const panelStyle = reactive({ right: '24px', bottom: '24px', left: 'auto', top: 'auto' })

function scrollToBottom() {
  nextTick(() => {
    if (bodyEl.value) bodyEl.value.scrollTop = bodyEl.value.scrollHeight
  })
}

async function send() {
  const text = input.value.trim()
  if (!text || loading.value) return
  messages.value.push({ role: 'user', content: text })
  input.value = ''
  loading.value = true
  scrollToBottom()

  const history = messages.value.slice(0, -1)
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }))

  try {
    const { data } = await axios.post('/api/ai/chat', { message: text, history }, { timeout: 90000 })
    const reply = (data && data.data && data.data.reply) || '（暂无回复）'
    messages.value.push({ role: 'assistant', content: reply })
  } catch (e) {
    messages.value.push({ role: 'assistant', content: '调用失败：' + (e.message || e) })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

/* ---- 拖拽移动 ---- */
let dragging = false, sx = 0, sy = 0, ol = 0, ot = 0
function onDragStart(e) {
  dragging = true
  sx = e.clientX; sy = e.clientY
  const r = panelEl.value.getBoundingClientRect()
  ol = r.left; ot = r.top
  panelStyle.left = ol + 'px'; panelStyle.top = ot + 'px'
  panelStyle.right = 'auto'; panelStyle.bottom = 'auto'
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', onDragEnd)
}
function onDrag(e) {
  if (!dragging) return
  const w = panelEl.value.offsetWidth, h = panelEl.value.offsetHeight
  let nl = ol + e.clientX - sx
  let nt = ot + e.clientY - sy
  nl = Math.max(8, Math.min(nl, window.innerWidth - w - 8))
  nt = Math.max(8, Math.min(nt, window.innerHeight - h - 8))
  panelStyle.left = nl + 'px'; panelStyle.top = nt + 'px'
}
function onDragEnd() {
  dragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', onDragEnd)
}
/* ---- ESC 键关闭窗口（唯一关闭方式，复用 close 复位面板位置） ---- */
function onKey(e) {
  if (e.key === 'Escape' && open.value) close()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  onDragEnd()
  window.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.ai-root { position: fixed; z-index: 9999; }

/* 悬浮按钮 */
.ai-fab {
  position: fixed; right: 24px; bottom: 24px;
  width: 56px; height: 56px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #04121f; cursor: pointer;
  background: var(--grad-cyan);
  border: 1px solid var(--line-bright);
  box-shadow: var(--glow-strong);
  transition: transform .25s cubic-bezier(.16, 1, .3, 1), box-shadow .25s;
}
.ai-fab:hover { transform: scale(1.08) translateY(-2px); box-shadow: var(--glow-strong), 0 0 40px rgba(0, 229, 255, .4); }
.ai-fab:active { transform: scale(.98); }

/* 面板 */
.ai-panel {
  position: fixed; width: 360px; max-width: calc(100vw - 32px);
  height: 500px; max-height: calc(100vh - 48px);
  display: flex; flex-direction: column; overflow: hidden;
  border-radius: 16px; z-index: 9999;
}
.ai-header {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px; cursor: move; user-select: none;
  border-bottom: 1px solid var(--line);
  background: rgba(0, 229, 255, 0.06);
}
.ai-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--good); }
.ai-title { flex: 1; font-size: 14px; font-weight: 600; color: var(--text); text-shadow: 0 0 10px var(--cyan-glow); }
.ai-hint {
  flex: none; font-size: 11px; letter-spacing: .5px; color: var(--text-dim);
  padding: 3px 8px; border-radius: 6px; border: 1px solid var(--line);
  background: rgba(0, 229, 255, .05); user-select: none;
}

.ai-body {
  flex: 1; overflow-y: auto; padding: 12px;
  display: flex; flex-direction: column; gap: 10px;
}
.ai-empty {
  margin: auto; text-align: center; color: var(--text-dim);
  font-size: 12px; line-height: 1.7; padding: 20px;
}
.msg {
  max-width: 86%; padding: 8px 12px; border-radius: 12px;
  font-size: 13px; line-height: 1.55; white-space: pre-wrap; word-break: break-word;
}
.msg-user {
  align-self: flex-end; color: #04121f; font-weight: 500;
  background: var(--grad-cyan); border-bottom-right-radius: 4px;
}
.msg-ai {
  align-self: flex-start; color: var(--text);
  background: var(--panel-2); border: 1px solid var(--line); border-bottom-left-radius: 4px;
}

.ai-input {
  display: flex; gap: 8px; align-items: flex-end;
  padding: 10px 12px; border-top: 1px solid var(--line);
  background: rgba(13, 22, 45, 0.5);
}
.ai-input textarea {
  flex: 1; resize: none; max-height: 90px;
  background: rgba(0, 0, 0, 0.28); border: 1px solid var(--line);
  border-radius: 10px; color: var(--text); padding: 8px 10px;
  font-size: 13px; font-family: var(--font-body); line-height: 1.5; outline: none;
}
.ai-input textarea:focus { border-color: var(--line-bright); box-shadow: 0 0 0 2px rgba(0, 229, 255, .12); }
.ai-send {
  padding: 8px 14px; border: none; border-radius: 10px; cursor: pointer;
  color: #04121f; font-weight: 600; font-size: 13px;
  background: var(--grad-cyan); transition: transform .2s, opacity .2s;
}
.ai-send:hover:not(:disabled) { transform: translateY(-1px); }
.ai-send:disabled { opacity: .45; cursor: not-allowed; }

/* 展开动画 */
.ai-pop-enter-active, .ai-pop-leave-active { transition: transform .25s ease, opacity .25s ease; }
.ai-pop-enter-from, .ai-pop-leave-to { transform: translateY(16px) scale(.96); opacity: 0; }
</style>
