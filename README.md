# Waiting Chen · About-me

个人站：**场景 A · 程序员工作室（Studio）** + **场景 B · 交互产品工坊（Craft Lab）** + **场景 C · 城市夜景终端（Skyline Terminal）**，可切换；共享板块内容。

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

- 场景 A：React Three Fiber + drei 真 3D 程序员工作室（书桌、双屏、书架与可点道具；轻量轨道相机）
- 场景 B：Craft Lab 工坊空间（暖灰工作室气质；时间轴台 / 灯箱 / 工作证墙等隐喻）
- 场景 C：Skyline Terminal 城市夜景终端（落地窗城市剪影、窗内控制台、七板块隐喻）；顶栏 A/B/C 切换，场景懒加载
- 共享板块：关于我、经历、作品、项目、文章、爱好、联系（脱敏文案 + 公开 GitHub / Quartz 外链）
- AI 分身：站内知识层 + 关键词 / 意图匹配；建议问题 chips、自由输入、回答可引用并跳转板块；默认离线可用
- 可选 LLM：通过 `VITE_LLM_ENDPOINT` / `VITE_LLM_API_KEY` / `VITE_LLM_MODEL` 预留接口（见 `src/lib/llm-optional.ts`），未配置时不联网
- 真 3D Operator：可切换「旅人」KayKit Rogue GLB（CC0）与「潮玩」自研乙烯程序化形象；三场景复用；Idle / Walk / Sit；点地 A* 寻路 + 走过消除轨迹
- 多套命名配色预设（各场景均跟色）；移动端降 DPR / 少阴影
- 架构：`sceneId` + 共享 `sections`；A/B/C 均为一等场景

## 3D 资源许可

KayKit Operator（「旅人」）：`public/models/operator-kaykit-rogue.glb`；「潮玩」为自研程序化网格（无第二份 GLB）。

| 项 | 内容 |
|----|------|
| 来源 | [KayKit Character Pack: Adventurers](https://kaylousberg.itch.io/kaykit-adventurers) |
| 作者 | [Kay Lousberg](https://kaylousberg.com) |
| 许可 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)（可用于公开 GitHub Pages） |
| 备注 | 详见 `public/models/ATTRIBUTION.md`；本仓库副本已裁剪动画并 Draco/WebP 压缩 |

房间与道具仍为自研程序化几何（drei RoundedBox 等）。

## 未实现（有意延后）

- 空间音效
- 默认启用联网 LLM、小人与分身深度联动
- 足迹地图
- 场景 C 坐下交互（本场景未做椅凳）

## 隐私

对外文案已脱敏：无真名、公司、学校、具体数字。分身只依据站内公开知识作答。
