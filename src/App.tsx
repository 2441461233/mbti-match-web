import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { X, Heart, ArrowRight, Info, Lock, Sparkles, Send } from 'lucide-react';

// --- 类型定义 ---
type Persona = {
  id: string;
  mbti: string;
  avatar: string;
  signature: string;
  tags: string[];
  description: string;
  color: string; // 用于多巴胺配色
  gradient: string; // 高饱和度渐变背景
};

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
};

// --- Mock 数据 ---
const PERSONAS: Persona[] = [
  {
    id: '1',
    mbti: 'ENTJ',
    avatar: 'https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=800&q=80',
    signature: '别跟我讲感觉，告诉我你的方案。',
    tags: ['慕强', '搞钱', '效率至上'],
    description: '指挥官：天生的领导者，充满魅力和自信。极其理性，有时会显得缺乏共情能力。',
    color: 'from-violet-400 to-fuchsia-400',
    gradient: 'bg-gradient-to-br from-[#FF0080] to-[#7928CA]'
  },
  {
    id: '2',
    mbti: 'INFP',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
    signature: '今天云朵的形状，好像一只在笑的猫。',
    tags: ['emo', '浪漫', '敏感'],
    description: '调停者：真正的理想主义者。内心世界丰富，极其渴望深度的情感连接。',
    color: 'from-emerald-300 to-cyan-400',
    gradient: 'bg-gradient-to-br from-[#00DFD8] to-[#007CF0]'
  },
  {
    id: '3',
    mbti: 'ESTP',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80',
    signature: '走啊，去兜风！想那么多干嘛。',
    tags: ['刺激', '社交悍匪', '活在当下'],
    description: '企业家：充满活力和感知力，热爱冒险，是聚会中的绝对焦点。',
    color: 'from-amber-400 to-orange-500',
    gradient: 'bg-gradient-to-br from-[#FF4D4D] to-[#F9CB28]'
  }
];

const QUICK_REPLIES = [
  "今天好累，不想上班...",
  "如果明天是世界末日，你想干嘛？",
  "你相信一见钟情吗？",
  "我最近遇到了一个很难搞的客户。"
];

