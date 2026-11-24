# Waiting Chen · About-me

个人站 P0 MVP：**场景 A · Agent 指挥台（Ops Deck）**。

## 预览

```bash
npm install
npm run dev
```

浏览器打开终端提示的本地地址（默认 `http://localhost:5173`）。

生产构建：

```bash
npm run build
npm run preview
```

## 已实现

- 场景 A：2.5D/CSS 指挥台，可点物件打开板块
- 共享板块：关于我、经历、作品、项目、文章、爱好、联系
- AI 分身：中央对话舱 + 预设问答
- 可交互小人：可点、简单走动到板块
- 日夜（值班灯 / 全亮）主题切换
- 架构预留 `sceneId` + 共享 `sections`，便于后续加 B/C

## 未实现（有意延后）

- 场景 B（Craft Lab）/ C（Skyline Terminal）切换
- 真·3D（R3F）模型与空间音效
- 联网 LLM 分身、小人与分身深度联动
- 足迹地图

## 隐私

对外文案已脱敏：无真名、公司、学校、具体数字。
