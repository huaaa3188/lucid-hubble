import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // 零构建打包配置，将输出设为纯静态 (SSG) 模式
  output: 'static',
  
  // 自定义 Markdown 渲染选项
  markdown: {
    // 启用 Shiki 语法高亮引擎，并将主题设为 'css-variables'
    // 这将生成可完全用我们全局 CSS 变量控制的高雅配色，完美自适应亮暗色模式！
    shikiConfig: {
      theme: 'css-variables',
      wrap: true
    }
  }
});
