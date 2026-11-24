import {
  knowledgeSnippets,
  type AvatarIntent,
  type KnowledgeSnippet,
} from '../content/knowledge'
import type { SectionId } from '../content/sections'

export type MatchResult = {
  answer: string
  openSection?: SectionId
  citation?: string
  snippetId?: string
  /** true when no confident hit — used for softer UI copy */
  isFallback: boolean
}

const INTENT_PATTERNS: Record<AvatarIntent, RegExp[]> = {
  about: [/关于(?:我|你)?/, /你是谁/, /简介/, /介绍一下/, /自我介绍/, /\bwho\b/i, /\babout\b/i],
  experience: [/经历/, /履历/, /做过什么/, /工作经历/, /职业/, /简历/, /\bexperience\b/i, /\bcareer\b/i],
  works: [/作品/, /好看/, /portfolio/i, /\bworks?\b/i, /minicut/i, /编辑器/, /协作表格/],
  projects: [/项目/, /工程深度/, /\bprojects?\b/i, /全栈/, /music/i],
  agent: [/\bagent\b/i, /\brag\b/i, /\bmcp\b/i, /workflow/i, /工作台/, /审批/, /智能体/, /workbench/i],
  articles: [/文章/, /博客/, /笔记/, /数字花园/, /quartz/i, /\bmoc\b/i, /\bblog\b/i],
  hobbies: [/爱好/, /兴趣/, /业余/, /\bhobb/i],
  contact: [/联系/, /邮箱/, /邮件/, /怎么找/, /微信/, /\bcontact\b/i, /\bgithub\b/i, /issue/i],
  stack: [/技术栈/, /用什么(?:技术|栈)/, /技能/, /\bstack\b/i, /\breact\b/i, /typescript/i],
}

function normalize(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .replace(/[？?！!。．，,、·…~～]/g, ' ')
    .replace(/\s+/g, ' ')
}

function detectIntents(q: string): AvatarIntent[] {
  const hits: AvatarIntent[] = []
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS) as [AvatarIntent, RegExp[]][]) {
    if (patterns.some((re) => re.test(q))) hits.push(intent)
  }
  return hits
}

function keywordScore(q: string, snippet: KnowledgeSnippet): number {
  let score = 0
  for (const kw of snippet.keywords) {
    const needle = kw.toLowerCase()
    if (!needle) continue
    if (q.includes(needle)) {
      // Longer keywords are more specific.
      score += Math.min(4, Math.max(1, Math.round(needle.length / 2)))
    }
  }
  return score
}

function intentScore(intents: AvatarIntent[], snippet: KnowledgeSnippet): number {
  let score = 0
  for (const intent of intents) {
    if (snippet.intents.includes(intent)) score += 5
  }
  return score
}

const FALLBACK_ANSWER =
  '这块站内知识还没盖到。你可以问问「关于 / 经历 / 作品 / 项目 / Agent / 文章 / 联系」，或点下面的建议问题；也可以直接点场景里的物件打开对应板块。'

/**
 * Offline matcher: keyword overlap + coarse intent.
 * Returns the best snippet, or a natural fallback.
 */
export function matchKnowledge(rawQuery: string): MatchResult {
  const q = normalize(rawQuery)
  if (!q) {
    return { answer: FALLBACK_ANSWER, isFallback: true }
  }

  const intents = detectIntents(rawQuery)
  let best: { snippet: KnowledgeSnippet; score: number } | null = null

  for (const snippet of knowledgeSnippets) {
    const score =
      keywordScore(q, snippet) + intentScore(intents, snippet) + (snippet.weight ?? 0) * 0.1
    if (!best || score > best.score) {
      best = { snippet, score }
    }
  }

  // Require a meaningful hit (intent or keywords), not weight alone.
  const confident =
    best &&
    best.score >= 3 &&
    (keywordScore(q, best.snippet) > 0 || intentScore(intents, best.snippet) > 0)

  if (!confident || !best) {
    return { answer: FALLBACK_ANSWER, isFallback: true }
  }

  const { snippet } = best
  return {
    answer: snippet.answer,
    openSection: snippet.sectionId,
    citation: snippet.citation,
    snippetId: snippet.id,
    isFallback: false,
  }
}
