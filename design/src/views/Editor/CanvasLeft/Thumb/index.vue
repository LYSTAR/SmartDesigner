<template>
  <div
    class="thumb-wrapper"
    @mousedown="() => setThumbnailsFocus(true)"
    v-click-outside="() => setThumbnailsFocus(false)"
    v-contextmenu="activeTab === 'canvas' ? contextMenusThumbnails : undefined"
  >

    <!-- Tab 栏：画板 / 图层 -->
    <div class="tab-bar">
      <div class="tab-items">
        <span class="tab-item" :class="{ active: activeTab === 'canvas' }" @click="activeTab = 'canvas'"> 画板 </span>
        <span class="tab-item" :class="{ active: activeTab === 'layer' }" @click="activeTab = 'layer'"> 图层 </span>
      </div>
      <div class="tab-actions">
        <el-tooltip content="添加" placement="top" :hide-after="0" v-if="activeTab === 'canvas'">
          <el-button text class="action-btn" @click="createTemplate">
            <IconPlus />
          </el-button>
        </el-tooltip>
        <el-tooltip content="搜索" placement="top" :hide-after="0" v-if="activeTab === 'layer'">
          <el-button text class="action-btn" @click="toggleSearch">
            <IconSearch />
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 图层搜索栏 -->
    <div v-if="activeTab === 'layer' && showSearch" class="layer-search">
      <el-input v-model="layerKeywords" :prefix-icon="Search" placeholder="搜索图层" size="small" clearable />
    </div>

    <!-- 画板面板 -->
    <template v-if="activeTab === 'canvas'">
      <Draggable
        class="thumb-content"
        :modelValue="templates"
        :animation="300"
        :scroll="true"
        :scrollSensitivity="50"
        :setData="null"
        @end="handleDragEnd"
        itemKey="id"
      >
        <template #item="{ element, index }">
          <div
            :class="{
              'thumbnail-item': true,
              active: templateIndex === index,
              selected: selectedTemplatesIndex.includes(index),
            }"
            @mousedown="($event: MouseEvent) => handleClickTemplateThumbnail($event, index)"
            v-contextmenu="contextmenusThumbnailItem"
          >
            <div class="label" :class="{ 'offset-left': index >= 99 }">{{ fillDigit(index + 1, 2) }}</div>
            <ThumbnailTemplate
              class="thumbnail"
              :template="element"
              :size="120"
              :visible="index < templatesLoadLimit"
            />
          </div>
        </template>
      </Draggable>
      <div class="thumb-number">{{ t('message.pages') }}{{ templateIndex + 1 }} / {{ templates.length }}</div>
    </template>

    <!-- 图层面板 -->
    <template v-if="activeTab === 'layer'">
      <div class="layer-content" @click.stop="cancelElement">
        <LayerDraggableSelf :elements="layerObjects" :index="0" />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, unref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import useLoadTemplates from '@/hooks/useLoadTemplates'
import useHandleTemplate from '@/hooks/useHandleTemplate'
import useHandleElement from '@/hooks/useHandleElement'
import ThumbnailTemplate from './components/Template.vue'
import LayerDraggableSelf from '../Menu/components/LayerComponents/LayerDraggableSelf.vue'
import Draggable from 'vuedraggable'
import useI18n from '@/hooks/useI18n'
import { contextMenusThumbnails } from '@/configs/contextMenu'
import { useMainStore, useTemplatesStore, useKeyboardStore } from '@/store'
import { ContextMenu } from '@/components/Contextmenu/types'
import { storeToRefs } from 'pinia'
import { fillDigit } from '@/utils/common/common'
import { ElementNames } from '@/types/elements'
import { WorkSpaceThumbType } from '@/configs/canvas'

const mainStore = useMainStore()
const templatesStore = useTemplatesStore()
const keyboardStore = useKeyboardStore()
const { t } = useI18n()
const { templatesLoadLimit } = useLoadTemplates()
const { templates, templateIndex, currentTemplate } = storeToRefs(templatesStore)
const { selectedTemplatesIndex: _selectedTemplatesIndex, thumbnailsFocus } = storeToRefs(mainStore)
const { ctrlKeyState, shiftKeyState } = storeToRefs(keyboardStore)
const { createTemplate, deleteTemplate, sortTemplates, cutTemplate, pasteTemplate } = useHandleTemplate()
const { cancelElement } = useHandleElement()

// Tab 状态
const { thumbActiveTab } = storeToRefs(mainStore)
const activeTab = thumbActiveTab
const showSearch = ref(false)
const layerKeywords = ref('')

// 图层搜索
const toggleSearch = () => {
  showSearch.value = !showSearch.value
  if (!showSearch.value) layerKeywords.value = ''
}

// 图层列表（过滤工作区元素和参考线）
const layerObjects = computed(() => {
  const _keywords = unref(layerKeywords.value)
  if (!_keywords)
    return currentTemplate.value.objects.filter(
      (item: any) => !WorkSpaceThumbType.includes(item.id) && item.type?.toLowerCase() !== ElementNames.REFERENCELINE
    )
  return currentTemplate.value.objects.filter(
    (item: any) =>
      !WorkSpaceThumbType.includes(item.id) &&
      item.type?.toLowerCase() !== ElementNames.REFERENCELINE &&
      (item.type?.toLowerCase().includes(_keywords) || item.layer?.toLowerCase().includes(_keywords))
  )
})

