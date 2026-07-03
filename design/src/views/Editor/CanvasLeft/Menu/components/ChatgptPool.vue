<template>
  <div class="ai-assistant-container">
    <div class="ai-title-header">
      <span class="ai-gradient-text">智绘快设 AI 助理</span>
      <p class="ai-subtitle">基于真实 API 直连与 Prompt 指令协调技术</p>
    </div>

    <el-tabs v-model="activeTab" class="ai-tabs" stretch>
      <!-- TAB 1: 智能改图 -->
      <el-tab-pane label="AI 对话改图" name="edit">
        <div class="tab-pane-content">
          <div class="chat-history" ref="chatHistoryRef">
            <div v-for="(msg, index) in chatMessages" :key="index" :class="['chat-bubble', msg.role]">
              <div class="bubble-content">
                <p>{{ msg.content }}</p>
                <div v-if="msg.commands && msg.commands.length > 0" class="command-box">
                  <div class="command-header">解析到 {{ msg.commands.length }} 个画布操作：</div>
                  <div class="command-tag-list">
                    <el-tag
                      v-for="(cmd, cIdx) in msg.commands"
                      :key="cIdx"
                      size="small"
                      :type="cmd.action === 'add' ? 'success' : cmd.action === 'delete' ? 'danger' : 'warning'"
                      class="cmd-tag"
                    >
                      {{ cmd.action === 'add' ? '新增' : cmd.action === 'delete' ? '删除' : '修改' }}: {{ cmd.id }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="loading" class="chat-bubble assistant loading">
              <div class="loading-dots"><span></span><span></span><span></span></div>
            </div>
          </div>

          <div class="chat-input-area">
            <el-input
              v-model="userInstruction"
              type="textarea"
              :rows="3"
              placeholder="请输入改图指令，例如：
1. 把标题改成「暑期清仓大促」
2. 添加一句话「全场满100减20」放到底部
3. 把画布背景颜色改成渐变粉色"
              @keydown.enter.prevent="sendInstruction"
            />
            <div class="chat-action-row">
              <span class="tip-text">回车发送指令</span>
              <el-button type="primary" :loading="loading" @click="sendInstruction" class="ai-action-btn">
                发送指令
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- TAB 2: AI 背景生成 -->
      <el-tab-pane label="AI 图像生成" name="image">
        <div class="tab-pane-content">
          <p class="section-desc">输入您的背景或配图画面描述，直接生成并插入画布。</p>
          <div class="image-prompt-area">
            <el-input
              v-model="imagePrompt"
              type="textarea"
              :rows="4"
              placeholder="请描述您想生成的图像，例如：
A beautiful abstract fluid acrylic painting, vaporwave aesthetic, pink and purple pastel colors, high resolution, web design background"
            />
            <div class="image-generate-options">
              <el-checkbox v-model="setAutoBackground">直接设为画布背景</el-checkbox>
            </div>
            <el-button type="primary" :loading="imageLoading" @click="generateImage" class="ai-action-btn w-full mt-4">
              一键生成图像
            </el-button>
          </div>

          <div v-if="generatedImage" class="preview-box">
            <div class="preview-title">最近生成结果：</div>
            <div class="preview-image-wrapper">
              <img :src="generatedImage" alt="Generated preview" class="preview-img" />
              <el-button size="small" type="success" class="insert-btn" @click="insertGeneratedImage">
                插入到图层
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { localStorage } from '@/utils/storage'
import useCanvas from '@/views/Canvas/useCanvas'
import { Textbox, Rect, Point } from 'fabric'
import { useTemplatesStore, useMainStore } from '@/store'
import { WorkSpaceDrawType } from '@/configs/canvas'
import useHandleCreate from '@/hooks/useHandleCreate'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

const templatesStore = useTemplatesStore()
const mainStore = useMainStore()
const activeTab = ref('edit')
const loading = ref(false)
const imageLoading = ref(false)
const userInstruction = ref('')
const imagePrompt = ref('')
const setAutoBackground = ref(true)
const generatedImage = ref('')
const chatHistoryRef = ref<HTMLElement | null>(null)

const chatMessages = ref<Array<{ role: 'user' | 'assistant'; content: string; commands?: any[] }>>([
  { role: 'assistant', content: '您好！我是您的 AI 排版设计助理。请输入指令，我会读取画布图层并为您自动修改。' },
])

const scrollToBottom = () => {
  nextTick(() => {
    if (chatHistoryRef.value) {
      chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight
    }
  })
}

// 1. 发送改图指令逻辑
const sendInstruction = async () => {
  const instruction = userInstruction.value.trim()
  if (!instruction) return

  const settings = localStorage.get('yft_ai_settings')
  const llmConfig = settings?.llm

  if (!llmConfig || !llmConfig.apiKey) {
    ElMessage({
      type: 'warning',
      message: '请先点击顶栏右上角 AI 接口配置，填写您的 LLM API Key。',
    })
    return
  }

  // 放入用户消息
  chatMessages.value.push({ role: 'user', content: instruction })
  userInstruction.value = ''
  loading.value = true
  scrollToBottom()

  const [canvas] = useCanvas()
  if (!canvas) {
    ElMessage.error('画布尚未初始化')
    loading.value = false
    return
  }

  // 获取当前画布图层数据，并进行精简，避免上下文超出
  const rawLayers = canvas.getObjects().map(o => {
    const raw = o.toObject([
      'id',
      'type',
      'left',
      'top',
      'width',
      'height',
      'fill',
      'text',
      'fontSize',
      'fontFamily',
      'fontWeight',
    ])
    return {
      id: o.id || raw.id,
      type: o.type || raw.type,
      left: Math.round(o.left),
      top: Math.round(o.top),
      width: Math.round(o.width),
      height: Math.round(o.height),
      fill: o.fill || raw.fill,
      text: (o as any).text || raw.text,
      fontSize: (o as any).fontSize || raw.fontSize,
      fontFamily: (o as any).fontFamily || raw.fontFamily,
      fontWeight: (o as any).fontWeight || raw.fontWeight,
    }
  })

  const workspace = canvas.getObjects().find(o => o.id === WorkSpaceDrawType)
  const wWidth = workspace ? workspace.width : 1200
  const wHeight = workspace ? workspace.height : 800

  const SYSTEM_PROMPT = `你是一个优秀的平面设计排版专家和 Fabric.js 画布数据翻译器。
当前画布宽为 ${wWidth}，高为 ${wHeight}。

你的任务是：根据用户的自然语言修改意图，找出画布中哪些图层需要被修改、新增或删除，输出一个操作指令的 JSON 数组。

输入包含：
1. current_layers: 当前画布图层的 JSON 列表。
2. instruction: 用户的自然语言修改诉求。

输出格式规范：
你必须【只返回一个 JSON 数组】，不能包含任何 Markdown 格式（严禁以 \`\`\`json 开头）和额外的自然语言解释。

输出 JSON 数组中每个对象的字段规则：
- id: 要修改的现有图层的 id。如果是新增图层，请将 id 设为 "new_layer_N"（N为自增序号）。
- action: 动作类型，可选："update"（修改属性）、"add"（新增图层）、"delete"（删除图层）。
- type: 图层类型（新增时必填，可选 "Textbox"）。
- 属性字段：根据修改意图提供，如 text, fill, fontSize, fontStyle, fontWeight, left, top, width 等。
- 新增图层时：必须合理计算并生成 left、top（不能超出画布宽高 ${wWidth}x${wHeight} 范围）、fontSize(建议24-60)等必须的排版参数。
- 如果是背景颜色修改：请找到 ID 为 "${WorkSpaceDrawType}" 的图层（它是画布背景层，类型为 Rect），修改其 fill 属性。

示例输出：
[
  { "id": "textbox-1", "action": "update", "text": "暑期清仓大促", "fill": "#ff0000" },
  { "id": "new_layer_1", "action": "add", "type": "Textbox", "text": "全场满100减20", "left": 100, "top": 450, "fontSize": 32, "fill": "#00ff00" }
]`

  try {
    const url = `${llmConfig.baseUrl}/chat/completions`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${llmConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: llmConfig.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `current_layers: ${JSON.stringify(rawLayers)}\ninstruction: ${instruction}` },
        ],
        temperature: 0.2,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`LLM 服务请求失败: ${response.status} ${errText}`)
    }

    const resJson = await response.json()
    let reply = resJson.choices[0].message.content.trim()

    // 正则过滤掉可能携带的 markdown 标记
    if (reply.startsWith('```')) {
      reply = reply
        .replace(/^```json\s*/, '')
        .replace(/```$/, '')
        .trim()
    }

    const commands = JSON.parse(reply)
    if (!Array.isArray(commands)) {
      throw new Error('返回的数据格式不为 JSON 数组')
    }

    // 执行画布更新动作
    await executeCommands(canvas, commands)

    chatMessages.value.push({
      role: 'assistant',
      content: `我已经为您更新了画布。`,
      commands: commands,
    })
  } catch (error: any) {
    chatMessages.value.push({
      role: 'assistant',
      content: `AI 协调修改失败：${error.message || error}`,
    })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

// 执行来自大模型翻译的图层操作
const executeCommands = async (canvas: any, commands: any[]) => {
  const { addHistorySnapshot } = useHistorySnapshot()
  const { createTextElement } = useHandleCreate()

  for (const cmd of commands) {
    if (cmd.action === 'update') {
      const obj = canvas.getObjects().find((o: any) => o.id === cmd.id)
      if (obj) {
        // 设置属性
        obj.set(cmd)
        // 特殊处理 Textbox 文本
        if (cmd.text && typeof obj.setSelectionStart === 'function') {
          obj.set({ text: cmd.text })
        }
        templatesStore.updateElement({
          id: cmd.id,
          props: cmd,
        })
      }
    } else if (cmd.action === 'add') {
      if (cmd.type === 'Textbox') {
        const textObj = new Textbox(cmd.text || '输入文字', {
          id: cmd.id || `ai_text_${Date.now()}`,
          left: cmd.left || 100,
          top: cmd.top || 100,
          fontSize: cmd.fontSize || 32,
          fill: cmd.fill || '#000000',
          width: cmd.width || 300,
          ...cmd,
        })
        canvas.add(textObj)
        templatesStore.addElement(textObj)
      }
    } else if (cmd.action === 'delete') {
      const obj = canvas.getObjects().find((o: any) => o.id === cmd.id)
      if (obj) {
        canvas.remove(obj)
        templatesStore.deleteElement(obj)
      }
    }
  }
  canvas.renderAll()
}

// 2. AI 背景/贴纸图像生成
const generateImage = async () => {
  const prompt = imagePrompt.value.trim()
  if (!prompt) {
    ElMessage.warning('请输入生图 prompt 描述')
    return
  }

  const settings = localStorage.get('yft_ai_settings')
  const imgConfig = settings?.imageGen

  if (!imgConfig || !imgConfig.apiKey) {
    ElMessage({
      type: 'warning',
      message: '请先点击顶栏右上角 AI 接口配置，填写您的 Stability AI API Key。',
    })
    return
  }

  imageLoading.value = true
  try {
    const url = `${imgConfig.baseUrl}/v1/generation/${imgConfig.model}/text-to-image`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${imgConfig.apiKey}`,
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt, weight: 1.0 }],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 30,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`生图失败: ${response.status} ${errText}`)
    }

    const resJson = await response.json()
    const base64Str = resJson.artifacts[0].base64
    generatedImage.value = `data:image/png;base64,${base64Str}`

    if (setAutoBackground.value) {
      await insertImageAsBackground(generatedImage.value)
      ElMessage.success('生图成功，并已设为画布背景！')
    } else {
      ElMessage.success('生图成功！您可以点击下方按钮将其插入图层。')
    }
  } catch (error: any) {
    ElMessage({
      type: 'error',
      message: `图像生成失败: ${error.message || error}`,
    })
  } finally {
    imageLoading.value = false
  }
}

// 插入所生成的图像至普通图层
const insertGeneratedImage = async () => {
  if (!generatedImage.value) return
  const [canvas] = useCanvas()
  if (!canvas) return

  const { createImageElement } = useHandleCreate()
  const img = new Image()
  img.src = generatedImage.value
  img.onload = () => {
    createImageElement(img)
    ElMessage.success('已成功将生成的图片插入图层！')
  }
}

// 设为画布背景
const insertImageAsBackground = async (dataUrl: string) => {
  const [canvas] = useCanvas()
  if (!canvas) return

  const workspace = canvas.getObjects().find(o => o.id === WorkSpaceDrawType)
  if (workspace) {
    // 设为 Rect 填充
    workspace.set({
      fill: {
        type: 'pattern',
        source: dataUrl,
        repeat: 'no-repeat',
      } as any,
    })
    templatesStore.updateElement({
      id: WorkSpaceDrawType,
      props: {
        fill: workspace.fill,
      },
    })
    canvas.renderAll()
  }
}
</script>

<style lang="scss" scoped>
.ai-assistant-container {
  padding: 16px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
}
.ai-title-header {
  margin-bottom: 12px;
  text-align: center;
  .ai-gradient-text {
    font-size: 16px;
    font-weight: bold;
    background: linear-gradient(90deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .ai-subtitle {
    font-size: 11px;
    color: #909399;
    margin-top: 4px;
  }
}
.ai-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  :deep(.el-tabs__content) {
    flex: 1;
    overflow-y: auto;
  }
}
.tab-pane-content {
  padding: 10px 2px;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.chat-history {
  flex: 1;
  border: 1px solid #ebeef5;
  background-color: #fff;
  border-radius: 6px;
  padding: 12px;
  overflow-y: auto;
  max-height: calc(100vh - 320px);
  margin-bottom: 12px;
}
.chat-bubble {
  margin-bottom: 12px;
  display: flex;
  .bubble-content {
    max-width: 85%;
    padding: 8px 12px;
    border-radius: 12px;
    font-size: 12px;
    line-height: 1.4;
  }
  &.user {
    justify-content: flex-end;
    .bubble-content {
      background-color: #e0dbff;
      color: #3f1fb8;
      border-bottom-right-radius: 2px;
    }
  }
  &.assistant {
    justify-content: flex-start;
    .bubble-content {
      background-color: #f4f4f5;
      color: #303133;
      border-bottom-left-radius: 2px;
    }
  }
}
.command-box {
  margin-top: 8px;
  border-top: 1px dashed #dcdfe6;
  padding-top: 6px;
  font-size: 11px;
}
.command-header {
  color: #606266;
  font-weight: 500;
  margin-bottom: 4px;
}
.command-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.cmd-tag {
  font-size: 10px;
}
.chat-input-area {
  margin-top: auto;
}
.chat-action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  .tip-text {
    font-size: 11px;
    color: #909399;
  }
}
.ai-action-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-weight: 500;
  &:hover {
    opacity: 0.9;
  }
}
.section-desc {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
  margin-bottom: 12px;
}
.image-prompt-area {
  border: 1px solid #ebeef5;
  background-color: #fff;
  border-radius: 6px;
  padding: 12px;
}
.image-generate-options {
  margin-top: 8px;
}
.preview-box {
  margin-top: 16px;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 10px;
  .preview-title {
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 8px;
  }
}
.preview-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
  .preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .insert-btn {
    position: absolute;
    bottom: 8px;
    right: 8px;
  }
}

// 加载动画
.loading-dots {
  display: flex;
  align-items: center;
  height: 12px;
  span {
    width: 6px;
    height: 6px;
    margin: 0 2px;
    background-color: #909399;
    border-radius: 50%;
    display: inline-block;
    animation: bounce 1.4s infinite ease-in-out both;
    &:nth-child(1) {
      animation-delay: -0.32s;
    }
    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
}
@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>
