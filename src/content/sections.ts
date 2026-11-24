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
        text: 'Waiting Chen —— 做有界面的系统：控制台、订阅与计费链路、可观测的 Agent 工作台。先把产品交互做扎实，再把 Agent 跑进真实工作流。',
      },
      {
        type: 'paragraph',
        text: '主战场是 React + TypeScript 的复杂 B 端；近期在探索人机审批、Agent Loop、工具与 Trace 如何落成可操作的界面。',
      },
      {
        type: 'tags',
        items: [
          'React',
          'TypeScript',
          'Vite',
          'Next.js',
          'Zustand',
          'Agent Loop',
          'RAG',
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
        type: 'timeline',
        items: [
          {
            period: '近年',
            role: '资深前端 · 公有云 / 大模型控制台',
            focus:
              '订阅与计费产品、推理与体验中心、微前端子应用与组件体系；AI 辅助交付 + 人工质量兜底。',
          },
          {
            period: '此前',
            role: '前端 · ToC / 中台 / 活动页',
            focus:
              '直播营销中台、理赔与 H5 活动、电商活动页与 JSBridge；练过从业务页到中台的完整链路。',
          },
          {
            period: '起点',
            role: '前端实习 → 正式岗',
            focus: '从页面交付走到复杂表单、权限与可观测；栈从 Vue 延伸到 React 体系。',
          },
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
        type: 'cards',
        items: [
          {
            title: 'MiniCut',
            blurb:
              '浏览器内迷你视频编辑器：多轨时间轴、画布预览与导出。用来证明「会做高交互产品界面」。',
            tags: ['React', 'Timeline', 'Canvas'],
            href: 'https://github.com/WaitingChen0117/mini-cut',
          },
          {
            title: 'Collab Table',
            blurb: '基于 Yjs 的多人实时协作表格 demo —— 小体量讲清 CRDT 与同步故事。',
            tags: ['Yjs', 'Realtime'],
            href: 'https://github.com/WaitingChen0117/collab-table-demo',
          },
        ],
      },
    ],
  },
  {
    id: 'projects',
    title: '项目',
    subtitle: '系统向精选 · Agent 与工程深度',
    blocks: [
      {
        type: 'cards',
        items: [
          {
            title: 'agent-workbench',
            blurb:
              'Next.js Agent 工作台：多会话、工具注册、RAG、MCP、人工审批门控、Workflow DAG、Trace 与持久化恢复。旗舰叙事。',
            tags: ['Agent Loop', 'RAG', 'MCP', 'Workflow', 'Trace'],
            href: 'https://github.com/WaitingChen0117/agent-workbench',
          },
          {
            title: 'Full-Stack Music',
            blurb: 'React + Express + Prisma 的全栈音乐 App，补齐前后端一体叙事。',
            tags: ['Express', 'Prisma'],
            href: 'https://github.com/WaitingChen0117/Full-Stack',
          },
        ],
      },
    ],
  },
  {
    id: 'articles',
    title: '文章',
    subtitle: '外链知识库 · 精选入口',
    blocks: [
      {
        type: 'paragraph',
        text: '用数字花园沉淀前端与工程笔记，站点内只挂入口，不复制第二博客首页。',
      },
      {
        type: 'links',
        items: [
          {
            label: '前端数字花园（Quartz）',
            href: 'https://waitingchen0117.github.io/',
            note: 'JS / CSS / Browser / Framework / Engineering',
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
          '用 Agent 辅助做前端原型，再亲手收口交互细节',
          '拆解编辑器 / 控制台类产品的信息架构',
          '偶尔鼓捣桌面环境与房间式交互隐喻（只参考，不套模板）',
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
        type: 'links',
        items: [
          {
            label: 'GitHub · WaitingChen0117',
            href: 'https://github.com/WaitingChen0117',
            note: '作品与实验主要在这里',
          },
        ],
      },
      {
        type: 'paragraph',
        text: '站内不公开私人邮箱与社交账号；需要进一步联系可通过 GitHub Issues / Discussions。',
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
