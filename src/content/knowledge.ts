import {
  sectionById,
  type Section,
  type SectionBlock,
  type SectionId,
} from './sections'

/** Coarse intents the offline matcher understands. */
export type AvatarIntent =
  | 'about'
  | 'experience'
  | 'works'
  | 'projects'
  | 'agent'
  | 'articles'
  | 'hobbies'
  | 'contact'
  | 'stack'

export type KnowledgeSnippet = {
  id: string
  /** Section to cite / open when this snippet wins. */
  sectionId: SectionId
  /** Short citation label shown in chat (usually section title). */
  citation: string
  /** Reply body — kept in sync with section narrative, privacy-safe. */
  answer: string
  keywords: string[]
  intents: AvatarIntent[]
  /** Higher = preferred when scores tie. */
  weight?: number
}

function blockPlain(block: SectionBlock): string {
  switch (block.type) {
    case 'paragraph':
      return block.text
    case 'list':
      return block.items.join('；')
    case 'tags':
      return block.items.join('、')
    case 'cards':
      return block.items
        .map((c) => `${c.title}：${c.blurb}${c.tags?.length ? `（${c.tags.join('、')}）` : ''}`)
        .join(' ')
    case 'timeline':
      return block.items
        .map((t) => `${t.period} · ${t.role}：${t.focus}`)
        .join(' ')
    case 'links':
      return block.items
        .map((l) => `${l.label}${l.note ? `（${l.note}）` : ''}`)
        .join('；')
    default:
      return ''
  }
}

/** Flatten a section into searchable plain text (for keyword seeding). */
export function sectionPlainText(section: Section): string {
  return [section.title, section.subtitle, ...section.blocks.map(blockPlain)]
    .filter(Boolean)
    .join('\n')
}

function cardTitles(sectionId: SectionId): string[] {
  const section = sectionById[sectionId]
  const titles: string[] = []
  for (const block of section.blocks) {
    if (block.type === 'cards') {
      for (const item of block.items) titles.push(item.title)
    }
  }
  return titles
}

function tagItems(sectionId: SectionId): string[] {
  const section = sectionById[sectionId]
  for (const block of section.blocks) {
    if (block.type === 'tags') return block.items
  }
  return []
}

/**
 * Site knowledge layer — curated answers grounded in `sections`.
 * When section copy changes, revisit answers here so the twin stays aligned.
 */
