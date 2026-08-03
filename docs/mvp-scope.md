# MVP 范围与技术说明

## 页面结构

| 页面 | 作用 |
| --- | --- |
| `index.html` | 旅行总入口、地球仪、旅记卡片 |
| `trip.html` | 单次旅记、地图、日程、提醒 |
| `data/norway.js` | 公开版结构化行程数据 |
| `outputs/checklist.md` | 需求、验收和发布清单 |

## 交互

- 地球仪标记和旅记卡片：进入旅记。
- 日程导航：切换天数并让地图聚焦当日路线。
- 日程列表：拖拽排序，排序写入浏览器 `localStorage`。
- 提醒清单：勾选状态写入浏览器 `localStorage`。
- Leaflet + OpenStreetMap：提供公开地图、缩放和拖拽能力。

## 发布方式

这是无构建步骤的静态站点。GitHub Actions 将仓库根目录作为 Pages 静态产物，发布到：

`https://<github-account>.github.io/<repository>/`

页面依赖公开 CDN 的 Leaflet 和公开地图瓦片；如果未来需要完全离线访问，应将这些依赖替换为仓库内资源或离线地图方案。

## 数据更新方式

下一次行程更新时，先更新 `data/<trip>.js`，再同步更新页面文案和 `outputs/checklist.md`，本地验证后重新推送。正式公开版本只保留经过脱敏的地点、日期、交通类型和分享所需提示。