export default function App() {
  const [phase, setPhase] = useState<'swipe' | 'chat' | 'reveal' | 'result'>('swipe');
  
  // 滑卡状态
  const [cards, setCards] = useState<Persona[]>(PERSONAS);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_swipedCards, setSwipedCards] = useState<{persona: Persona, liked: boolean}[]>([]);
  const [currentChatPersona, setCurrentChatPersona] = useState<Persona | null>(null);

  // 聊天状态
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [chatCount, setChatCount] = useState(0);
  const MAX_CHAT_LIMIT = 10;

  // 评分状态
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_ratings, setRatings] = useState<Record<string, 'liked' | 'passed'>>({});
  const [currentRevealType, setCurrentRevealType] = useState<'liked' | 'passed' | 'timeout' | null>(null);

  // --- 滑卡逻辑 ---
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, persona: Persona) => {
    const swipeThreshold = 100;
    if (info.offset.x > swipeThreshold) {
      handleSwipe(persona, true); // 右滑匹配
    } else if (info.offset.x < -swipeThreshold) {
      handleSwipe(persona, false); // 左滑不喜欢
    }
  };

  const handleSwipe = (persona: Persona, liked: boolean) => {
    setCards(prev => prev.filter(c => c.id !== persona.id));

    if (liked) {
      // 匹配成功，直接进入快闪聊天
      setCurrentChatPersona(persona);
      setMessages([
        { id: 'sys1', sender: 'ai', text: `你与 ${persona.signature.slice(0, 5)}... 匹配成功！你有 ${MAX_CHAT_LIMIT} 句话的时间了解Ta。中途随时可以做出最终决定。` }
      ]);
      setChatCount(0);
      setPhase('chat');
    } else if (cards.length <= 1) {
      // 没卡了
      setPhase('result');
    }
  };

  // --- 聊天逻辑 ---
  const handleSend = (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim() || chatCount >= MAX_CHAT_LIMIT) return;

    const newUserMsg: Message = { id: Date.now().toString(), sender: 'user', text: messageText };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    const newChatCount = chatCount + 1;
    setChatCount(newChatCount);

    // 模拟极端性格回复
    setTimeout(() => {
      let aiText = '';
      if (currentChatPersona?.mbti === 'ENTJ') aiText = '直接说重点，你想表达什么？';
      else if (currentChatPersona?.mbti === 'INFP') aiText = '我能感觉到你文字里的情绪...你现在是不是有点紧张？';
      else aiText = '哈哈哈哈有点意思，继续说！';

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', text: aiText }]);
      
      if (newChatCount >= MAX_CHAT_LIMIT) {
        handleDecision('timeout');
      }
    }, 800);
  };

  // --- 决策与揭晓逻辑 ---
  const handleDecision = (decision: 'liked' | 'passed' | 'timeout') => {
    if (currentChatPersona && decision !== 'timeout') {
      setRatings(prev => ({ ...prev, [currentChatPersona.id]: decision }));
      setSwipedCards(prev => [...prev, { persona: currentChatPersona, liked: decision === 'liked' }]);
    } else if (currentChatPersona && decision === 'timeout') {
        // 如果是超时，默认当做 passed 处理，或者你可以自定义逻辑
        setRatings(prev => ({ ...prev, [currentChatPersona.id]: 'passed' }));
        setSwipedCards(prev => [...prev, { persona: currentChatPersona, liked: false }]);
    }
    setCurrentRevealType(decision);
    setPhase('reveal');
  };

  const nextCard = () => {
    if (cards.length === 0) {
      setPhase('result');
    } else {
      setPhase('swipe'); // 继续划下一张卡
    }
  };

  // ================= 渲染视图 =================

  // 1. 滑卡界面 (Tinder 模式)
  if (phase === 'swipe') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative bg-[#f5f5f7]">
        {/* 多巴胺背景光晕 - 极度明亮和高饱和 */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-[#FF0080]/30 to-[#7928CA]/30 rounded-full mix-blend-multiply filter blur-[80px] opacity-80 animate-float"></div>
          <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] bg-gradient-to-tl from-[#00DFD8]/30 to-[#007CF0]/30 rounded-full mix-blend-multiply filter blur-[80px] opacity-80 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-gradient-to-tr from-[#FF4D4D]/20 to-[#F9CB28]/20 rounded-full mix-blend-multiply filter blur-[60px] opacity-60 animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="absolute top-12 text-gray-800 text-center z-10 glass-dopamine px-8 py-3 rounded-[32px] shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#FF0080]" />
            <h1 className="text-sm font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-[#FF0080] to-[#FF4D4D] uppercase">
              MBTI Match
            </h1>
          </div>
        </div>

        <div className="relative w-full max-w-sm h-[65vh] flex items-center justify-center z-10 mt-12">
          <AnimatePresence>
            {cards.map((card, index) => {
              const isTop = index === cards.length - 1;
              return (
                <motion.div
                  key={card.id}
                  className={`absolute w-[90%] h-[95%] rounded-[40px] overflow-hidden cursor-grab active:cursor-grabbing shadow-[0_30px_60px_rgba(0,0,0,0.12)] border-[4px] border-white`}
                  style={{ zIndex: index }}
                  drag={isTop ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(e, info) => isTop && handleDragEnd(e, info, card)}
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: isTop ? 1 : 1 - (cards.length - 1 - index) * 0.05, opacity: 1, y: isTop ? 0 : (cards.length - 1 - index) * -20 }}
                  exit={{ x: 500, opacity: 0, transition: { duration: 0.3 } }}
                  whileDrag={{ scale: 1.02, rotate: 5 }}
                >
                  {/* 高饱和底色 */}
                  <div className={`absolute inset-0 ${card.gradient} opacity-80`} />
                  
                  <div 
                    className="absolute inset-2 rounded-[32px] bg-cover bg-center transition-transform duration-700 hover:scale-105 shadow-inner"
                    style={{ backgroundImage: `url(${card.avatar})` }}
                  />
                  
                  {/* 明亮的渐变遮罩，凸显文字 */}
                  <div className="absolute inset-2 rounded-[32px] bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  
                  <div className="absolute bottom-6 w-full px-8 flex flex-col justify-end">
                    <div className="glass-dopamine-heavy px-6 py-4 rounded-3xl mb-4 w-fit inline-block border-white/40">
                       <h2 className="text-xl font-black text-gray-900 leading-snug tracking-tight">"{card.signature}"</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {card.tags.map(tag => (
                        <span key={tag} className="px-4 py-1.5 bg-white/90 text-gray-800 text-[13px] font-bold rounded-full shadow-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            }).reverse()}
          </AnimatePresence>
          
          {cards.length === 0 && (
            <div className="text-gray-800 text-center glass-dopamine-heavy p-10 rounded-[40px] z-10 mx-6 shadow-xl border-white/60">
              <div className="w-24 h-24 bg-gradient-to-tr from-[#FF0080] to-[#F9CB28] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-pink-500/30 relative">
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                <Sparkles size={40} className="text-white animate-pulse-glow" />
              </div>
              <h2 className="text-3xl font-black mb-3 tracking-tight">匹配完成</h2>
              <p className="text-gray-500 text-[15px] mb-10 font-medium">所有的灵魂碎片已收集完毕</p>
              <button 
                onClick={() => setPhase('result')}
                className="w-full py-5 bg-gray-900 text-white rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-transform hover:shadow-gray-900/30"
              >
                生成灵魂报告
              </button>
            </div>
          )}
        </div>

        {cards.length > 0 && (
          <div className="absolute bottom-10 flex gap-6 z-20">
            <button 
              onClick={() => handleSwipe(cards[cards.length-1], false)}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-gray-300 hover:text-[#FF4D4D] hover:shadow-[#FF4D4D]/20 transition-all hover:scale-110 shadow-[0_10px_30px_rgba(0,0,0,0.08)] border-2 border-transparent hover:border-[#FF4D4D]/20 group"
            >
              <X size={32} strokeWidth={3} className="group-hover:scale-90 transition-transform" />
            </button>
            <button 
              onClick={() => handleSwipe(cards[cards.length-1], true)}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-gray-300 hover:text-[#00DFD8] hover:shadow-[#00DFD8]/20 transition-all hover:scale-110 shadow-[0_10px_30px_rgba(0,0,0,0.08)] border-2 border-transparent hover:border-[#00DFD8]/20 group"
            >
              <Heart size={32} strokeWidth={3} className="group-hover:scale-110 group-hover:fill-[#00DFD8] transition-transform" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. 快闪聊天界面
  if (phase === 'chat') {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex justify-center relative overflow-hidden">
        {/* 背景氛围，根据当前 AI 的颜色动态改变 */}
        <div className={`absolute top-0 w-full h-[60%] bg-gradient-to-b ${currentChatPersona?.color} opacity-20 pointer-events-none mix-blend-multiply`} />

        <div className="w-full max-w-md bg-white/60 backdrop-blur-3xl h-screen flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.05)] border-x border-white/50">
          {/* Header */}
          <div className="glass-dopamine px-6 py-4 text-gray-800 flex justify-between items-center shadow-sm sticky top-0 z-20 border-b border-white/60">
             <div className="flex-1 flex items-center gap-3">
               <div className="w-12 h-12 rounded-full overflow-hidden border-[3px] border-white shadow-md relative">
                 <img src={currentChatPersona?.avatar} alt="avatar" className="w-full h-full object-cover" />
                 <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00DFD8] border-2 border-white rounded-full"></div>
               </div>
               <div>
                 <h2 className="font-black text-[15px] tracking-tight text-gray-900">神秘人</h2>
                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Online</p>
               </div>
             </div>
             <div className="flex-2 text-center">
                <div className="bg-white/80 px-4 py-1.5 rounded-full text-xs font-black text-gray-500 shadow-sm border border-white/60">
                  剩余 <span className="text-[#FF0080] text-sm">{MAX_CHAT_LIMIT - chatCount}</span> 句
                </div>
             </div>
             <div className="flex-1 flex justify-end">
                <button 
                  onClick={() => handleDecision('passed')} 
                  className="text-gray-400 hover:text-[#FF4D4D] text-[11px] font-bold px-4 py-2 bg-white/60 hover:bg-white rounded-full flex items-center gap-1.5 transition-all shadow-sm border border-transparent hover:border-[#FF4D4D]/20"
                >
                  <X size={14} strokeWidth={3} /> 抛弃
                </button>
             </div>
          </div>
          
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32 z-10 scrollbar-hide">
            {messages.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, type: 'spring', bounce: 0.4 }}
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.text.includes('匹配成功') ? (
                  <div className="w-full text-center my-4">
                    <span className="inline-block bg-white/80 text-gray-500 font-bold text-xs rounded-full py-2 px-6 shadow-sm border border-white/60">
                      ⚡️ {msg.text}
                    </span>
                  </div>
                ) : (
                  <div className={`max-w-[85%] rounded-[28px] px-6 py-4 text-[15px] font-medium leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-br from-[#FF0080] to-[#FF4D4D] text-white rounded-br-sm shadow-pink-500/20' 
                      : 'bg-white text-gray-800 rounded-bl-sm border border-white/60 shadow-[0_10px_20px_rgba(0,0,0,0.03)]'
                  }`}>
                    {msg.text}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Input Area */}
          <div className="absolute bottom-0 w-full p-6 glass-dopamine-heavy border-t border-white/80 flex flex-col gap-4 z-20 pb-8">
            {/* Quick Replies */}
            {chatCount === 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
                {QUICK_REPLIES.map((reply, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSend(reply)}
                    className="whitespace-nowrap px-5 py-3 bg-white hover:bg-gray-50 text-gray-700 font-bold text-[13px] rounded-full border-[2px] border-white/60 hover:border-[#FF0080]/30 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-md"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 items-center bg-white p-2 rounded-[28px] shadow-[0_8px_24px_rgba(0,0,0,0.06)] border-[2px] border-white/80 focus-within:border-[#FF0080]/20 transition-colors">
              <input 
                type="text" 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="说点什么引起Ta的注意..."
                className="flex-1 bg-transparent px-5 font-medium text-[15px] text-gray-800 focus:outline-none placeholder-gray-400"
                disabled={chatCount >= MAX_CHAT_LIMIT}
              />
              <button 
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || chatCount >= MAX_CHAT_LIMIT}
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  inputValue.trim() ? 'bg-[#FF0080] text-white shadow-lg shadow-pink-500/30 hover:scale-105' : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Send size={20} className={inputValue.trim() ? 'ml-1' : ''} strokeWidth={2.5} />
              </button>
            </div>
            
            {/* 中途喜欢按钮 */}
            {chatCount > 0 && (
                <button 
                  onClick={() => handleDecision('liked')}
                  className="w-full py-4 bg-white text-[#FF0080] font-black text-[15px] rounded-[24px] flex justify-center items-center gap-2 hover:bg-gray-50 transition-all border-[2px] border-[#FF0080]/10 shadow-[0_8px_20px_rgba(255,0,128,0.1)] group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF0080]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <Heart size={20} className="fill-[#FF0080] text-[#FF0080] group-hover:scale-110 transition-transform" /> 
                  我懂了，就是Ta！
                </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. 揭晓当前卡片 MBTI 界面
  if (phase === 'reveal') {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-6 relative overflow-hidden">
        {/* 多巴胺背景光晕 */}
        <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${currentChatPersona?.color} opacity-10 pointer-events-none mix-blend-multiply`} />
        
        <div className="glass-dopamine-heavy p-10 rounded-[40px] max-w-sm w-full text-center space-y-6 shadow-2xl border-[3px] border-white relative z-10">
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-[4px] border-white shadow-[0_10px_30px_rgba(0,0,0,0.1)] mb-6 relative">
              <img src={currentChatPersona?.avatar} alt="avatar" className="w-full h-full object-cover" />
          </div>
          
          {currentRevealType === 'liked' && <h2 className="text-3xl font-black text-[#FF0080] tracking-tight">双向奔赴！💘</h2>}
          {currentRevealType === 'passed' && <h2 className="text-3xl font-black text-gray-800 tracking-tight">果断抛弃 💨</h2>}
          {currentRevealType === 'timeout' && <h2 className="text-3xl font-black text-[#FF4D4D] tracking-tight">时间到了 ⏱️</h2>}

          <p className="text-gray-500 font-medium text-[15px]">
            刚才和你聊天的神秘人，其实是：
          </p>
          
          <div className="relative group inline-block">
            <div className={`text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r ${currentChatPersona?.color} my-2 cursor-help flex items-center justify-center gap-2 drop-shadow-sm`}>
               {currentChatPersona?.mbti}
            </div>
            <div className="flex justify-center items-center gap-1 text-gray-400 mt-2 mb-4 text-xs font-bold uppercase tracking-widest cursor-help">
               <Info size={14} /> 了解 {currentChatPersona?.mbti}
            </div>
            
            {/* MBTI Tooltip */}
            <div className="absolute bottom-[80%] left-1/2 -translate-x-1/2 mb-4 w-72 p-5 bg-white text-gray-800 text-[14px] leading-relaxed rounded-[24px] opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-[0_20px_40px_rgba(0,0,0,0.12)] border-2 border-white/50 scale-95 group-hover:scale-100 font-medium">
               <div className={`font-black text-transparent bg-clip-text bg-gradient-to-r ${currentChatPersona?.color} mb-2 text-lg`}>
                 {currentChatPersona?.mbti}
               </div>
               {currentChatPersona?.description}
               <div className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-white"></div>
            </div>
          </div>

          <div className="flex justify-center flex-wrap gap-2 mb-8">
             {currentChatPersona?.tags.map(tag => (
                <span key={tag} className="px-4 py-1.5 bg-gray-100 text-gray-700 text-[13px] rounded-full font-bold shadow-sm">
                  {tag}
                </span>
             ))}
          </div>

          <div className="space-y-4 mt-8">
            {currentRevealType === 'liked' && (
              <button 
                className={`w-full py-5 ${currentChatPersona?.gradient} text-white rounded-[24px] font-black text-[16px] flex justify-center items-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_10px_30px_rgba(255,0,128,0.2)]`}
              >
                <Lock size={20} strokeWidth={2.5} /> 解锁长期聊天 (¥9.9)
              </button>
            )}
            
            <button 
               onClick={nextCard} 
               className="w-full py-4 bg-white text-gray-800 rounded-[24px] font-bold text-[15px] flex justify-center items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm border-[2px] border-white/80"
            >
               {cards.length === 0 ? '查看最终报告' : '继续匹配下一位'} <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. 最终 Aha Moment 报告界面
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-6 relative overflow-hidden">
      {/* 炫彩背景 */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-[#FF0080]/20 to-[#F9CB28]/20 rounded-full mix-blend-multiply filter blur-[80px] opacity-80 animate-float"></div>
      
      <div className="bg-white/80 backdrop-blur-2xl p-1 rounded-[40px] max-w-sm w-full shadow-[0_30px_60px_rgba(0,0,0,0.1)] border-[4px] border-white relative z-10">
        <div className="bg-gradient-to-b from-white to-gray-50/50 p-10 rounded-[36px] text-center text-gray-800 h-full relative overflow-hidden">
          
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
             <Sparkles size={28} className="text-white" />
          </div>

          <h2 className="text-[11px] text-gray-400 font-black tracking-[0.3em] mb-8 uppercase">Your Soul Report</h2>
          
          <div className="space-y-8 relative z-10">
            <div>
              <p className="text-gray-500 font-medium text-[15px] mb-2">你给了极高评价的那个人，其实是：</p>
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF0080] to-[#F9CB28] my-4 drop-shadow-sm">
                ENTJ
              </div>
              <p className="text-[15px] font-bold text-gray-800 bg-gray-100 inline-block px-4 py-1.5 rounded-full">霸道 · 高效 · 掌控全局</p>
            </div>

            <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6"></div>

            <div className="text-left space-y-4 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
              <p className="text-[14px] text-gray-600 leading-relaxed font-medium">
                🤖 <strong className="text-gray-900 font-black">AI 鉴定结果：</strong><br/><br/>
                你可能一直以为自己喜欢温柔体贴的人，但在极其真实的快闪对话中，你的身体却诚实地向“慕强”和“直接”妥协了。
              </p>
              <div className="p-4 bg-gray-50 rounded-[16px] border border-gray-100 mt-4">
                <p className="text-[13px] text-gray-500 font-bold mb-1">你的隐藏 MBTI 偏好可能是：</p>
                <strong className="text-[#FF0080] font-black text-lg">INFP (依赖型)</strong>
              </div>
            </div>
            
            <button className="w-full py-5 mt-4 bg-gray-900 rounded-[24px] font-black text-[16px] text-white shadow-xl hover:scale-[1.02] transition-transform">
              分享我的灵魂鉴定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
