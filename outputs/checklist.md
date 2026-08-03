# 旅记可视化 MVP Checklist

## 目标与范围

- [x] 一次性旅行路书，而不是复杂的行程录入系统
- [x] 面向朋友分享
- [x] 静态页面，可重新生成和部署
- [x] 手机和电脑网页兼容
- [x] 公开版本不包含个人联系方式、证件、订单号、预订凭证或私人文件

## 当前行程数据

- [x] 使用 `🇳🇴 挪威13天完整行程--真实版.pdf` 作为当前唯一来源
- [x] 行程时间：2026-09-24 — 2026-10-06
- [x] 13 天、4 人
- [x] 北线：特罗姆瑟 → Senja → 罗弗敦 → 特罗姆瑟
- [x] 南线：卑尔根 → Flåm/Aurland → Skei/Jølster → Geiranger → Sunndalsøra → Rondane → Oslo → Stockholm
- [x] 9/26 固定使用 Plan A：Gryllefjord → Andenes 轮渡 → Svolvær
- [x] 保留交通类型：航班、自驾、轮渡、公共交通、步行
- [x] 保留可选/提醒状态，不把“天气允许”“视体力”等条件伪装成确定安排

## MVP 页面

- [x] 总入口页：可视化地球仪
- [x] 地球仪标记当前旅记入口
- [x] 点击挪威标记进入单次路书
- [x] 路书页：北线/南线路线总览
- [x] 路书页：OpenStreetMap 路线地图
- [x] 路书页：13 天可切换日程
- [x] 日程卡片支持拖拽排序
- [x] 拖拽排序保存在当前设备 localStorage
- [x] 每日提醒支持勾选并保存在当前设备
- [x] 地图支持拖拽、缩放和地点提示
- [x] 页面包含滚动进入动画、地球仪浮动、路线视觉层和毛玻璃/梦幻视觉
- [x] 提供公开版边界说明

## 产品与本地验收

- [x] 产品定位、用户流程和 MVP 验收文档：`docs/product-brief.md`
- [x] 页面结构、交互和发布方式文档：`docs/mvp-scope.md`
- [x] 内容来源与隐私边界文档：`docs/content-and-privacy.md`
- [x] JavaScript 语法检查通过
- [x] 本地浏览器验证 13 天内容、Plan A、地图和提醒交互
- [x] 代码路径为纯英文：`travel-atlas-mvp`

## GitHub Pages 发布

- [x] GitHub CLI 重新认证成功，并补充 `workflow` 权限
- [x] 创建独立公开仓库：`https://github.com/zl2017/travel-atlas-mvp`
- [x] 只推送公开页面文件
- [x] 不推送原始 PDF、Obsidian 私人笔记、预订凭证和个人信息
- [x] 推送 `index.html`、`trip.html`、`data/`、`styles.css`、`app.js`
- [x] 开启 GitHub Pages，并使用 Actions 自动发布
- [x] 公开首页访问验证通过
- [x] 公开路书页验证通过：13 天、地图、Plan A、6 条提醒
- [x] GitHub Pages URL：`https://zl2017.github.io/travel-atlas-mvp/`

## V2 视觉与地图迭代

- [x] 参考公开旅行网页与互动地图案例，形成设计记录
- [x] 地图升级为暗色底图与路线剧场布局
- [x] 增加全程 / 北线 / 南线路线筛选
- [x] 增加编号站点、交通符号、路线检查面板和当前日高亮
- [x] 地图使用 Leaflet + 免费 OpenStreetMap / CARTO Voyager，支持拖拽缩放和地点弹窗
- [x] 地图采用接近视口后初始化、缩放结束后更新瓦片的加载优化
- [x] 13 天行程的 34 个去重经纬度均生成地图地点标记
- [x] 完成公开地址的 V2 交互验证并重新部署

## 下一版增强

- [ ] 总入口加入更多历史旅行点位
- [ ] 每个旅记独立的素材索引和照片墙
- [ ] 从 Obsidian 自动读取/生成旅记数据
- [ ] 补入公开照片与章节封面
- [ ] 每个地点增加真实的外部地图/官方预约链接
- [ ] 添加 Markdown/打印版攻略导出
