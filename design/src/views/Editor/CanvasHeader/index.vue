<template>
  <div class="header-container">
    <!-- 左侧区域：首页、文件、我的空间、设计稿名称 -->
    <div class="left-section">
      <div class="home-btn cursor-pointer" @click="goHome">
        <IconHome class="home-icon" />
      </div>
      <el-dropdown trigger="click" @command="handleFileCommand">
        <span class="tool-dropdown-link cursor-pointer">
          文件
          <IconDown class="down-icon" />
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="new">新建页面</el-dropdown-item>
            <el-dropdown-item command="delete">删除页面</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <span class="tool-item cursor-pointer" @click="mySpaceVisible = true">
        <IconFolderClose class="folder-icon" />
        我的空间
      </span>

      <span class="divider">/</span>

      <span class="design-title" :title="designTitle">
        {{ designTitle }}
      </span>
    </div>

    <!-- 中间区域：撤销、重做、组合、拆分、标尺、合并图层 -->
    <div class="center-section">
      <el-tooltip placement="top" :hide-after="0">
        <template #content>{{ t('message.undo') }}</template>
        <IconBack class="handler-item" :class="{ disable: !canUndo }" @click="undo()" />
      </el-tooltip>
      <el-tooltip placement="top" :hide-after="0">
        <template #content>{{ t('message.redo') }}</template>
        <IconNext class="handler-item" :class="{ disable: !canRedo }" @click="redo()" />
      </el-tooltip>
      <el-tooltip placement="top" :hide-after="0">
        <template #content>{{ t('message.group') }}</template>
        <IconGroup class="handler-item" :class="{ disable: !canGroup }" @click="group()" v-show="canGroup" />
      </el-tooltip>
      <el-tooltip placement="top" :hide-after="0">
        <template #content>{{ t('message.ungroup') }}</template>
        <IconUngroup class="handler-item" :class="{ disable: !canUnGroup }" @click="ungroup()" v-show="canUnGroup" />
      </el-tooltip>
      <el-tooltip placement="top" :hide-after="0">
        <template #content>{{ t('message.ruler') }}</template>
        <IconRuler class="handler-item" @click="changeRuler()" />
      </el-tooltip>

      <!-- 合并图层选项 -->
      <div class="intersection-handler" v-show="canIntersection">
        <el-dropdown trigger="click">
          <span class="handler-dropdown">
            <el-tooltip placement="top" :hide-after="0">
              <template #content>{{ t('message.union') }}</template>
              <IconUnionSelection class="handler-icon" />
            </el-tooltip>
            <IconDown class="handler-icon icon-down" />
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="intersection(0)">
                <IconUnionSelection class="handler-item" />{{ t('message.union') }}
              </el-dropdown-item>
              <el-dropdown-item @click="intersection(1)">
                <IconSubtractSelectionOne class="handler-item" />{{ t('message.difference') }}
              </el-dropdown-item>
              <el-dropdown-item @click="intersection(2)">
                <IconIntersectSelection class="handler-item" />{{ t('message.intersection') }}
              </el-dropdown-item>
              <el-dropdown-item @click="intersection(3)">
                <IconExcludeSelection class="handler-item" />{{ t('message.xor') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 右侧区域：缩放、配置、企业服务、语言、登录、下载 -->
    <div class="right-section">
      <!-- 缩放控制 -->
      <div class="zoom-control">
        <IconMinus class="handler-item-zoom" @click="scaleCanvas('-')" />
        <el-popover placement="bottom" trigger="click" width="100" popper-class="viewport-size">
          <template #reference>
            <span class="text cursor-pointer" ref="scaleRef">{{ canvasZoom }}</span>
          </template>
          <div class="viewport-size-preset">
            <div
              class="preset-item"
              v-for="item in canvasZoomPresets"
              :key="item"
              @click="applyCanvasPresetScale(item)"
            >
              {{ item }}%
            </div>
            <div class="preset-item" @click="resetCanvas()"><IconFullScreen class="handler-item-zoom" /></div>
          </div>
        </el-popover>
        <IconPlus class="handler-item-zoom" @click="scaleCanvas('+')" />
      </div>

      <!-- API 设置 -->
      <el-tooltip placement="top" :hide-after="0">
        <template #content>AI 接口配置</template>
        <IconSetting class="setting-btn" @click="showApiSettings = true" />
      </el-tooltip>

      <a href="https://github.com/June1601745371/yft-design" target="_blank" class="github-link">
        <IconGithub class="github-icon" />
      </a>

      <!-- 语言切换 -->
      <Lang class="lang-selector" />

      <!-- 登录/注册 -->
      <div class="user-profile">
        <div v-if="username" class="username-display">
          {{ username }}
        </div>
        <el-button v-else type="primary" link @click="handleLoginDialog(true)">登录/注册</el-button>
      </div>

      <!-- 下载按钮 -->
      <el-button type="primary" class="download-btn" @click="exportFileDialog = true">下载</el-button>
    </div>

    <!-- 全局弹窗组件 -->
    <ApiSettingsModal v-model:visible="showApiSettings" />
    <FileExport v-model:visible="exportFileDialog" @close="exportFileHide" @save="exportFileHandle" />
    <LoginDialog :visible="loginVisible" @close="handleLoginDialog" />

    <el-dialog v-model="mySpaceVisible" title="我的空间" width="500px" append-to-body>
      <div class="space-dialog-content">
        <p>这是“我的空间”的弹窗，可以在这里管理您的个人设计和模板资源。</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="mySpaceVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Object as FabricObject, Group } from 'fabric'
import { ElementNames } from '@/types/elements'
import ApiSettingsModal from '@/components/ApiSettings/ApiSettingsModal.vue'
import { useFabricStore, useMainStore, useSnapshotStore, useTemplatesStore, useUserStore } from '@/store'
import useI18n from '@/hooks/useI18n'
import useCanvas from '@/views/Canvas/useCanvas'
import useHandleTool from '@/hooks/useHandleTool'
import useCanvasScale from '@/hooks/useCanvasScale'
import useHandleElement from '@/hooks/useHandleElement'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import useHandleTemplate from '@/hooks/useHandleTemplate'

const router = useRouter()
const fabricStore = useFabricStore()
const mainStore = useMainStore()
const templatesStore = useTemplatesStore()
const userStore = useUserStore()
const { t } = useI18n()

const { alignElement, layerElement } = useHandleTool()
const { setCanvasScalePercentage, scaleCanvas, resetCanvas } = useCanvasScale()
const { combineElements, uncombineElements, intersectElements } = useHandleElement()
const { createTemplate, deleteTemplate } = useHandleTemplate()
const { zoom } = storeToRefs(fabricStore)
const { canvasObject } = storeToRefs(mainStore)
const { username } = storeToRefs(userStore)

const scaleRef = ref()
const canvasZoom = computed(() => Math.round(zoom.value * 100) + '%')
const canvasZoomPresets = [200, 150, 100, 80, 50]

const { canUndo, canRedo } = storeToRefs(useSnapshotStore())
const { redo, undo } = useHistorySnapshot()
const handleElement = computed(() => canvasObject.value as FabricObject)

// 文件及空间控制状态
const mySpaceVisible = ref(false)
const exportFileDialog = ref(false)
const loginVisible = ref(false)
const showApiSettings = ref(false)
const designTitle = ref('营销通知公众号封面3')

const goHome = () => {
  window.open(router.resolve({ path: `/home` }).href, '_blank')
}

const handleFileCommand = (command: string) => {
  if (command === 'new') createTemplate()
  else if (command === 'delete') deleteTemplate()
}

const handleLoginDialog = (status: boolean) => {
  loginVisible.value = status
}

const exportFileHide = () => {
  exportFileDialog.value = false
}

const exportFileHandle = () => {
  exportFileDialog.value = false
}

const canGroup = computed(() => {
  if (!handleElement.value) return false
  return handleElement.value.type === ElementNames.ACTIVE
})

const canUnGroup = computed(() => {
  if (!handleElement.value) return false
  return handleElement.value.type === ElementNames.GROUP
})

const canIntersection = computed(() => {
  const [canvas] = useCanvas()
  if (!handleElement.value) return false
  if (handleElement.value.type === ElementNames.GROUP) {
    const groupObject = handleElement.value as Group
    const sonObjects = groupObject._objects.filter(ele => ele.type === ElementNames.PATH)
    if (groupObject._objects.length === 2 && sonObjects && sonObjects.length === 2) return true
    return false
  }
  if (handleElement.value.type !== ElementNames.ACTIVE) return false

  const activeObjects = canvas.getActiveObjects()
  return activeObjects.length === 2 && activeObjects.filter(ele => ele.type === ElementNames.PATH).length === 2
})

// 组合
const group = () => {
  if (!handleElement.value || handleElement.value.type !== ElementNames.ACTIVE) return
  combineElements()
}

// 解除组合
const ungroup = () => {
  if (!handleElement.value || handleElement.value.type !== ElementNames.GROUP) return
  uncombineElements()
}

// 标尺显示隐藏
const changeRuler = () => {
  const [canvas] = useCanvas()
  if (!canvas.ruler) return
  canvas.ruler.enabled = !canvas.ruler.enabled
}

const intersection = (val: number) => {
  if (!handleElement.value) return
  intersectElements(val)
}

const applyCanvasPresetScale = (value: number) => {
  setCanvasScalePercentage(value)
}
</script>

<style lang="scss" scoped>
.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 0 16px;
  border-bottom: 1px solid $borderColor;
  background-color: #fff;
  user-select: none;
  position: relative;
  width: 100%;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;

  .home-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover {
      background-color: $hoverColor;
    }

    .home-icon {
      font-size: 18px;
      color: #333;
    }
  }

  .tool-dropdown-link {
    display: flex;
    align-items: center;
    gap: 2px;
    color: #333;
    font-weight: 500;

    .down-icon {
      font-size: 10px;
    }
  }

  .tool-item {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #333;
    font-weight: 500;

    .folder-icon {
      font-size: 14px;
    }
  }

  .divider {
    color: #ccc;
  }

  .design-title {
    color: #333;
    font-weight: 600;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.center-section {
  display: flex;
  align-items: center;
  gap: 8px;

  .handler-item {
    width: 32px;
    height: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: $borderRadius;
    font-size: 16px;
    cursor: pointer;

    &:hover:not(.disable) {
      background-color: $hoverColor;
    }

    &.disable {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .intersection-handler {
    margin-left: 4px;

    .handler-dropdown {
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: $borderRadius;
      cursor: pointer;

      &:hover {
        background-color: $hoverColor;
      }

      .handler-icon {
        font-size: 14px;
      }
      .icon-down {
        font-size: 10px;
        margin-left: 2px;
      }
    }
  }
}

.right-section {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;

  .zoom-control {
    display: flex;
    align-items: center;
    gap: 4px;

    .handler-item-zoom {
      width: 24px;
      height: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background-color: $hoverColor;
      }
    }

    .text {
      width: 44px;
      text-align: center;
      font-weight: 500;
    }
  }

  .setting-btn {
    font-size: 18px;
    cursor: pointer;
    color: #666;
    transition: color 0.2s;

    &:hover {
      color: #333;
    }
  }

  .nav-link {
    color: #666;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      color: #333;
    }
  }

  .github-link {
    display: flex;
    align-items: center;
    color: #666;

    &:hover {
      color: #333;
    }

    .github-icon {
      font-size: 18px;
    }
  }

  .download-btn {
    padding: 0 16px;
    height: 32px;
    font-size: 13px;
    font-weight: 600;
  }
}

.space-dialog-content {
  padding: 20px 0;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.preset-item {
  padding: 8px 20px;
  text-align: center;
  cursor: pointer;

  &:hover {
    color: $themeColor;
  }
}
</style>

<style>
.el-popover.el-popper.viewport-size {
  min-width: 100px;
  padding: 0;
}
</style>
