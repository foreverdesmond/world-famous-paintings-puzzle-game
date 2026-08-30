# 🎨 世界名画拼图小游戏 · World Famous Paintings Puzzle

<div align="center">
  **交换两块切片，把世界名画拼回原样**
  **Swap two tiles to reassemble a world-famous painting**

  101 幅公共领域 / CC0 名画，横竖画自适应固定框，逐关递进 100 关，无后端可玩。

  101 public-domain & CC0 masterpieces, auto-adapting portrait/landscape frames, 100 levels, no backend.

  🌐 **Live Demo · 在线站点**: https://game.tututoken.cc

  [![X (Twitter)](https://img.shields.io/badge/X-@Richyisaflower-black?logo=x)](https://x.com/Richyisaflower)
  [![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=fff)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org)
  [![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=fff)](https://vitejs.dev)
  [![Vitest](https://img.shields.io/badge/Vitest-3-6E9F18?logo=vitest&logoColor=fff)](https://vitest.dev)
</div>

<p align="center">
  <a href="#简体中文">简体中文</a> · <a href="#english">English</a>
</p>

---

## 简体中文

### 为什么做这一款
做拼图门类很多，但大多用随机图片、没有情感。这个项目把**世界名画**变成可玩的东西——梵高、达·芬奇、莫奈、维米尔这些传世之作，不再是墙上的画，而是一块块任你亲手拼回的作品。低门槛、高完成感，打开即玩。

### 你会得到什么
- **101 幅去玩不腻的名画**：全部来自公共领域 / CC0，可自由使用，画作随难度逐关递进，一轮 100 关不重复。
- **恰到好处的挑战**：每关先看 5 秒完整原画，再上手交换切片；横画横框、竖画竖框，不拉伸、不裁切，原画比例始终忠实。
- **即点即玩的清爽**：无账号、无后端、无广告，纯前端单页，打开即玩、刷新即归零。

### 玩法与特性
- 逐关递进 100 关：第 1–2 关为固定练习（《蒙娜丽莎》《星月夜》），后继关卡从本轮未用名画随机选取、同轮不重复。
- 每次点击交换两块切片，点击已选切片即取消；初始打乱至少 50% 错位。
- 完成瞬间有白光扫过的完成动画，随后展示本关用时与下一关入口。
- 适配大屏 / 中屏 / 移动横屏；竖屏提示旋转设备；尊重系统“减少动态效果”偏好。

### 技术栈
React 18 · TypeScript 5 · Vite 6 · Vitest 3 · React Testing Library

### 快速开始
**线上试玩**：https://game.tututoken.cc

```bash
npm install
npm run dev        # 本地开发
npm run build      # 生产构建
npm test           # 运行测试
```

### 素材与许可
图片素材仅收录**公共领域 / CC0** 授权名画，运行时只读本地资源，无在线图片请求。代码以 MIT 许可发布，详见 [LICENSE](LICENSE)。

### 关于出品人
Made with ❤️ by **Richy** · [X @Richyisaflower](https://x.com/Richyisaflower)

---

## English

### Why we made it
There are plenty of jigsaw games, but most use random stock photos. This one turns **world-famous masterpieces** into something you can play with — van Gogh, da Vinci, Monet, Vermeer — not just art on a wall, but a painting you piece back together yourself. Low effort, high satisfaction, playable in one tap.

### What you get
- **101 masterpieces that never get old**: all public domain / CC0, freely usable, dealt level by level, 100 levels without repeats.
- **Challenge that fits just right**: a 5-second look at the full original, then swap tiles. Landscape uses a landscape frame, portrait a portrait frame — no stretching, no cropping, the original ratio is always faithful.
- **Clean, instant play**: no account, no backend, no ads — a pure single-page app; open to play, refresh to start over.

### Gameplay & features
- Progress through 100 levels: levels 1–2 are fixed practice (*Mona Lisa*, *The Starry Night*), later levels pick at random from unused paintings, no repeats in a round.
- Tap to swap two tiles; tap a selected tile to deselect; the initial shuffle is at least 50% misplaced.
- On completion, a white sweep animation plays, then your time and the next-level button appear.
- Adapts to large, medium, and mobile landscape screens; portrait shows a rotate hint; respects `prefers-reduced-motion`.

### Tech stack
React 18 · TypeScript 5 · Vite 6 · Vitest 3 · React Testing Library

### Quick start
**Play online**: https://game.tututoken.cc

```bash
npm install
npm run dev        # local dev
npm run build      # production build
npm test           # run tests
```

### Assets & license
All artwork is **public domain / CC0**, served read-only from local assets with no online image requests. The code is released under the MIT License — see [LICENSE](LICENSE).

### About the publisher
Made with ❤️ by **Richy** · [X @Richyisaflower](https://x.com/Richyisaflower)

---

<div align="center">Made with ❤️ by Richmond522</div>