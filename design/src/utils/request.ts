import axios, { AxiosResponse } from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { localStorage } from '@/utils/storage';
import { useUserStore } from '@/store';
import { storeToRefs } from 'pinia';
import { Templates } from '@/mocks/templates';
import { zip } from '@/utils/crypto';

// 是否开启纯前端 Mock 模式
const IS_MOCK = true;

// Axios 自定义适配器 Mock，拦截特定的后端 API 请求
const mockAdapter = (config: any) => {
  const url = config.url || '';
  
  // 1. 字体库 Mock
  if (url.includes('api/design/font/info')) {
    return Promise.resolve({
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: {
        code: 200,
        msg: 'success',
        data: [
          { id: 1, fontname: 'AlimamaShuHeiTi', url: 'https://at.alicdn.com/wf/webfont/zS977b3112t1/H27z155b39t5.ttf' },
          { id: 2, fontname: 'ZCOOL KuaiLe', url: 'https://cdn.jsdelivr.net/font-fontface/zcool-kuaile/ZCOOLKuaiLe-Regular.ttf' },
          { id: 3, fontname: 'ZCOOL XiaoWei', url: 'https://cdn.jsdelivr.net/font-fontface/zcool-xiaowei/ZCOOLXiaoWei-Regular.ttf' }
        ]
      }
    });
  }

  // 2. 模板列表 Mock (首页推荐 & 编辑器模板池)
  if (url.includes('/api/design/template/info/pages') || url.includes('/api/design/template/detail/pages')) {
    const items = Templates.map((item, index) => ({
      id: index + 1,
      title: `模板海报 ${index + 1}`,
      text: `AI拖拽式多场景海报封面智能生成工具`,
      preview: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=300',
      width: item.width || 1200,
      height: item.height || 800,
      data: zip(JSON.stringify(item)),
      images: JSON.stringify(['https://images.unsplash.com/photo-1557683316-973673baf926?w=800'])
    }));
    return Promise.resolve({
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: {
        code: 200,
        msg: 'success',
        data: {
          total: items.length,
          page: 1,
          total_pages: 1,
          size: 10,
          pages: 1,
          items: items
        }
      }
    });
  }

  // 3. 模板详情 Mock
  if (url.includes('/api/design/template/data/')) {
    const parts = url.split('/');
    const pk = parseInt(parts[parts.length - 1]) || 1;
    const item = Templates[pk - 1] || Templates[0];
    return Promise.resolve({
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: {
        code: 200,
        msg: 'success',
        data: {
          id: pk,
          title: `模板海报 ${pk}`,
          text: `AI拖拽式多场景海报封面智能生成工具`,
          preview: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=300',
          width: item.width || 1200,
          height: item.height || 800,
          data: zip(JSON.stringify(item))
        }
      }
    });
  }

  // 4. 图片/插画列表 Mock
  if (url.includes('api/design/image/page') || url.includes('api/design/illustration/page')) {
    return Promise.resolve({
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: {
        code: 200,
        msg: 'success',
        data: {
          total: 2,
          totalHits: 2,
          hits: [
            {
              id: 1,
              previewURL: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200',
              webformatURL: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
              largeImageURL: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200',
              imageWidth: 800,
              imageHeight: 1200
            },
            {
              id: 2,
              previewURL: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200',
              webformatURL: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
              largeImageURL: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
              imageWidth: 800,
              imageHeight: 800
            }
          ]
        }
      }
    });
  }

  // 5. 分类 Mock
  if (url.includes('api/design/image/category') || url.includes('api/design/illustration/category')) {
    return Promise.resolve({
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: {
        code: 200,
        msg: 'success',
        data: []
      }
    });
  }

  // 默认使用 Axios 原生的 http 适配器发送请求
  const originalAdapter = axios.defaults.adapter;
  if (originalAdapter) {
    return originalAdapter(config);
  }
  return Promise.reject(new Error('No default adapter found in Axios'));
};

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 500000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' },
  adapter: IS_MOCK ? mockAdapter : undefined
});

// 请求拦截器
service.interceptors.request.use(
  (config: any) => {
    if (!config.headers) {
      throw new Error(
        `Expected 'config' and 'config.headers' not to be undefined`
      );
    }
    const { loginStatus } = storeToRefs(useUserStore())
    if (loginStatus && localStorage.get('access_token')) {
      config.headers.Authorization = `Bearer ${localStorage.get('access_token')}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, msg } = response.data;
    if (code === 200) {
      return response;
    }
    else if (code === 401) {
      localStorage.remove('access_token')
      return response;
    }
    else {
      // 响应数据为二进制流处理(Excel导出)
      if (response.data instanceof ArrayBuffer) {
        return response;
      }
      if (response.data instanceof Array) {
        return response;
      }

      ElMessage({
        message: msg || '系统出错',
        type: 'error',
      });
      return Promise.reject(new Error(msg || 'Error'));
    }
  },
  (error: any) => {
    if (error.response && error.response.data) {
      const { detail } = error.response.data;
      console.log('code:', error.response.data)
      // token 过期,重新登录
      if (detail === 'Signature has expired.') {
        ElMessageBox.confirm('当前页面已失效，请重新登录', 'Warning', {
          confirmButtonText: 'OK',
          type: 'warning',
        }).then(() => {
          localStorage.clear();
          window.location.href = '/';
        });
      } else {
        ElMessage({
          message: detail || '系统出错',
          type: 'error',
        });
      }
    }
    return Promise.reject(error.message);
  }
);

// 导出 axios 实例
export default service;
