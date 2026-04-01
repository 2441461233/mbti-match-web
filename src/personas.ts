import type { Persona } from './types'

export const PERSONAS: Persona[] = [
  {
    id: '1',
    mbti: 'ENTJ',
    avatar: 'https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=800&q=80',
    signature: '别跟我讲感觉，告诉我你的方案。',
    tags: ['慕强', '搞钱', '效率至上'],
    description: '指挥官：天生的领导者，充满魅力和自信。极其理性，有时会显得缺乏共情能力。',
    color: 'from-violet-400 to-fuchsia-400',
    gradient: 'bg-gradient-to-br from-[#FF0080] to-[#7928CA]',
    faceTag: '清冷禁欲系',
    mbtiColorGroup: '紫人 (理性/分析)',
  },
  {
    id: '2',
    mbti: 'INFP',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
    signature: '今天云朵的形状，好像一只在笑的猫。',
    tags: ['emo', '浪漫', '敏感'],
    description: '调停者：真正的理想主义者。内心世界丰富，极其渴望深度的情感连接。',
    color: 'from-emerald-300 to-cyan-400',
    gradient: 'bg-gradient-to-br from-[#00DFD8] to-[#007CF0]',
    faceTag: '文艺破碎感',
    mbtiColorGroup: '绿人 (理想/共情)',
  },
  {
    id: '3',
    mbti: 'ESTP',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80',
    signature: '走啊，去兜风！想那么多干嘛。',
    tags: ['刺激', '社交悍匪', '活在当下'],
    description: '企业家：充满活力和感知力，热爱冒险，是聚会中的绝对焦点。',
    color: 'from-amber-400 to-orange-500',
    gradient: 'bg-gradient-to-br from-[#FF4D4D] to-[#F9CB28]',
    faceTag: '阳光运动型',
    mbtiColorGroup: '黄人 (探索/现实)',
  },
]

export const QUICK_REPLIES = [
  '今天好累，不想上班...',
  '如果明天是世界末日，你想干嘛？',
  '你相信一见钟情吗？',
  '我最近遇到了一个很难搞的客户。',
]

export const PERSONAS_STORAGE_KEY = 'mbti-match-personas'

export function loadConfiguredPersonas() {
  if (typeof window === 'undefined') return PERSONAS
  const raw = window.localStorage.getItem(PERSONAS_STORAGE_KEY)
  if (!raw) return PERSONAS
  try {
    const parsed = JSON.parse(raw) as Persona[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : PERSONAS
  } catch {
    return PERSONAS
  }
}
