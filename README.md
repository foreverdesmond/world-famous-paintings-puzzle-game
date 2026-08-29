# 🎨 世界名画拼图小游戏

一个把世界名画做成拼图的小游戏：通过滑片 / 旋转 / 限时 / 步数等玩法还原名画。核心价值是「低门槛、高完成感」——快速做出能玩的作品。

## 状态

**开发中（第一版）** · 图片素材库已就绪（101 幅公共领域/CC0 世界名画）。

## 当前进度

- ✅ 素材库：`assets/paintings/` 收录 101 幅世界名画的中分辨率缩略图 + 完整来源清单（`manifest.csv`）
- ⏳ 玩法：拼图规则与游戏页面开发中
- ✅ 技术栈：Vite + React + TypeScript + Vitest + React Testing Library
- ⏳ MVP 可玩版本待开发

## 素材库

图片全部来自**开放数据 API**，只收录公共领域 / CC0 授权，可自由使用。详见 [assets/paintings/README.md](assets/paintings/README.md)。

- 100 幅来自 Wikimedia Commons（95 Public domain / 5 CC0）
- 1 幅来自 The Metropolitan Museum of Art（CC0）

## 本地开发

```bash
npm install
npm run dev
```

常用验证命令：`npm run typecheck`、`npm run build`、`npm test`。

项目是无后端的单页前端；游戏状态仅存在于当前会话，不接入账号、分析或在线图片服务。

## 许可证

图片素材均为公共领域 / CC0；代码许可证待定。
