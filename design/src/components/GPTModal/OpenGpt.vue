<!--
 * @Author: June 1601745371@qq.com
 * @Date: 2024-05-18 14:34:26
 * @LastEditors: June 1601745371@qq.com
 * @LastEditTime: 2024-05-18 15:28:58
 * @FilePath: \yft-design\src\components\GPTModal\OpenGpt.vue
 * @Description: 开通GPT弹窗
-->
<template>
  <el-dialog
    v-model="dialogVisible"
    :width="500"
    title="提示"
    class="upload-dialog"
    :before-close="handleClose"
    :close-on-click-modal="false"
  >
    <div>
      <div class="mb-[20px] text-center">本 Demo 采用纯前端 AI 服务 Key 直连模式，确保您的数据与隐私安全。</div>
      <div class="mb-[20px] text-center text-[#667eea] font-medium">
        请点击右上角【AI 接口配置】齿轮按钮配置您的接口参数。
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleClose"> 我知道了 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { debounce } from 'lodash-es'
import { copyText } from '@/utils/clipboard'
import { ElMessage } from 'element-plus'

const emits = defineEmits(['close'])
const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
})
const dialogVisible = ref(false)

const handleClose = debounce(function () {
  dialogVisible.value = false
  emits('close')
}, 250)

watch(
  () => props.visible,
  val => {
    dialogVisible.value = val
  }
)
</script>
