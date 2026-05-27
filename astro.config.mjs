import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // 配置您的个人 GitHub Pages 站点以及子路径
  // 这能确保静态资源（CSS, JS 等）部署到 Pages 后不会发生 404 加载失效
  site: 'https://Huaaa3188.github.io',
  base: '/lucid-hubble',
  
  output: 'static',
  
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
      wrap: true
    }
  }
});