export const knowledgeSnippets: KnowledgeSnippet[] = [
  {
    id: 'about-who',
    sectionId: 'about',
    citation: sectionById.about.title,
    answer:
      '我是 Waiting Chen 的站内分身，回答仅基于本站公开文案（离线知识层，默认不调联网模型）。本人资深前端，现于某大厂负责云计算 / 大模型公有云控制台；主线是复杂 B 端与产品交互，Agent 为第二曲线。详见「关于我」。',
    keywords: [
      '你是谁',
      '关于',
      '介绍',
      '简介',
      'waiting',
      'chen',
      '前端',
      '工程师',
      '大厂',
      '控制台',
      'who',
      'about',
    ],
    intents: ['about'],
    weight: 3,
  },
  {
    id: 'about-stack',
    sectionId: 'about',
    citation: sectionById.about.title,
    answer: `主栈 React + TypeScript。B 端常见搭配：Vite、Zustand、Ant Design、微前端、ECharts；Agent 侧碰过 Next.js、Agent Loop、RAG、MCP、Workflow。标签在「关于我」：${tagItems('about').slice(0, 8).join('、')} 等。`,
    keywords: [
      '技术栈',
      '栈',
      'react',
      'typescript',
      'vite',
      'zustand',
      'antd',
      '微前端',
      'echarts',
      'next',
      'stack',
      'skill',
      '技能',
    ],
    intents: ['stack', 'about'],
    weight: 2,
  },
  {
    id: 'experience',
    sectionId: 'experience',
    citation: sectionById.experience.title,
    answer:
      '近年在某大厂做订阅与计费、推理与体验中心、微前端子应用与组件库；此前做过直播中台、理赔 H5、电商活动页；更早有 Vue 中后台与早期 AI 平台。雇主全称与具体数字已脱敏，完整时间线在「经历」。',
    keywords: [
      '经历',
      '履历',
      '做过',
      '工作',
      '职业',
      '计费',
      '订阅',
      '推理',
      '微前端',
      '实习',
      'experience',
      'career',
      '简历',
    ],
    intents: ['experience'],
    weight: 3,
  },
  {
    id: 'works',
    sectionId: 'works',
    citation: sectionById.works.title,
    answer: `视觉与交互向先看：${cardTitles('works')
      .map((t) => (t === 'MiniCut' ? 'MiniCut（浏览器多轨视频编辑器）' : t === 'Collab Table' ? 'Collab Table（Yjs 实时协作表格）' : t))
      .join('；')}。偏产品感；系统深度在「项目」。`,
    keywords: [
      '作品',
      '好看',
      'minicut',
      '编辑器',
      '视频',
      '时间轴',
      'collab',
      'yjs',
      '协作',
      '表格',
      'demo',
      'works',
      'portfolio',
    ],
    intents: ['works'],
    weight: 3,
  },
  {
    id: 'projects',
    sectionId: 'projects',
    citation: sectionById.projects.title,
    answer: `系统向公开仓：${cardTitles('projects').join('、')}。旗舰是 agent-workbench（对话、工具、RAG、审批、Workflow、Trace）；Full-Stack Music 补前后端一体叙事。职场侧控制台已脱敏写在「经历」。`,
    keywords: [
      '项目',
      '工程',
      '全栈',
      'music',
      'prisma',
      'express',
      'github',
      '仓库',
      'projects',
      'repo',
    ],
    intents: ['projects'],
    weight: 2,
  },
  {
    id: 'agent',
    sectionId: 'projects',
    citation: sectionById.projects.title,
    answer:
      'Agent 旗舰是 agent-workbench：多会话、工具注册与 Agent Loop、RAG、MCP、人工审批门控、Workflow DAG、Trace 与持久化恢复。叙事上先产品力，再展开 Agent——链接在「项目」。',
    keywords: [
      'agent',
      'rag',
      'mcp',
      'workflow',
      'trace',
      '审批',
      '工作台',
      'workbench',
      'loop',
      '工具',
      '智能体',
    ],
    intents: ['agent', 'projects'],
    weight: 4,
  },
  {
    id: 'articles',
    sectionId: 'articles',
    citation: sectionById.articles.title,
    answer:
      '有 Quartz 数字花园：Frontend / Framework / Engineering 等主题地图。站内「文章」只挂入口，正文在知识库，不复制第二博客首页。',
    keywords: [
      '文章',
      '博客',
      '笔记',
      'quartz',
      '数字花园',
      'moc',
      '写作',
      '知识库',
      'articles',
      'blog',
    ],
    intents: ['articles'],
    weight: 3,
  },
  {
    id: 'hobbies',
    sectionId: 'hobbies',
    citation: sectionById.hobbies.title,
    answer:
      '喜欢用 Agent 搭原型再亲手收口交互；拆解编辑器 / 控制台 / 计费类产品的状态边界；在公开仓迭代 agent-workbench；偶尔鼓捣房间式交互隐喻（只参考不套模板）。更多侧面在「爱好」。',
    keywords: ['爱好', '兴趣', '业余', '侧面', 'hobby', 'hobbies', '喜欢'],
    intents: ['hobbies'],
    weight: 2,
  },
  {
    id: 'contact',
    sectionId: 'contact',
    citation: sectionById.contact.title,
    answer:
      '公开渠道走 GitHub：WaitingChen0117（Issues / Discussions 均可）。站内不公开私人邮箱与社交账号；也可看 About-me 仓库与数字花园入口。',
    keywords: [
      '联系',
      '邮箱',
      '邮件',
      'github',
      'issue',
      'discussions',
      'contact',
      '怎么找',
      '微信',
      '社交',
    ],
    intents: ['contact'],
    weight: 3,
  },
]

export const knowledgeById = Object.fromEntries(
  knowledgeSnippets.map((s) => [s.id, s]),
) as Record<string, KnowledgeSnippet>

/** Suggestion chips — short questions that hit the knowledge matcher. */
export const suggestionChips: { id: string; label: string }[] = [
  { id: 'who', label: '你是谁？' },
  { id: 'experience', label: '经历概览' },
  { id: 'works', label: '代表作品' },
  { id: 'agent', label: 'Agent 方向' },
  { id: 'stack', label: '技术栈' },
  { id: 'notes', label: '文章 / 笔记' },
  { id: 'contact', label: '联系方式' },
]
