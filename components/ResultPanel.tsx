
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ResultPanel(props: {
  loading: boolean;
  error: string | null;
  markdown: string;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    props.onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (ext: 'md' | 'txt') => {
    if (!props.markdown) return;
    const element = document.createElement("a");
    const file = new Blob([props.markdown], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `scenario_${new Date().getTime()}.${ext}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleShare = async () => {
    if (!props.markdown) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Сценарий от Сценарист AI',
          text: props.markdown,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback: Mailto
      const subject = encodeURIComponent("Мой новый сценарий для видео");
      const body = encodeURIComponent(props.markdown);
      const mailto = `mailto:?subject=${subject}&body=${body}`;
      window.open(mailto, '_blank');
    }
  };

  return (
    <div className="h-full flex flex-col rounded-[2.5rem] border border-zinc-800/50 bg-[#09090b] shadow-2xl overflow-hidden relative">
      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 gap-4 border-b border-zinc-800/50 bg-zinc-900/20">
        <div className="flex items-center gap-3">
           <motion.div 
             animate={props.loading ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 1] } : {}}
             transition={{ duration: 1.5, repeat: Infinity }}
             className={`h-2 w-2 rounded-full transition-all duration-500 ${props.loading ? "bg-emerald-500" : props.markdown ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-zinc-800"}`}
           />
           <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
             {props.loading ? "Генерация смыслов..." : "Результат"}
           </span>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <AnimatePresence>
              {props.markdown && !props.loading && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2"
                >
                  <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(39,39,42,0.8)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="flex items-center gap-1.5 rounded-xl bg-zinc-800/30 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20"
                    title="Поделиться"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    SHARE
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(39,39,42,0.8)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownload('md')}
                    className="flex items-center gap-1.5 rounded-xl bg-zinc-800/30 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border border-zinc-800"
                    title="Скачать Markdown"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    .MD
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(39,39,42,0.8)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownload('txt')}
                    className="flex items-center gap-1.5 rounded-xl bg-zinc-800/30 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border border-zinc-800"
                    title="Скачать Текст"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    .TXT
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopy}
              disabled={!props.markdown || props.loading}
              className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-30 disabled:grayscale"
            >
              {copied ? "Готово!" : "Копировать"}
            </motion.button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-zinc-950/20">
        <AnimatePresence mode="wait">
          {props.loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full space-y-8 p-12"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 border-t-2 border-r-2 border-emerald-500 rounded-full"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 border-b-2 border-l-2 border-emerald-500/30 rounded-full"
                />
              </div>
              <div className="text-center space-y-2">
                <motion.p 
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-base font-bold text-zinc-200 tracking-tight"
                >
                  Генерируем уникальный сценарий
                </motion.p>
                <div className="flex flex-col gap-1.5 opacity-40 max-w-[200px] mx-auto">
                   <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="h-full w-1/2 bg-emerald-500/50"
                      />
                   </div>
                   <div className="h-2 w-3/4 bg-zinc-800 rounded-full mx-auto" />
                </div>
              </div>
            </motion.div>
          ) : props.error ? (
            <motion.div 
              key="error" 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex items-center justify-center p-8"
            >
               <div className="max-w-sm text-center p-8 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 shadow-lg">
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                  <p className="text-xs font-bold text-rose-400 mb-2 uppercase tracking-widest">Ошибка генерации</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{props.error}</p>
               </div>
            </motion.div>
          ) : props.markdown ? (
            <motion.div 
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="p-8 md:p-10 prose prose-invert max-w-none"
            >
              <div className="font-sans text-[15px] md:text-[16px] leading-[1.8] text-zinc-100 tracking-tight whitespace-pre-wrap">
                {props.markdown}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty" 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-zinc-800 space-y-6 p-12"
            >
               <motion.div 
                 animate={{ y: [0, -10, 0] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                 className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
               </motion.div>
               <div className="text-center">
                   <p className="text-sm font-bold text-zinc-600">Ваш сценарий появится здесь</p>
                   <p className="text-[11px] text-zinc-700 max-w-[240px] mt-2 leading-relaxed">Настройте параметры слева и нажмите кнопку создания, чтобы начать магию ИИ.</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
