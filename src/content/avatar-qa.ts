export type AvatarQA = {
  id: string
  question: string
  answer: string
  /** optional section to open after answering */
  openSection?: import('./sections').SectionId
}

export const avatarPresets: AvatarQA[] = [
  {
    id: 'who',
    question: '你是谁？',
    answer:
      '我是 Waiting Chen 的站内分身（预设问答，非联网模型）。本人是前端工程师，现于某大厂做公有云 / 大模型控制台；主线是复杂 B 端与产品交互，Agent 是第二曲线。细节在「关于我」。',
    openSection: 'about',
  },
  {
    id: 'experience',
    question: '做过什么？',
    answer:
      '近年在某大厂做订阅计费、推理体验、微前端与组件库；此前做过直播中台、理赔 H5、活动页。雇主名与具体数字已脱敏，时间线在「经历」。',
    openSection: 'experience',
  },
  {
    id: 'works',
    question: '有什么好看的作品？',
    answer:
      '先看产品感：MiniCut 是浏览器视频编辑器（多轨时间轴 + 画布导出）；Collab Table 用 Yjs 讲实时协作。都链到公开 GitHub，在「作品」里。',
    openSection: 'works',
  },
  {
    id: 'agent',
    question: 'Agent 相关做什么？',
    answer:
      '旗舰是 agent-workbench：对话、工具、RAG、审批门控、Workflow 与 Trace，还能跨重启恢复。叙事上先产品力，再展开 Agent——「项目」区有链接。',
    openSection: 'projects',
  },
  {
    id: 'stack',
    question: '技术栈是什么？',
    answer:
      '主栈 React + TypeScript；B 端用 Vite、Zustand、Ant Design、微前端与 ECharts。Agent 侧是 Next.js、RAG、MCP、Workflow。标签在「关于我」。',
    openSection: 'about',
  },
  {
    id: 'notes',
    question: '有写文章吗？',
    answer:
      '有数字花园（Quartz）：Frontend / Framework / Engineering 等主题地图。站内「文章」只挂入口，正文在知识库。',
    openSection: 'articles',
  },
  {
    id: 'contact',
    question: '怎么联系？',
    answer:
      '公开渠道走 GitHub：WaitingChen0117。可用 Issues / Discussions；站内不留私人邮箱。',
    openSection: 'contact',
  },
]
