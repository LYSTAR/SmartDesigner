<template>
  <div class="canvas-control-trigger flex items-center select-none" @mousedown.stop>
    <div
      class="trigger-btn flex items-center justify-center cursor-pointer"
      :class="{ active: thumbShow && thumbActiveTab === 'layer' }"
      @click="toggleLayer"
      title="图层"
    >
      <SvgIcon icon-class="layer" className="svg-icon-size" />
    </div>
    <div class="trigger-divider"></div>
    <div
      class="trigger-btn flex items-center justify-center cursor-pointer font-medium"
      :class="{ active: thumbShow && thumbActiveTab === 'canvas' }"
      @click="toggleCanvas"
      title="画板"
    >
      <span class="mr-1 text-xs">画板 {{ templateIndex + 1 }}/{{ templates.length }}</span>
      <!-- 双箭头，展开时指向左 <<，折叠时指向右 >> -->
      <svg
        v-if="thumbShow"
        viewBox="0 0 24 24"
        width="12"
        height="12"
        stroke="currentColor"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="transition-transform duration-300 transform-icon"
      >
        <polyline points="11 17 6 12 11 7"></polyline>
        <polyline points="18 17 13 12 18 7"></polyline>
      </svg>
      <svg
        v-else
        viewBox="0 0 24 24"
        width="12"
        height="12"
        stroke="currentColor"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="transition-transform duration-300 transform-icon"
      >
        <polyline points="13 17 18 12 13 7"></polyline>
        <polyline points="6 17 11 12 6 7"></polyline>
      </svg>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useMainStore, useTemplatesStore } from '@/store'

const mainStore = useMainStore()
const templatesStore = useTemplatesStore()

const { thumbShow, thumbActiveTab } = storeToRefs(mainStore)
const { templates, templateIndex } = storeToRefs(templatesStore)

const toggleLayer = () => {
  if (thumbShow.value && thumbActiveTab.value === 'layer') {
    thumbShow.value = false
  } else {
    thumbShow.value = true
    thumbActiveTab.value = 'layer'
  }
}

const toggleCanvas = () => {
  if (thumbShow.value && thumbActiveTab.value === 'canvas') {
    thumbShow.value = false
  } else {
    thumbShow.value = true
    thumbActiveTab.value = 'canvas'
  }
}
</script>

<style lang="scss" scoped>
.canvas-control-trigger {
  position: absolute;
  left: 48px;
  bottom: 16px;
  z-index: 10;
  height: 32px;
  padding: 0 4px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(0, 0, 0, 0.12);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }

  .trigger-btn {
    height: 24px;
    padding: 0 8px;
    border-radius: 12px;
    color: #555;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba(0, 0, 0, 0.04);
      color: #111;
    }

    &.active {
      background: rgba(0, 0, 0, 0.06);
      color: $themeColor;
    }
  }

  .trigger-divider {
    width: 1px;
    height: 12px;
    background: rgba(0, 0, 0, 0.08);
    margin: 0 2px;
  }

  .svg-icon-size {
    font-size: 14px;
  }

  .transform-icon {
    opacity: 0.8;
  }
}
</style>
