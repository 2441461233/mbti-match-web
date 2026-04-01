import type { SwipedCard } from './types'

type RankedValue = {
  value: string
  score: number
}

export type ReportSummary = {
  total: number
  liked: number
  topMbti: RankedValue | null
  topFaceTag: RankedValue | null
  topColorGroup: RankedValue | null
  topTag: RankedValue | null
  advice: string
}

function inc(map: Map<string, number>, key: string, by: number) {
  map.set(key, (map.get(key) ?? 0) + by)
}

function topOf(map: Map<string, number>): RankedValue | null {
  let best: RankedValue | null = null
  for (const [value, score] of map.entries()) {
    if (!best || score > best.score) best = { value, score }
  }
  return best
}

function adviceFor(colorGroup: string | null): string {
  if (!colorGroup) return '多聊几个人，你的偏好画像会更清晰。'
  if (colorGroup.startsWith('紫人')) return '沟通建议：你更吃“直球对决”和“高密度信息”。优先看对方是否清晰、有主见、能给确定性。'
  if (colorGroup.startsWith('绿人')) return '沟通建议：你更吃“情绪共鸣”和“被理解”。优先看对方是否会倾听、会确认你的感受。'
  if (colorGroup.startsWith('黄人')) return '沟通建议：你更吃“行动力”和“新鲜感”。优先看对方是否愿意一起做事、一起体验。'
  return '沟通建议：先从“表达偏好”开始，比如你更喜欢直球还是温柔。'
}

export function computeReport(swipedCards: SwipedCard[]): ReportSummary {
  const total = swipedCards.length
  const liked = swipedCards.filter(s => s.liked).length

  const mbti = new Map<string, number>()
  const faceTag = new Map<string, number>()
  const colorGroup = new Map<string, number>()
  const tags = new Map<string, number>()

  for (const s of swipedCards) {
    const w = s.liked ? 2 : 1
    inc(mbti, s.persona.mbti, w)
    inc(faceTag, s.persona.faceTag, w)
    inc(colorGroup, s.persona.mbtiColorGroup, w)
    for (const t of s.persona.tags) inc(tags, t, w)
  }

  const topMbti = topOf(mbti)
  const topFaceTag = topOf(faceTag)
  const topColorGroup = topOf(colorGroup)
  const topTag = topOf(tags)

  return {
    total,
    liked,
    topMbti,
    topFaceTag,
    topColorGroup,
    topTag,
    advice: adviceFor(topColorGroup?.value ?? null),
  }
}
