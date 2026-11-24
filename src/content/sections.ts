export type SectionId =
  | 'about'
  | 'experience'
  | 'works'
  | 'projects'
  | 'articles'
  | 'hobbies'
  | 'contact'

export type SectionBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'tags'; items: string[] }
  | {
      type: 'cards'
      items: {
        title: string
        blurb: string
        tags?: string[]
        href?: string
      }[]
    }
  | {
      type: 'timeline'
      items: { period: string; role: string; focus: string }[]
    }
  | {
      type: 'links'
      items: { label: string; href: string; note?: string }[]
    }

export type Section = {
  id: SectionId
  title: string
  subtitle: string
  blocks: SectionBlock[]
}

/** Shared content layer — scene-agnostic. Scenes only map objects → section ids. */
export const sections: Section[] = [
  {
    id: 'about',
    title: '关于我',
    subtitle: '前端工程师 · 复杂 B 端与 AI 产品界面',
    blocks: [
      {
        type: 'paragraph',
        text: 'Waiting Chen —— 多年前端，现于某大厂做云计算 / 大模型公有云控制台。主战场是 React + TypeScript 的复杂 B 端：订阅与计费、推理与体验、微前端子应用与组件体系。',
      },
      {
        type: 'paragraph',
        text: '叙事顺序很明确：先把产品交互与工程交付做扎实，再把 Agent 跑进真实工作流——人机审批、工具调用、Workflow 与可观测 Trace，最终都要落成可操作的界面。',
      },
      {
        type: 'paragraph',
        text: '对外只谈角色、领域与公开作品；真名、雇主全称、学校与具体量化指标默认不出现在本站。',
      },
      {
        type: 'tags',
        items: [
          'React',
          'TypeScript',
          'Vite',
          'Next.js',
          'Zustand',
          'Ant Design',
          '微前端',
          'ECharts',
          'Agent Loop',
          'RAG',
          'MCP',
          'Workflow',
        ],
      },
    ],
  },
  {
    id: 'experience',
    title: '经历',
    subtitle: '脱敏时间线 · 角色与领域，不写雇主名',
    blocks: [
      {
        type: 'paragraph',
        text: '下面只保留「在什么问题上花过力气」。公司名、客户品牌与人头数字一律省略；具体产品名用类型描述代替。',
      },
      {
        type: 'timeline',
        items: [
          {
            period: '近年 · 某大厂',
            role: '资深前端 · 公有云 / 大模型控制台',
            focus:
              '订阅与计费全链路（首购·续费·升级·多端）、推理与体验中心、资源运营大盘；微前端子应用从 0 到 1、企业级组件库贡献；工作方式上 AI 辅助实现 + 人工方案与质量兜底。',
          },
          {
            period: '此前',
            role: '前端 · ToC / 中台 / 活动页',
            focus:
              '直播营销中台、理赔与 H5 活动、电商活动页与 JSBridge；从业务页走到权限、会话与可观测的完整链路。',
          },
          {
            period: '更早',
            role: '前端 · Vue 中后台与早期 AI 平台',
            focus:
              '训练·部署类控制台与行业定制页；栈从 Vue 延伸到 React 体系，习惯把复杂表单与状态边界先理清。',
          },
          {
            period: '起点',
            role: '前端实习 → 正式岗',
            focus: '从页面交付走到工程规范、类型化接口与可维护的组件边界。',
          },
        ],
      },
      {
        type: 'list',
        items: [
          '代表问题类型：计费边界与折扣策略的前端表达；重表单 + 流式/JSON 参数；ECharts + 复杂表格与导出；Canvas / fabric 蒙版编辑',
          '工程厚度：Monorepo 域交付、类型化 API 层、埋点与可观测、权限与会话打通',
          '进行中的第二曲线：Agent · RAG · Workflow 工具链（公开实验见「项目」）',
        ],
      },
    ],
  },
  {
    id: 'works',
    title: '作品',
    subtitle: '视觉与交互向精选 · 先看产品感',
    blocks: [
      {
        type: 'paragraph',
        text: '这一区优先证明「会做高交互产品界面」。系统深度与 Agent 工程放在「项目」；点卡片可跳到公开 GitHub。',
      },
      {
        type: 'cards',
        items: [
          {
            title: 'MiniCut',
            blurb:
              '浏览器内迷你视频编辑器：素材库 · 预览 · 属性 · 多轨时间轴四区布局，支持裁剪、分割、文字层与画布导出。一眼能看出交互与信息架构。',
            tags: ['React', 'TypeScript', 'Zustand', 'Timeline', 'Canvas'],
            href: 'https://github.com/WaitingChen0117/mini-cut',
          },
          {
            title: 'Collab Table',
            blurb:
              '基于 Yjs 的多人实时协作表格 demo —— 体量小、故事清晰：CRDT 同步与多端一致，适合讲「协作前端」这一刀。',
            tags: ['Yjs', 'Realtime', 'CRDT'],
            href: 'https://github.com/WaitingChen0117/collab-table-demo',
          },
        ],
      },
    ],
  },
  {
    id: 'projects',
    title: '项目',
    subtitle: '系统向精选 · 产品力之后再展开 Agent',
    blocks: [
      {
        type: 'paragraph',
        text: '公开仓以自研实验为主。职场侧的订阅计费、推理控制台、组件库等已脱敏写在「经历」，此处不重复挂外链。',
      },
      {
        type: 'cards',
        items: [
          {
            title: 'agent-workbench',
            blurb:
              'Next.js Agent 工作台：多会话对话、工具注册与 Agent Loop、RAG、MCP、人工审批门控、Workflow DAG、Trace 与 SQLite 持久化恢复。从「能调模型」走到「可观测、可审批、可恢复」的运行时——站点叙事的旗舰。',
            tags: ['Next.js', 'Agent Loop', 'RAG', 'MCP', 'Workflow', 'Trace'],
            href: 'https://github.com/WaitingChen0117/agent-workbench',
          },
          {
            title: 'Full-Stack Music',
            blurb:
              'React + Express + Prisma + PostgreSQL 的全栈音乐 App（暗色 UI、歌词同步）。补齐「前后端一体」叙事，偏练习向，作次要卡片。',
            tags: ['React', 'Express', 'Prisma', 'PostgreSQL'],
            href: 'https://github.com/WaitingChen0117/Full-Stack',
          },
        ],
      },
    ],
  },
  {
    id: 'articles',
    title: '文章',
    subtitle: '外链数字花园 · 精选入口',
    blocks: [
      {
        type: 'paragraph',
        text: '用 Quartz 知识库沉淀前端与工程笔记。站内只挂入口与主题地图，不复制第二博客首页。',
      },
      {
        type: 'links',
        items: [
          {
            label: '前端数字花园（首页）',
            href: 'https://waitingchen0117.github.io/',
            note: '知识地图总览',
          },
          {
            label: 'Frontend MOC',
            href: 'https://waitingchen0117.github.io/01-MOC/Frontend-MOC',
            note: '前端知识体系总入口',
          },
          {
            label: 'Framework MOC',
            href: 'https://waitingchen0117.github.io/01-MOC/Framework-MOC',
            note: 'React / Vue 原理与生态',
          },
          {
            label: 'Engineering MOC',
            href: 'https://waitingchen0117.github.io/01-MOC/Engineering-MOC',
            note: '构建、性能、测试、CI/CD',
          },
        ],
      },
    ],
  },
  {
    id: 'hobbies',
    title: '爱好',
    subtitle: '非简历化的侧面',
    blocks: [
      {
        type: 'list',
        items: [
          '用 Agent 辅助搭前端原型，再亲手收口交互细节与信息架构',
          '拆解编辑器、控制台、订阅计费类产品的状态边界与异常路径',
          '在公开仓里迭代 agent-workbench：审批门控、Workflow、Trace 与持久化',
          '偶尔鼓捣桌面环境与房间式交互隐喻（只作参考，不套模板）',
          '把学过的东西写进数字花园，而不是堆在私有笔记里',
        ],
      },
    ],
  },
  {
    id: 'contact',
    title: '联系',
    subtitle: '公开渠道',
    blocks: [
      {
        type: 'paragraph',
        text: '欢迎看代码、提 Issue，或就 Agent / 复杂 B 端前端交流。私人邮箱与社交账号不在站内公开。',
      },
      {
        type: 'links',
        items: [
          {
            label: 'GitHub · WaitingChen0117',
            href: 'https://github.com/WaitingChen0117',
            note: '作品、实验与本站源码',
          },
          {
            label: 'About-me 仓库',
            href: 'https://github.com/WaitingChen0117/About-me',
            note: '本站工程 · Issues / Discussions',
          },
          {
            label: '前端数字花园',
            href: 'https://waitingchen0117.github.io/',
            note: '笔记与主题地图',
          },
        ],
      },
    ],
  },
]

export const sectionById = Object.fromEntries(
  sections.map((s) => [s.id, s]),
) as Record<SectionId, Section>

export const SECTION_ORDER: SectionId[] = [
  'about',
  'experience',
  'works',
  'projects',
  'articles',
  'hobbies',
  'contact',
]
