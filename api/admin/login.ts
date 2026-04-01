import crypto from 'node:crypto'

type Body = {
  username?: string
  password?: string
}

type RequestShape = {
  method?: string
  body?: Body
}

type ResponseShape = {
  status: (code: number) => ResponseShape
  json: (payload: unknown) => void
}

function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

export default function handler(req: RequestShape, res: ResponseShape) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  const body = (req.body ?? {}) as Body
  const user = process.env.ADMIN_USER ?? 'admin'
  const pass = process.env.ADMIN_PASSWORD ?? '123'
  const token = process.env.ADMIN_TOKEN ?? 'mbti-match-admin-token-dev'

  const okUser = typeof body.username === 'string' && safeEqual(body.username, user)
  const okPass = typeof body.password === 'string' && safeEqual(body.password, pass)

  if (!okUser || !okPass) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  res.status(200).json({ token })
}