const selectedTemplatesIndex = computed(() => [..._selectedTemplatesIndex.value, templateIndex.value])
const contextmenusThumbnailItem = (): ContextMenu[] => {
  return [
    {
      text: '剪切',
      subText: 'Ctrl + X',
      handler: cutTemplate,
    },
    {
      text: '复制',
      subText: 'Ctrl + C',
    },
    {
      text: '粘贴',
      subText: 'Ctrl + V',
      handler: pasteTemplate,
    },
    {
      text: '全选',
      subText: 'Ctrl + A',
    },
    { divider: true },
    {
      text: '新建页面',
      subText: 'Enter',
      handler: createTemplate,
    },
    {
      text: '复制页面',
      subText: 'Ctrl + D',
    },
    {
      text: '删除页面',
      subText: 'Delete',
      handler: () => deleteTemplate(),
    },
    { divider: true },
    {
      text: '从当前预览',
      subText: 'Shift + F5',
    },
  ]
}

// 设置缩略图工具栏聚焦状态
const setThumbnailsFocus = (focus: boolean) => {
  if (thumbnailsFocus.value === focus) return
  mainStore.setThumbnailsFocus(focus)
  if (!focus) mainStore.updateSelectedTemplatesIndex([])
}

// 拖拽调整顺序
const handleDragEnd = (eventData: { newIndex: number; oldIndex: number }) => {
  const { newIndex, oldIndex } = eventData
  sortTemplates(newIndex, oldIndex)
}

// 点击缩略图
const handleClickTemplateThumbnail = (e: MouseEvent, index: number) => {
  const isMultiSelected = selectedTemplatesIndex.value.length > 1
  if (isMultiSelected && selectedTemplatesIndex.value.includes(index) && e.button !== 0) return

  if (ctrlKeyState.value) {
    if (templateIndex.value === index) {
      if (!isMultiSelected) return
    } else {
      if (selectedTemplatesIndex.value.includes(index)) {
        const newSelectedSlidesIndex = selectedTemplatesIndex.value.filter(item => item !== index)
      } else {
        const newSelectedSlidesIndex = [...selectedTemplatesIndex.value, index]
      }
    }
  } else if (shiftKeyState.value) {
    if (templateIndex.value === index && !isMultiSelected) return
    let minIndex = Math.min(...selectedTemplatesIndex.value)
    let maxIndex = index
    if (index < minIndex) {
      maxIndex = Math.max(...selectedTemplatesIndex.value)
      minIndex = index
    }
    const newSelectedSlidesIndex = []
    for (let i = minIndex; i <= maxIndex; i++) newSelectedSlidesIndex.push(i)
  } else {
    mainStore.updateSelectedTemplatesIndex([])
    changeSlideIndex(index)
  }
}

// 切换页面
const changeSlideIndex = (index: number) => {
  if (templateIndex.value === index) return
  templatesStore.setTemplateIndex(index)
  templatesStore.renderTemplate()
}
</script>

<style lang="scss" scoped>
.thumb-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

// ========== Tab 栏 ==========
.tab-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: $headerHeight;
  padding: 0 8px;
  border-bottom: 1px solid $borderColor;
  flex-shrink: 0;
}

.tab-items {
  display: flex;
  gap: 4px;
}

.tab-item {
  font-size: 13px;
  color: #999;
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  user-select: none;

  &:hover {
    color: #666;
  }

  &.active {
    color: #333;
    font-weight: 600;
  }
}

.tab-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  font-size: 16px;
  color: #666;
  border-radius: 4px;

  &:hover {
    color: #333;
    background-color: $hoverColor;
  }
}

// ========== 图层搜索 ==========
.layer-search {
  padding: 8px 10px;
  flex-shrink: 0;
}

// ========== 画板面板 ==========
.thumb-content {
  padding: 5px 0;
  flex: 1;
  overflow: auto;
}

.thumbnail-item {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px 0;

  .thumbnail {
    outline: 1px solid rgba($color: $themeColor, $alpha: 0.15);
  }

  &.active {
    .label {
      color: $themeColor;
    }
    .thumbnail {
      outline-color: $themeColor;
    }
  }
  &.selected {
    .thumbnail {
      outline-color: $themeColor;
    }
  }
}

.label {
  font-size: 12px;
  color: #999;
  width: 20px;
  cursor: grab;

  &.offset-left {
    position: relative;
    left: -4px;
  }

  &:active {
    cursor: grabbing;
  }
}

.thumb-number {
  font-size: 12px;
  border-top: 1px solid $borderColor;
  line-height: 36px;
  text-align: center;
  color: #666;
  flex-shrink: 0;
}

// ========== 图层面板 ==========
.layer-content {
  flex: 1;
  overflow-y: auto;
  padding: 6px 8px;
}
</style>
