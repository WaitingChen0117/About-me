# Waiting Chen · About-me

个人站 P0 MVP：**场景 A · Agent 指挥台（Ops Deck）**。

## 预览

### 本地

```bash
npm install
npm run dev
```

因配置了 GitHub Pages 的 `base`，本地请打开：

`http://localhost:5173/About-me/`

生产构建预览：

```bash
npm run build
npm run preview
```

### GitHub Pages

合入 `main` 后，Actions 工作流 `Deploy GitHub Pages` 会自动构建并部署。

- 访问地址：https://waitingchen0117.github.io/About-me/
- 首次需在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**（只需开一次）

## 已实现

- 场景 A：React Three Fiber + drei 真 3D 指挥台（可点物件、轻量轨道相机）
- 共享板块：关于我、经历、作品、项目、文章、爱好、联系（脱敏文案 + 公开 GitHub / Quartz 外链）
- AI 分身：站内知识层（从板块文案维护的 snippets）+ 关键词 / 意图匹配；建议问题 chips、自由输入、回答可引用并跳转板块；默认离线可用
- 可选 LLM：通过 `VITE_LLM_ENDPOINT` / `VITE_LLM_API_KEY` / `VITE_LLM_MODEL` 预留接口（见 `src/lib/llm-optional.ts`），未配置时不联网
- 真 3D 小人：可点、简单走动到目标后打开板块
- 日夜（值班灯 / 全亮）主题切换；移动端降 DPR / 少阴影
- 架构预留 `sceneId` + 共享 `sections`，便于后续加 B/C

## 未实现（有意延后）

- 场景 B（Craft Lab）/ C（Skyline Terminal）切换
- 更精细模型与空间音效
- 默认启用联网 LLM、小人与分身深度联动
- 足迹地图

## 隐私

对外文案已脱敏：无真名、公司、学校、具体数字。分身只依据站内公开知识作答。
