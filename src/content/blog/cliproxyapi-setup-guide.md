---
title: "折腾一下 CLIProxyAPI：把 Claude Code 和 Codex (GPT-5.5) 塞进我的审计后台"
date: "2026-06-13"
description: "记录一次将 CLIProxyAPI 与 CPA-Manager-Plus 联合部署的踩坑过程。实现 Claude Code 与 Codex 命令行额度的标准 API 桥接分发与用量审计。"
tags: ["自托管", "随笔", "开发工具"]
draft: false
---

自从把日常的开发流全面切到 Claude Code 和 Codex 之后，写代码的效率确实上去了，但月底的 API 账单也肉眼可见地变得有些离谱。虽然官方 CLI 提供的额度很慷慨，但有时候想把接口倒腾出来给其他本地开发工具用，直接去买官方 API 又有些吃不消。

研究了一圈，最后盯上了 CLIProxyAPI。这篇随笔就记录一下我自己把这个内核和 CPA-Manager-Plus 搓在一起时的踩坑过程。

---

## 这俩货是怎么凑到一起的？

折腾之前得先搞明白这俩货是怎么分工的。

新版本的 CLIProxyAPI (CPA) 纯粹得像个铁疙瘩，把以前内置的数据统计功能彻底砍了，只负责在后台接管 CLI 进程，然后把登录态包装成标准的 OpenAI 兼容接口。如果想要知道自己每天到底跑了多少 Token，就必须配上 CPA-Manager-Plus (CPA-M+)。

这玩意儿在后台读取 CPA 的 usage-queue，把每一笔请求的时间、延迟、Token 消耗以及 GPT-5.5 的 `reasoning_tokens` 持久化到 SQLite 数据库里。

所以简单来说，一个当发动机，一个当记账员。

---

## 极其省心的双容器编排

搭建过程用 Docker compose 是最省心的。在服务器上新建了个文件夹，顺手写了个双容器联动的 yaml 文件：

```yaml
version: '3.8'

services:
  # 核心中转内核
  cli-proxy-api:
    image: routerforme/cliproxyapi:latest
    container_name: cli-proxy-api
    ports:
      - "8317:8317"
    volumes:
      - ./cpa-data:/app/data
      # 映射本地配置目录以共享认证态，这对于 OAuth 登录非常必要
      - ~/.config/claude-code:/root/.config/claude-code
    environment:
      - PORT=8317
      - CPA_MANAGEMENT_KEY=your_secure_management_key  # 自定义你的 CPA 内核管理密钥
      - REDIS_USAGE_QUEUE_RETENTION_SECONDS=60          # 队列保留时长
    restart: unless-stopped

  # 可视化监控与管理面板
  cpa-manager-plus:
    image: seakee/cpa-manager-plus:latest
    container_name: cpa-manager-plus
    ports:
      - "18317:18317"
    volumes:
      - ./cpam-data:/data
    environment:
      - PORT=18317
      - CPA_MANAGER_ADMIN_KEY=your_admin_secret_key    # 管理面板的登录密码
    depends_on:
      - cli-proxy-api
    restart: unless-stopped
```

直接 `docker compose up -d` 跑起来就行。

---

## 连通绑定与一个愚蠢的坑

容器起来之后，我访问的是 CPA-M+ 的面板端口（`18317/management.html`）。这里有个非常蠢的坑：在绑定 CPA URL 的时候，我本能地在输入框里填了 `http://localhost:8317`，结果面板直接报错连不上。

拍了大腿才想起来，这俩容器是在同一个 Compose 网络里跑的，Manager 怎么可能通过 localhost 摸到隔壁的内核？这里不能写 localhost，必须写内核服务的服务名：`http://cli-proxy-api:8317`。

至于登录需要的 Admin Key，如果启动时没在环境变量里配死，就得去跑 `docker logs cpa-manager-plus` 翻日志，里面会有一行随机生成的 `cmp_admin_` 密钥。

---

## 免扫码共享登录凭证

配好之后就是挂载凭证。这一步其实很优雅，因为我在 docker-compose 卷里把宿主机的 `~/.config/claude-code` 映射进了内核容器的 `/root/.config/claude-code`。

所以只要我之前在服务器宿主机上用 `claude` 命令行成功登录过订阅账号，容器内启动后直接就能共享到现成的授权，完全不需要在 Headless 环境里重新经历繁琐的扫码或者登录过程。

Codex (GPT-5.5) 的绑定直接在 Manager 后台走标准的 OAuth 就行，它转译出的 `gpt-5.5` 能很精准地把 `reasoning_tokens` 的思考过程和用量统计吐给审计后台。

---

## 客户端调用分发

全部弄妥当之后，在 CPA-M+ 的后台里给自己建个专用的 API Key，就可以把 Base URL 指向中转内核的地址：`http://你的服务器IP:8317/v1` 去分发使用了。

在各类开发工具里，Model ID 直接填配置好的 `gpt-5.5` 或者 `claude-code` 即可，调用的同时后台会实时刷新 SQLite 的请求审计。

---

## 后记

虽然把命令行代理出来用有点像是在跟官方玩猫鼠游戏，风控和认证机制指不定哪天就会变，但对于目前想要规避 Token 消耗、又想保留详细调用审计日志的本地流来说，这套双 Docker 方案确实是目前折腾起来最干净、也最让我安心的基础设施了。

至少看着后台 SQLite 记录里一笔笔清爽的零成本调用，今晚敲键盘的力道都可以稍微重一些了。
