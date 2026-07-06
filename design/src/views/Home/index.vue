<template>
  <div class="page-root">
    <el-container class="outer-container">
      <el-header class="border-b-[1px] items-center flex">
        <el-row class="justify-between items-center">
          <el-col :span="4" class="h-[50px]">
            <img src="@/assets/logo.png" alt="" class="h-full" />
          </el-col>
          <el-col :span="6" class="flex justify-end col-user">
            <div v-if="username" class="cursor-pointer">
              <el-tag>{{ username }}</el-tag>
            </div>
            <div v-else>
              <el-button type="primary" @click="handleLoginDialog(true)">登陆/注册</el-button>
            </div>
          </el-col>
        </el-row>
      </el-header>
      <el-container class="inner-container">
        <el-aside width="216px" class="border-r-[1px]">
          <el-menu :default-active="activeMenu" active-text-color="#000" @select="handleMenuSelect">
            <el-menu-item index="1">
              <span class="flex w-[30px] justify-center">
                <IconHome />
              </span>
              <span>为你推荐</span>
            </el-menu-item>
            <el-menu-item index="2">
              <span class="flex w-[30px] justify-center">
                <IconPeoples />
              </span>
              <span>我的空间</span>
            </el-menu-item>
            <el-menu-item index="3">
              <span class="flex w-[30px] justify-center">
                <IconPageTemplate />
              </span>
              <span>模版中心</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <!-- 为你推荐 -->
        <el-main v-if="activeMenu === '1'" @scroll="handleScroll" class="recommend-main" id="main">
          <!-- 搜索区域 -->
          <div class="search-section">
            <h2 class="search-title">在10万+原创、可商用模板中快速搜索</h2>
            <div class="search-bar">
              <el-input
                v-model="searchKeyword"
                placeholder="请输入模板关键词"
                class="search-input"
                size="large"
                clearable
                @keyup.enter="handleSearch"
              >
                <template #prefix><IconSearch class="search-icon" /></template>
              </el-input>
              <el-button type="primary" size="large" class="search-btn" @click="handleSearch">搜索</el-button>
            </div>
            <div class="hot-tags">
              <span class="hot-label">热门推荐：</span>
              <span v-for="tag in hotTags" :key="tag" class="hot-tag" @click="handleSearch()">{{ tag }}</span>
            </div>
          </div>

          <!-- 分类卡片区域 -->
          <div v-for="category in templateCategories" :key="category.name" class="category-section">
            <div class="category-header">
              <span class="category-title">{{ category.name }}</span>
              <span class="category-more" @click="changeTemplate(category.items[0]?.id)"> &gt;</span>
            </div>
            <div class="category-scroll-wrap">
              <div class="category-cards">
                <div
                  v-for="item in category.items"
                  :key="item.id"
                  class="template-card"
                  @click="changeTemplate(item.id)"
                >
                  <div class="card-img-wrap">
                    <img :src="item.preview" :alt="item.title" class="card-img" />
                    <div class="card-overlay">
                      <el-button type="primary" size="small">立即使用</el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- footer-container -->
          <div class="footer-container">
            <div class="footer-links">
              <a href="#" class="footer-link">用户协议</a>
              <span class="footer-dot">·</span>
              <a href="#" class="footer-link">企业服务</a>
              <span class="footer-dot">·</span>
              <a href="https://github.com/LYSTAR/SmartDesigner" target="_blank" rel="noopener" class="footer-link"
                >开源代码</a
              >
              <span class="footer-dot">·</span>
              <a href="#" class="footer-link">友情链接</a>
              <span class="footer-dot">·</span>
              <a href="#" class="footer-link">申请合作</a>
            </div>
            <div class="footer-copy">
              <span class="footer-copy-text">© 2026</span>
              <span class="footer-dot">·</span>
              <a href="https://github.com/LYSTAR/SmartDesigner" target="_blank" rel="noopener" class="footer-link"
                >SmartDesigner</a
              >
            </div>
          </div>
        </el-main>

        <!-- 我的空间 -->
        <el-main v-else-if="activeMenu === '2'" class="h-lvh">
          <MySpace />
        </el-main>
        <!-- 模版中心 -->
        <el-main v-else-if="activeMenu === '3'" class="h-lvh">
          <TemplateCenter />
        </el-main>
      </el-container>
    </el-container>
    <LoginDialog :visible="loginVisible" @close="handleLoginDialog" />
  </div>
