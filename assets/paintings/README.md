# 世界名画图片库

本目录是《世界名画拼图小游戏》的图片素材库，共 **101 幅**世界名画的中分辨率缩略图（长边约 1920px，JPEG），配套 `manifest.csv` 记录每幅作品的完整来源信息。

## 使用规范（重要）

- **全部为公共领域 / CC0 授权**，可自由用于游戏、界面、教学等（CC0 无需署名，但界面或 README 标明来源更专业）。
- 只收录明确标记为 **Public domain** 或 **CC0** 的图片；非公共领域（如 `cc-by-sa`）的文件一律跳过，绝不收录未授权网站截图。
- 请勿直接从 Google 图片、Pinterest、普通壁纸站取图——原画虽入公共领域，但该网站高清扫描图可能存在独立使用条款。

## 来源分布

| 来源 | 数量 | 许可证 |
|---|---|---|
| Wikimedia Commons | 100 | 95 张 Public domain、5 张 CC0 |
| The Metropolitan Museum of Art | 1 | CC0（Met Open Access）|

（其他可用官源：Art Institute of Chicago、Cleveland Museum of Art，均 CC0，供后续补充。）

## 文件结构

- `manifest.csv` —— 元数据清单：`title / artist / institution / licence / page_url / image_url / file / jpeg_bytes`
- `*.jpg` —— 缩略图，命名 `作品名__画家.jpg`

## 重新生成 / 补充

如需重新下载或补充名画，运行：

```bash
python3 tools/fetch_paintings.py
```

脚本内置四源回退（Met → Chicago → Cleveland → Commons），只收公共领域/CC0，带限流退避与硬超时看门狗，**幂等**（已存在文件自动跳过）。
新增作品编辑 `tools/curated_list.json`。