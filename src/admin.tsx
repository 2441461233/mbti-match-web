import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Eye, Lock, LogOut, Plus, Save, Sparkles, Trash2 } from 'lucide-react'
import './index.css'
import { PERSONAS, PERSONAS_STORAGE_KEY } from './personas'
import type { Persona } from './types'

const SESSION_KEY = 'mbti-match-admin-token'

function loadPersonas(): Persona[] {
  const raw = localStorage.getItem(PERSONAS_STORAGE_KEY)
  if (!raw) return PERSONAS
  try {
    return JSON.parse(raw) as Persona[]
  } catch {
    return PERSONAS
  }
}

export default function AdminApp() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(SESSION_KEY))
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [personas, setPersonas] = useState<Persona[]>(() => loadPersonas())
  const [activeId, setActiveId] = useState<string>(() => loadPersonas()[0]?.id ?? '')

  useEffect(() => {
    if (!token) return
    localStorage.setItem(PERSONAS_STORAGE_KEY, JSON.stringify(personas))
  }, [personas, token])

  const active = useMemo(
    () => personas.find(item => item.id === activeId) ?? personas[0] ?? null,
    [activeId, personas],
  )

  const updateActive = (patch: Partial<Persona>) => {
    if (!active) return
    setPersonas(prev =>
      prev.map(item => (item.id === active.id ? { ...item, ...patch } : item)),
    )
  }

  const handleLogin = async () => {
    setError('')
    setSaving(true)
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? '登录失败')
        return
      }
      localStorage.setItem(SESSION_KEY, data.token)
      setToken(data.token)
    } catch {
      setError('登录失败，请稍后再试')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY)
    setToken(null)
  }

  const handleSave = () => {
    localStorage.setItem(PERSONAS_STORAGE_KEY, JSON.stringify(personas))
    alert('已保存到本地浏览器，可立即在前台生效')
  }

  const addPersona = () => {
    const id = crypto.randomUUID()
    const next: Persona = {
      id,
      mbti: 'ENFJ',
      avatar: '',
      signature: '先说你的故事，我来懂你。',
      tags: ['治愈', '共情'],
      description: '主角光环型人格，擅长鼓励与引导。',
      color: 'from-pink-400 to-rose-400',
      gradient: 'bg-gradient-to-br from-[#FF7AD9] to-[#FF5C8A]',
      faceTag: '温柔主角脸',
      mbtiColorGroup: '粉人 (热情/共鸣)',
    }
    setPersonas(prev => [...prev, next])
    setActiveId(id)
  }

  const removePersona = () => {
    if (!active) return
    const next = personas.filter(item => item.id !== active.id)
    setPersonas(next)
    setActiveId(next[0]?.id ?? '')
  }

  if (!token) {
    return (
      <div className="h-screen bg-[#f5f5f7] flex items-center justify-center p-6 relative overflow-y-auto">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-[#FF0080]/20 to-[#F9CB28]/20 rounded-full mix-blend-multiply filter blur-[80px] opacity-80 animate-float"></div>
        <div className="glass-dopamine-heavy w-full max-w-md rounded-[40px] p-8 relative z-10">
          <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock size={24} className="text-white" />
          </div>
          <h1 className="text-center text-2xl font-black text-gray-900">进入管理后台</h1>
          <p className="text-center text-gray-500 text-sm mt-2">输入账号密码后才能配置不同人物的人设</p>
          <div className="mt-8 space-y-4">
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="用户名"
              className="w-full bg-white rounded-[20px] px-5 py-4 font-medium text-gray-800 focus:outline-none border border-white shadow-sm"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="密码"
              className="w-full bg-white rounded-[20px] px-5 py-4 font-medium text-gray-800 focus:outline-none border border-white shadow-sm"
            />
            {error ? <p className="text-sm text-red-500 font-medium">{error}</p> : null}
            <button
              onClick={handleLogin}
              disabled={saving}
              className="w-full py-4 bg-gray-900 text-white rounded-[24px] font-black hover:scale-[1.02] transition-transform"
            >
              {saving ? '登录中...' : '进入后台'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-y-auto bg-[#f5f5f7] p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="glass-dopamine-heavy rounded-[32px] p-5 md:p-6 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
              <Sparkles size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900">人物人设管理后台</h1>
              <p className="text-sm text-gray-500">你可以在这里配置卡片、标签、色系和基础人格描述</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-3 bg-gray-900 text-white rounded-[18px] font-bold flex items-center gap-2"
            >
              <Save size={16} />
              保存
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-3 bg-white text-gray-700 rounded-[18px] font-bold flex items-center gap-2 border border-white"
            >
              <LogOut size={16} />
              退出
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_360px] gap-6">
          <div className="glass-dopamine-heavy rounded-[32px] p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-900">人物列表</h2>
              <button
                onClick={addPersona}
                className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {personas.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveId(item.id)}
                  className={`w-full text-left rounded-[24px] p-4 border-2 transition-all ${
                    activeId === item.id ? 'border-gray-900 bg-white shadow-md' : 'border-white bg-white/60'
                  }`}
                >
                  <div className="font-black text-gray-900">{item.mbti}</div>
                  <div className="text-sm text-gray-500 mt-1 line-clamp-2">{item.signature}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-dopamine-heavy rounded-[32px] p-5 md:p-6">
            {active ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-gray-900 text-lg">编辑人设</h2>
                  <button
                    onClick={removePersona}
                    className="px-3 py-2 bg-red-50 text-red-500 rounded-[16px] font-bold flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    删除
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="MBTI">
                    <input value={active.mbti} onChange={e => updateActive({ mbti: e.target.value })} className={inputClass} />
                  </Field>
                  <Field label="颜值标签">
                    <input value={active.faceTag} onChange={e => updateActive({ faceTag: e.target.value })} className={inputClass} />
                  </Field>
                </div>

                <Field label="头像 URL">
                  <input value={active.avatar} onChange={e => updateActive({ avatar: e.target.value })} className={inputClass} />
                </Field>

                <Field label="Slogan">
                  <textarea value={active.signature} onChange={e => updateActive({ signature: e.target.value })} className={textareaClass} />
                </Field>

                <Field label="人物简介">
                  <textarea value={active.description} onChange={e => updateActive({ description: e.target.value })} className={textareaClass} />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="色系说明">
                    <input value={active.mbtiColorGroup} onChange={e => updateActive({ mbtiColorGroup: e.target.value })} className={inputClass} />
                  </Field>
                  <Field label="标签（逗号分隔）">
                    <input
                      value={active.tags.join(',')}
                      onChange={e => updateActive({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Tailwind 渐变类">
                    <input value={active.gradient} onChange={e => updateActive({ gradient: e.target.value })} className={inputClass} />
                  </Field>
                  <Field label="色带类">
                    <input value={active.color} onChange={e => updateActive({ color: e.target.value })} className={inputClass} />
                  </Field>
                </div>
              </div>
            ) : null}
          </div>

          <div className="glass-dopamine-heavy rounded-[32px] p-5 md:p-6">
            {active ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Eye size={18} className="text-gray-500" />
                  <h2 className="font-black text-gray-900">实时预览</h2>
                </div>
                <div className={`rounded-[32px] p-2 ${active.gradient}`}>
                  <div
                    className="relative rounded-[28px] h-[420px] bg-center bg-cover overflow-hidden"
                    style={{ backgroundImage: active.avatar ? `url(${active.avatar})` : undefined }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 w-full p-6">
                      <div className="glass-dopamine-heavy px-5 py-4 rounded-[24px] inline-block mb-3 max-w-[90%]">
                        <p className="font-black text-gray-900 text-lg leading-snug">“{active.signature}”</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {active.tags.map(tag => (
                          <span key={tag} className="px-3 py-1.5 bg-white/90 rounded-full font-bold text-sm text-gray-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 bg-white rounded-[24px] p-5 shadow-sm">
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF0080] to-[#F9CB28]">
                    {active.mbti}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{active.description}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-bold text-gray-500 mb-2">{label}</div>
      {children}
    </label>
  )
}

const inputClass =
  'w-full bg-white rounded-[18px] px-4 py-3 font-medium text-gray-800 focus:outline-none border border-white shadow-sm'

const textareaClass =
  'w-full min-h-[110px] bg-white rounded-[18px] px-4 py-3 font-medium text-gray-800 focus:outline-none border border-white shadow-sm resize-y'