</template>

<script lang="ts" setup>
import MainSearch from './components/MainSearch.vue'
import MainScene from './components/MainScene.vue'
import MainTools from './components/MainTools.vue'
import MySpace from './components/MySpace.vue'
import TemplateCenter from './components/TemplateCenter.vue'
import { getTemplateInfoPages } from '@/api/template'
import { TemplateItem } from '@/api/template/types'
import { throttle } from 'lodash-es'
import { PageSize } from '@/configs/size'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store'
import { storeToRefs } from 'pinia'

const router = useRouter()
const userStore = useUserStore()
const loginVisible = ref(false)
const activeMenu = ref('1')
const { loginStatus, username } = storeToRefs(userStore)

const handleMenuSelect = (index: string) => {
  console.log('111', index)
  activeMenu.value = index
}

// 搜索
const searchKeyword = ref('')
const hotTags = ['小红书', '活动', '招聘', '插画', 'Logo', '海报', '公众号']
const handleSearch = () => {
  if (!searchKeyword.value.trim()) return
  // 此处可后续接入真实搜索 API
}

// 分类 Mock 数据 - 模拟 yft.design 首页各分类横向轮播
const PREVIEW_IMAGES = [
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=300&h=500&fit=crop',
]
const WIDE_IMAGES = [
  'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500&h=300&fit=crop',
]
const templateCategories = computed(() => [
  {
    name: '手机海报',
    items: PREVIEW_IMAGES.map((preview, i) => ({ id: i + 1, preview, title: `手机海报${i + 1}` })),
  },
  {
    name: '微信/公众号',
    items: WIDE_IMAGES.map((preview, i) => ({ id: i + 101, preview, title: `公众号封面${i + 1}` })),
  },
  {
    name: '电商',
    items: WIDE_IMAGES.slice()
      .reverse()
      .map((preview, i) => ({ id: i + 201, preview, title: `电商海报${i + 1}` })),
  },
  {
    name: '海报',
    items: PREVIEW_IMAGES.slice()
      .reverse()
      .map((preview, i) => ({ id: i + 301, preview, title: `宣传海报${i + 1}` })),
  },
])
const resultReactive = reactive({
  loading: false,
  page: 1,
  totalPage: 1,
  column: 6,
  move: true,
  items: [] as TemplateItem[],
})

const handleScroll = throttle(async () => {
  const mainElement = document.getElementById('main') as HTMLElement
  const scrollHeight = mainElement.scrollHeight,
    scrollTop = mainElement.scrollTop,
    clientHeight = mainElement.clientHeight
  if (scrollHeight - (scrollTop + clientHeight) <= 200) {
    if (resultReactive.page < resultReactive.totalPage) {
      resultReactive.page += 1
      await getTemplateItems()
    }
  }
}, 300)

const handleLoginDialog = (status: boolean) => {
  loginVisible.value = status
}

const setItemStyle = (img: HTMLImageElement, index: number) => {
  if (!img) return
  const update = () => {
    const item = img.parentElement
    if (!item) return
    const gapRows = index >= resultReactive.column ? 8 : 0
    const rows = Math.ceil(item.clientHeight / 2) + gapRows
    item.style.gridRowEnd = `span ${rows}`
  }
  update()
  img.onload = update
  img.onerror = function () {
    img.src = new URL(`/src/assets/images/loading.gif`, import.meta.url).href
    update()
  }
}

const loadTemplateImage = async () => {
  resultReactive.items.forEach(item => {
    const itemImages = item.images
    if (itemImages && JSON.parse(itemImages)) {
      const images = JSON.parse(itemImages) as string[]
      images.forEach(ele => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = ele
      })
    }
  })
}

