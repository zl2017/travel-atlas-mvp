# 旅记可视化 / Travel Atlas

一个面向朋友分享的静态旅行路书 MVP。

## 页面

- `index.html`：旅行总入口与可点击地球仪
- `trip.html`：挪威 13 天路书、路线地图、日程、提醒
- `data/norway.js`：公开版行程数据
- `docs/product-brief.md`：产品定位、用户流程和 MVP 验收标准
- `docs/mvp-scope.md`：页面结构、交互和发布方式
- `docs/content-and-privacy.md`：内容来源与脱敏边界
- `docs/v2-design-references.md`：V2 设计参考与地图改造记录
- `outputs/checklist.md`：范围、验收与发布清单

## 隐私边界

仓库只包含公开路线、地点、交通类型、公开提示和页面结构。不要将原始 PDF、预订凭证、个人联系方式、证件、订单号或私人 Obsidian 笔记放入公开仓库。

## 本地预览

这是零构建静态页面。使用任意静态服务器预览，例如：

```bash
python3 -m http.server 4173
```

然后打开 `http://localhost:4173/`。

## GitHub Pages

`.github/workflows/pages.yml` 会在 `main` 分支更新后自动发布静态页面。仓库设置为公开后，页面地址为：

`https://<github-account>.github.io/<repository>/`
