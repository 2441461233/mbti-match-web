import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { X, Heart, ArrowRight, Info, Lock, Sparkles, Send, Eye, Zap, Crown, BarChart2, ChevronLeft } from 'lucide-react';
import { PERSONAS, QUICK_REPLIES } from './personas'
import { computeReport } from './report'
import type { Message, Persona, Phase, SwipedCard } from './types'

export default function App() {
  const [phase, setPhase] = useState<Phase>('swipe');
  
  // 滑卡状态
  const [cards, setCards] = useState<Persona[]>(PERSONAS);
  const [swipedCards, setSwipedCards] = useState<SwipedCard[]>([]);
  const [currentChatPersona, setCurrentChatPersona] = useState<Persona | null>(null);

  // 聊天状态
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [chatCount, setChatCount] = useState(0);
  const MAX_CHAT_LIMIT = 10;

  const [currentRevealType, setCurrentRevealType] = useState<'liked' | 'passed' | 'timeout' | null>(null);
  const replyTimerRef = useRef<number | null>(null)
  const messageSeqRef = useRef(1)

  const nextMessageId = () => String(messageSeqRef.current++)

  const clearReplyTimer = () => {
    if (replyTimerRef.current !== null) {
      window.clearTimeout(replyTimerRef.current)
      replyTimerRef.current = null
    }
  }

  useEffect(() => {
    if (phase !== 'chat') clearReplyTimer()
  }, [phase])

  useEffect(() => {
    return () => clearReplyTimer()
  }, [])

  const report = useMemo(() => computeReport(swipedCards), [swipedCards])

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
    // 将卡片移出当前列表，放入已滑动列表
    setCards(prev => prev.filter(c => c.id !== persona.id));
    setSwipedCards(prev => [...prev, { persona, liked }]);

    if (liked) {
      // 匹配成功，直接进入快闪聊天
      setCurrentChatPersona(persona);
      setMessages([
        { id: 'sys1', sender: 'ai', text: `你与 ${persona.signature.slice(0, 5)}... 匹配成功！你有 ${MAX_CHAT_LIMIT} 句话的时间了解Ta。中途随时可以做出最终决定。` }
      ]);
      setChatCount(0);
      setPhase('chat');
    }
  };

  // --- 聊天逻辑 ---
  const handleSend = (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim() || chatCount >= MAX_CHAT_LIMIT) return;

    const newUserMsg: Message = { id: nextMessageId(), sender: 'user', text: messageText };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    const newChatCount = chatCount + 1;
    setChatCount(newChatCount);

    // 模拟极端性格回复
    clearReplyTimer()
    replyTimerRef.current = window.setTimeout(() => {
      let aiText = '';
      if (currentChatPersona?.mbti === 'ENTJ') aiText = '直接说重点，你想表达什么？';
      else if (currentChatPersona?.mbti === 'INFP') aiText = '我能感觉到你文字里的情绪...你现在是不是有点紧张？';
      else aiText = '哈哈哈哈有点意思，继续说！';

      setMessages(prev => [...prev, { id: nextMessageId(), sender: 'ai', text: aiText }]);
      
      if (newChatCount >= MAX_CHAT_LIMIT) {
        handleDecision('timeout');
      }
    }, 800);
  };

  // --- 决策与揭晓逻辑 ---
  const handleDecision = (decision: 'liked' | 'passed' | 'timeout') => {
    clearReplyTimer()
    if (currentChatPersona && decision !== 'timeout') {
      // 更新 swipedCards 中对应卡片的状态（如果是聊天中途决定的，之前滑动时的状态被覆盖或确认）
      setSwipedCards(prev => {
        const index = prev.findIndex(item => item.persona.id === currentChatPersona.id);
        if (index > -1) {
          const newArr = [...prev];
          newArr[index].liked = decision === 'liked';
          return newArr;
        }
        return [...prev, { persona: currentChatPersona, liked: decision === 'liked' }];
      });
    } else if (currentChatPersona && decision === 'timeout') {
        // 如果是超时，默认当做 passed 处理
        setSwipedCards(prev => {
          const index = prev.findIndex(item => item.persona.id === currentChatPersona.id);
          if (index > -1) {
            const newArr = [...prev];
            newArr[index].liked = false;
            return newArr;
          }
          return [...prev, { persona: currentChatPersona, liked: false }];
        });
    }
    setCurrentRevealType(decision);
    setPhase('reveal');
  };

  const nextCard = () => {
    setPhase('swipe'); // 总是可以返回 swipe，如果没有卡片了，swipe 界面会显示“匹配完成”状态
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

        <div className="absolute top-12 text-gray-800 text-center z-10 glass-dopamine px-8 py-3 rounded-[32px] shadow-sm flex items-center justify-between w-[90%] max-w-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#FF0080]" />
            <h1 className="text-sm font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-[#FF0080] to-[#FF4D4D] uppercase">
              MBTI Match
            </h1>
          </div>
          {/* 灵魂报告入口，只要划过卡就能看 */}
          {swipedCards.length > 0 && (
            <button 
              onClick={() => setPhase('result')}
              className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:scale-105 transition-transform shadow-md"
            >
              <BarChart2 size={14} />
              报告
            </button>
          )}
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
      
      <div className="bg-white/80 backdrop-blur-2xl p-1 rounded-[40px] max-w-sm w-full shadow-[0_30px_60px_rgba(0,0,0,0.1)] border-[4px] border-white relative z-10 flex flex-col h-[90vh] max-h-[800px]">
        {/* Header - 允许返回继续划卡 */}
        <div className="flex justify-between items-center px-6 py-4 absolute top-0 left-0 w-full z-20">
           <button 
             onClick={() => setPhase('swipe')}
             className="w-10 h-10 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center text-gray-600 hover:bg-white transition-colors shadow-sm"
           >
             <ChevronLeft size={20} />
           </button>
        </div>

        <div className="bg-gradient-to-b from-white to-gray-50/50 p-6 pt-16 rounded-[36px] text-center text-gray-800 h-full relative overflow-y-auto scrollbar-hide">
          
          <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
             <Sparkles size={24} className="text-white" />
          </div>

          <h2 className="text-[11px] text-gray-400 font-black tracking-[0.3em] mb-6 uppercase">Your Soul Report</h2>
          
          <div className="space-y-6 relative z-10 pb-8">
            {/* 核心结论 */}
            <div>
              <p className="text-gray-500 font-medium text-[14px] mb-1">
                基于你最近聊过的 {report.total} 个人（其中心动 {report.liked} 次），你的潜意识偏好是：
              </p>
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF0080] to-[#F9CB28] my-2 drop-shadow-sm">
                {report.topMbti?.value ?? '—'}
              </div>
            </div>

            {/* 多维度分析卡片 */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 text-left space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Eye size={16} className="text-[#FF0080]" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-gray-400 mb-1">颜值偏好标签</h3>
                  <p className="text-[15px] font-black text-gray-800">{report.topFaceTag?.value ?? '—'}</p>
                </div>
              </div>
              
              <div className="w-full h-px bg-gray-50"></div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Crown size={16} className="text-purple-500" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-gray-400 mb-1">灵魂底色匹配</h3>
                  <p className="text-[15px] font-black text-gray-800">{report.topColorGroup?.value ?? '—'}</p>
                </div>
              </div>

              <div className="w-full h-px bg-gray-50"></div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap size={16} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-gray-400 mb-1">AI 沟通建议</h3>
                  <p className="text-[13px] font-medium text-gray-600 leading-relaxed">
                    {report.advice}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 付费解锁区域 */}
            <div className="pt-4 border-t border-gray-100/50 mt-4 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full border border-white">
                PRO REPORT
              </div>
              <p className="text-[13px] text-gray-500 font-medium mb-4">想知道你的<span className="text-[#FF0080] font-bold">雷区</span>和<span className="text-[#00DFD8] font-bold">隐藏副人格</span>吗？</p>
              
              <button className="w-full py-4 bg-gray-900 rounded-[24px] font-black text-[15px] text-white shadow-xl hover:scale-[1.02] transition-transform flex justify-center items-center gap-2 group">
                <Lock size={16} className="text-gray-400 group-hover:text-white transition-colors" />
                解锁万字深度解析 (¥19.9)
              </button>
              
              <button className="w-full py-3 mt-2 bg-transparent text-gray-400 font-bold text-[13px] hover:text-gray-600 transition-colors">
                仅保存基础报告分享
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