const getTemplateItems = async () => {
  const pageParams = { page: resultReactive.page, size: PageSize }
  const result = await getTemplateInfoPages(pageParams)
  if (result.data && result.data.code === 200) {
    resultReactive.page = result.data.data.page
    resultReactive.totalPage = result.data.data.total_pages
    resultReactive.items = resultReactive.items.concat(result.data.data.items)
    // await loadTemplateImage()
  }
}

const changeTemplate = (pk: number) => {
  const { href } = router.resolve({
    path: '/',
    query: {
      template: pk,
    },
  })
  window.open(href, '_blank')
}

onMounted(() => {
  getTemplateItems()
})
</script>

<style lang="scss" scoped>
.col-user {
  display: flex;
}

// ========== 侧边栏菜单 ==========
.el-aside .el-menu .el-menu-item {
  height: 40px;
  padding-left: 0;
  padding-right: 0;
  margin-left: var(--el-menu-level-padding);
  border-radius: 5px;
  &:hover {
    background-color: #f1f2f4;
  }
}
.el-aside .el-menu .is-active {
  background-color: #f1f2f4;
}

// ========== 页面高度约束链 ==========
.page-root {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.outer-container {
  height: 100%;
  flex-direction: column;
}
.inner-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

// ========== 为你推荐主区域 ==========
.recommend-main {
  background-color: #f4f5f7;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding: 0;
}

// ========== footer-container ==========
.footer-container {
  padding: 24px 40px 32px;
  background: #fff;
  border-top: 1px solid #ebebeb;
  text-align: center;

  .footer-links {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 10px;
  }

  .footer-link {
    font-size: 13px;
    color: #666;
    text-decoration: none;
    transition: color 0.2s;
    &:hover {
      color: #409eff;
    }
  }

  .footer-dot {
    font-size: 13px;
    color: #ccc;
    padding: 0 2px;
  }

  .footer-copy {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .footer-copy-text {
    font-size: 12px;
    color: #999;
  }
}

// ========== 搜索区域 ==========
.search-section {
  padding: 48px 40px 32px;
  text-align: center;
  background: #fff;
  border-bottom: 1px solid #eee;

  .search-title {
    font-size: 22px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0 0 20px;
    letter-spacing: 0.5px;
  }

  .search-bar {
    display: flex;
    align-items: center;
    max-width: 600px;
    margin: 0 auto 14px;
    gap: 10px;

    .search-input {
      flex: 1;
      :deep(.el-input__wrapper) {
        border-radius: 8px 0 0 8px;
        box-shadow: 0 0 0 1px #d9d9d9 inset;
        &:hover,
        &.is-focus {
          box-shadow: 0 0 0 1px #409eff inset;
        }
      }
    }

    .search-btn {
      border-radius: 0 8px 8px 0;
      padding: 0 28px;
      font-size: 15px;
    }

    .search-icon {
      font-size: 16px;
      color: #999;
    }
  }

  .hot-tags {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 13px;

    .hot-label {
      color: #666;
    }

    .hot-tag {
      color: #409eff;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
      transition: background 0.2s;
      &:hover {
        background: #ecf5ff;
      }
    }
  }
}

// ========== 分类区块 ==========
.category-section {
  padding: 28px 32px 8px;
  background: #fff;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  .category-title {
    font-size: 18px;
    font-weight: 700;
    color: #1a1a2e;
  }

  .category-more {
    font-size: 16px;
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }
}

.category-scroll-wrap {
  overflow-x: auto;
  padding-bottom: 16px;
  // 隐藏滚动条但保留滚动功能
  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 2px;
  }
}

.category-cards {
  display: flex;
  gap: 12px;
  width: max-content;
}

// ========== 模板卡片 ==========
.template-card {
  flex-shrink: 0;
  width: 160px;
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

    .card-overlay {
      opacity: 1;
    }
  }

  .card-img-wrap {
    position: relative;
    width: 160px;
    height: 220px;
    overflow: hidden;
  }

  .card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.3s;
  }

  &:hover .card-img {
    transform: scale(1.04);
  }

  .card-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
  }
}
</style>
