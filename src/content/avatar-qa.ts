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
      '我是 Waiting Chen 的站内分身。本人是前端工程师，做复杂 B 端与 AI 产品界面，业余把 Agent 跑进工作台。想看故事可以从「关于我」开始。',
    openSection: 'about',
  },
  {
    id: 'works',
    question: '有什么好看的作品？',
    answer:
      '视觉向先看 MiniCut（浏览器视频编辑器）；想看实时协作可以点 Collab Table。作品区偏产品感，系统深度在项目区。',
    openSection: 'works',
  },
  {
    id: 'agent',
    question: 'Agent 相关做什么？',
    answer:
      '旗舰是 agent-workbench：对话、工具、RAG、审批门控、Workflow 与 Trace。叙事上先产品力，再展开 Agent 工程。',
    openSection: 'projects',
  },
  {
    id: 'stack',
    question: '技术栈是什么？',
    answer:
      '主栈 React + TypeScript；B 端控制台、微前端与组件库；Agent 侧用过 Next.js、Vercel AI SDK、MCP 与 Workflow。细节在「关于我」标签里。',
    openSection: 'about',
  },
  {
    id: 'contact',
    question: '怎么联系？',
    answer:
      '公开渠道走 GitHub：WaitingChen0117。站内不留私人邮箱。',
    openSection: 'contact',
  },
]
