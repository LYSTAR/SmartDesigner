<template>
  <div class="flex">
    <Label class="w-[70px] h-full z-10 bg-[#fff] border-r-[1px] border-[#eee]" />
    <Menu />
    <Thumb class="w-[220px] h-full flex flex-shrink-0 bg-[#fff] flex-col select-none" />
  </div>
</template>

<script lang="ts" setup>
import Label from './Label/index.vue'
import Menu from './Menu/index.vue'
import Thumb from './Thumb/index.vue'
</script>
