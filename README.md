# 🌱 Lucid Hubble — 现代工程美学极简个人博客

一个由 **Astro (v6.x)** 强力驱动的高颜值、高性能、极简主义风格的个人数字花园。

本项目承袭了**“少即是多（Less is more）”**的设计哲学，将传统的纸质杂志人文排版美学与现代高档数字微动效无缝融为一体。在底层，我们实施了极致的 **Zero-JS default（构建期零运行时）** 静态编译，追求闪电般的加载性能与近乎完美的搜索引擎 SEO 表现。

---

## ✨ 核心亮点

### 🎨 极简杂志美学与暗黑自适应
* **人文色调系统**：使用精密调配的 HSL 色彩系统（亮色：温润暖白 `#f7f5f0`；暗色：深邃纯黑 `#0a0a0a`），保证全天候沉浸式的阅读舒适度。
* **双字体精密排版**：界面按钮与系统功能使用极其清晰的 `Inter` 无衬线字体；而所有随笔标题、正文及大 Logo 均使用温润人文的 `Lora` 衬线体，完美还原高级纸质书籍的呼吸感。
* **零闪烁暗黑模式**：内嵌防止首屏页面闪烁 (FOUC) 的主题偏好脚本，刷新或多次转场均能瞬间应用历史颜色。

### 🌈 电影级微交互与极致性能 (NEW)
* **电影级跨页平滑转场**：利用最新一代 Astro 的 `ClientRouter` 路由机制，跨页跳转、返航时网页不会有任何白屏闪烁刷新，而是呈现如同原生 iOS App 般极其丝滑的淡入淡出和元素平移动效。
* **0ms 鼠标悬停预加载 (`prefetch`)**：在卡片和主菜单超链接上激活 prefetch。当访客鼠标悬停超 100ms，Astro 会在后台用极微量带宽提前预拉取文章 HTML。用户点击瞬间 **0 毫秒秒开呈现**，彻底消除一切网络延时顿挫感。
* **0ms 首页无刷新瞬时标签检索**：卡片标签全部升级为交互式按钮。点击任意标签，其他不含该标签的文章卡片会平滑淡出，首页瞬间过滤检索出目标文章，提供清爽的 `清除检索` 浮动条，且完美切断超链接冒泡。
* **2px 极细沉浸阅读进度条**：在文章阅读页最顶端，加入随滚动位置拉伸的 2 像素极细 Rust 橙色进度条。在其他无关界面智能隐形，零外部 NPM 包负担，为深度长文阅读提供绝佳反馈。

### 🛡️ 高效的生产力与写作护航
* **高规格独立关于页 (`/about/`)**：将关于我模块从首页剥离，首页 100% 聚焦随笔创作；独立的 `About` 页面采用精美的不对称 Grid 栅格，展现个人极客（As an Engineer）与花匠（As a Gardener）的多面侧写。
* **草稿防误发过滤系统**：利用 Astro 强大的 zod 格式安全 Schema 约束，写新随笔时仅需加上 `draft: true`。即使 `git push` 到 GitHub 线上，文章也绝不会提前泄漏。但在本地开发模式（`npm run dev`）下依然完美可见，方便调试润色。
* **构建期语法高亮 (Shiki)**：内置 Shiki 构建期代码渲染引擎，直接在编译期将代码段转换为高亮 HTML。高亮色值变量与全局亮暗色 CSS 变量完全融合，客户端无任何 JS 加载开销。

---

## 📂 项目目录与架构规范

```text
├── package.json               # 声明 Astro (v6.x) 核心依赖与开发脚本
├── astro.config.mjs           # Astro 全局核心配置文件（声明站点域名、子路径及 Shiki 配置）
├── public/                    # 存放 Favicon 等公共零编译静态资源
└── src/                       # 核心源码目录
    ├── content/               # 内容数据集
    │   ├── config.ts          # Zod 强类型 Frontmatter 元数据结构约束与草稿 Schema
    │   └── blog/              # 写稿手稿库（您的 markdown 随笔在此成长）
    ├── layouts/
    │   └── Layout.astro       # 极简杂志风全局母版，封装 ClientRouter 路由、Lucide 矢量图标与进度条监听
    ├── pages/
    │   ├── index.astro        # 博客主页（搭载 Staggered Fade-in 动画及客户端 0ms 标签筛选脚本）
    │   ├── about.astro        # 独立的关于我物理展示页面
    │   └── post/
    │       └── [slug].astro   # 博文详情页（构建期自动从 Markdown 编译翻译为静态正文）
    └── styles/
        └── global.css         # 全局核心设计系统 CSS 样式（HSL 颜色系统、Shiki 配色与响应式布局）
```

---

## 🛠️ 本地开发运行指引

项目需要 **Node.js >= v22.12.0** 版本环境：

### 1. 安装项目依赖
```bash
npm install
```

### 2. 启动本地开发调试
```bash
npm run dev
```
启动后，在浏览器访问 `http://localhost:8000/` 即可预览您的数字花园，支持极速热更新 (HMR)。

### 3. 本地生产打包与静态预览
```bash
# 生产环境静态打包，编译产物将生成至 dist/ 文件夹下
npm run build

# 本地预览打包出来的纯静态 HTML 产物
npm run preview
```

---

## 📝 园丁写稿极简指引

升级到 Astro 后，写新文章变得不可思议地安全和快捷：

1. **新建手稿**：在 `src/content/blog/` 目录下创建一个新的 `.md` 文件，例如 `src/content/blog/my-reflection.md`。
2. **定义 Frontmatter 标签**：在文章的最顶端加上 YAML 配置头部：
   ```markdown
   ---
   title: "我的文章标题"
   date: "2026-05-28"
   description: "这是一句关于新随笔的精美摘要。"
   tags: ["设计", "思想"]
   draft: false
   ---

   这里是您开始撰写的 Markdown 正文内容...
   ```
   * *Astro 会在构建时自动捕捉该文件，验证其元数据合法性，并将其按时间倒序呈现在主页顶部，Shiki 也将同步完成高亮处理。*
   * *如果文章还没写完，只需将 `draft` 修改为 `true` 即可在发布时安全过滤。*

---

## 🚢 GitHub Pages 云端自动部署

本项目使用 GitHub Actions 在云端实施全自动编译与分发。

每当您在本地将代码通过 git 推送至远程仓库 `main` 分支时：
```bash
git add .
git commit -m "feat: publish new post"
git push origin main
```
GitHub 上的自动化构建工作流会自动启动，使用 Node 22 环境在短短数十秒内将您的博客源文件静态打包，并一键无缝更新上线至您的 GitHub Pages 站点：
👉 **[https://Huaaa3188.github.io/lucid-hubble/](https://Huaaa3188.github.io/lucid-hubble/)**

---
🌿 *用心记录思想，用代码呵护秩序。欢迎在这片数字绿洲中静静阅读与创作。*
