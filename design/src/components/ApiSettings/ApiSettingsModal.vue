<template>
  <el-dialog
    v-model="dialogVisible"
    :title="'AI 服务配置中心'"
    width="620px"
    class="ai-settings-dialog"
    :before-close="handleClose"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-tabs v-model="activeTab" class="settings-tabs">
      <!-- 1. 大语言模型配置 -->
      <el-tab-pane label="大语言模型 (LLM)" name="llm">
        <div class="settings-pane-content">
          <p class="pane-description">用于解析自然语言海报修改指令与智能排版算法。</p>
          <el-form :model="settings.llm" label-width="140px" label-position="left">
            <el-form-item label="服务商">
              <el-radio-group v-model="settings.llm.provider" @change="handleLlmProviderChange">
                <el-radio-button value="deepseek">DeepSeek</el-radio-button>
                <el-radio-button value="gemini">Gemini</el-radio-button>
                <el-radio-button value="openai">OpenAI</el-radio-button>
                <el-radio-button value="custom">自定义</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="API Key" required>
              <el-input
                v-model="settings.llm.apiKey"
                type="password"
                show-password
                placeholder="请输入您的 API 密钥"
              />
            </el-form-item>
            <el-form-item label="接口地址 (Base URL)">
              <el-input v-model="settings.llm.baseUrl" placeholder="https://..." />
            </el-form-item>
            <el-form-item label="模型名称 (Model)">
              <el-input v-model="settings.llm.model" placeholder="例如: deepseek-chat" />
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 2. AI 图像生成配置 -->
      <el-tab-pane label="AI 图像生成" name="imageGen">
        <div class="settings-pane-content">
          <p class="pane-description">用于生成精美的海报背景以及素材配图。</p>
          <el-form :model="settings.imageGen" label-width="140px" label-position="left">
            <el-form-item label="服务商">
              <el-radio-group v-model="settings.imageGen.provider" @change="handleImageProviderChange">
                <el-radio-button value="stability">Stability AI</el-radio-button>
                <el-radio-button value="custom">自定义</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="API Key" required>
              <el-input
                v-model="settings.imageGen.apiKey"
                type="password"
                show-password
                placeholder="请输入您的 API 密钥"
              />
            </el-form-item>
            <el-form-item label="接口地址 (Base URL)">
              <el-input v-model="settings.imageGen.baseUrl" placeholder="https://..." />
            </el-form-item>
            <el-form-item label="模型名称 (Model)">
              <el-input v-model="settings.imageGen.model" placeholder="例如: core / ultra / sd3-medium" />
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 3. 抠图接口配置 -->
      <el-tab-pane label="一键抠图" name="matting">
        <div class="settings-pane-content">
          <p class="pane-description">用于前景图片一键去除背景，提取人像或商品。</p>
          <el-form :model="settings.matting" label-width="140px" label-position="left">
            <el-form-item label="服务商">
              <el-radio-group v-model="settings.matting.provider">
                <el-radio-button value="removebg">Remove.bg</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="API Key" required>
              <el-input
                v-model="settings.matting.apiKey"
                type="password"
                show-password
                placeholder="请输入 Remove.bg API 密钥"
              />
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" class="save-btn" @click="handleSave">
          保存配置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, watch, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { localStorage } from '@/utils/storage'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

const dialogVisible = ref(false)
const activeTab = ref('llm')

// 默认厂商配置字典
const DEFAULT_LLM_CONFIGS = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat'
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-1.5-flash'
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o'
  },
  custom: {
    baseUrl: '',
    model: ''
  }
}

const DEFAULT_IMAGE_CONFIGS = {
  stability: {
    baseUrl: 'https://api.stability.ai',
    model: 'stable-diffusion-xl-1024-v1-0'
  },
  custom: {
    baseUrl: '',
    model: ''
  }
}

// 响应式表单配置
const settings = reactive({
  llm: {
    provider: 'deepseek',
    apiKey: '',
    baseUrl: DEFAULT_LLM_CONFIGS.deepseek.baseUrl,
    model: DEFAULT_LLM_CONFIGS.deepseek.model
  },
  imageGen: {
    provider: 'stability',
    apiKey: '',
    baseUrl: DEFAULT_IMAGE_CONFIGS.stability.baseUrl,
    model: DEFAULT_IMAGE_CONFIGS.stability.model
  },
  matting: {
    provider: 'removebg',
    apiKey: ''
  }
})

// 监听 visible 属性改变
watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val) {
    // 弹窗打开时，加载 localstorage 中已存配置
    loadSettings()
  }
})

const loadSettings = () => {
  const saved = localStorage.get('yft_ai_settings')
  if (saved) {
    if (saved.llm) Object.assign(settings.llm, saved.llm)
    if (saved.imageGen) Object.assign(settings.imageGen, saved.imageGen)
    if (saved.matting) Object.assign(settings.matting, saved.matting)
  }
}

const handleLlmProviderChange = (provider: any) => {
  const defaults = DEFAULT_LLM_CONFIGS[provider as keyof typeof DEFAULT_LLM_CONFIGS]
  if (defaults) {
    settings.llm.baseUrl = defaults.baseUrl
    settings.llm.model = defaults.model
  }
}

const handleImageProviderChange = (provider: any) => {
  const defaults = DEFAULT_IMAGE_CONFIGS[provider as keyof typeof DEFAULT_IMAGE_CONFIGS]
  if (defaults) {
    settings.imageGen.baseUrl = defaults.baseUrl
    settings.imageGen.model = defaults.model
  }
}

const handleClose = () => {
  emit('update:visible', false)
}

const handleSave = () => {
  localStorage.set('yft_ai_settings', JSON.parse(JSON.stringify(settings)))
  ElMessage({
    type: 'success',
    message: 'AI 接口配置保存成功！数据已保存在本地。'
  })
  handleClose()
}
</script>

<style lang="scss" scoped>
.ai-settings-dialog {
  :deep(.el-dialog__body) {
    padding-top: 10px;
    padding-bottom: 10px;
  }
}
.settings-tabs {
  margin-top: -10px;
}
.settings-pane-content {
  padding: 15px 5px;
}
.pane-description {
  font-size: 13px;
  color: #888;
  margin-bottom: 20px;
  line-height: 1.4;
  border-left: 3px solid var(--el-color-primary);
  padding-left: 8px;
}
.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  &:hover {
    opacity: 0.9;
  }
}
</style>
