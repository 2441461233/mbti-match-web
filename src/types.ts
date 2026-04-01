export type Persona = {
  id: string
  mbti: string
  avatar: string
  signature: string
  tags: string[]
  description: string
  color: string
  gradient: string
  faceTag: string
  mbtiColorGroup: string
}

export type Message = {
  id: string
  sender: 'user' | 'ai'
  text: string
}

export type SwipedCard = {
  persona: Persona
  liked: boolean
}

export type Phase = 'swipe' | 'chat' | 'reveal' | 'result'
