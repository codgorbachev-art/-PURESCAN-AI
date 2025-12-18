
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GenerateResult } from "../types";

interface SectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const CollapsibleSection: React.FC<SectionProps> = ({ title, isOpen, onToggle, children, icon }) => (
  <div className="border-b border-zinc-800/50 last:border-0 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-800/20 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-emerald-500/70">{icon}</span>}
        <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">{title}</span>
      </div>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="text-zinc-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </motion.div>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="px-6 pb-6 pt-2 text-zinc-300">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export function ResultPanel(props: {
  loading: boolean;
  error: string | null;
  result: GenerateResult | null;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    script: true,
    shots: true,
    hooks: false,
    titles: false,
    extra: false
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = () => {
    props.onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (ext: 'md' | 'txt') => {
    if (!props.result) return;
    const content = props.result.scriptMarkdown; // Simplified for download
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `scenario_${new Date().getTime()}.${ext}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="h-full flex flex-col rounded-[2.5rem] border border-zinc-800/50 bg-[#09090b] shadow-2xl overflow-hidden relative">
      {/* Main Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 gap-4 border-b border-zinc-800/50 bg-zinc-900/20">
        <div className="flex items-center gap-3">
           <motion.div 
             animate={props.loading ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 1] } : {}}
             transition={{ duration: 1.5, repeat: Infinity }}
             className={`h-2 w-2 rounded-full transition-all duration-500 ${props.loading ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : props.result ? "bg-emerald-400" : "bg-zinc-800"}`}
           />
           <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
             {props.loading ? "Генерация..." : "Сценарий"}
           </span>
        </div>
        
        <div className="flex items-center gap-2">
            <AnimatePresence>
              {props.result && !props.loading && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
                  <button onClick={() => handleDownload('md')} className="px-3 py-2 rounded-xl bg-zinc-800/30 border border-zinc-800 text-[10px] font-bold text-zinc-500 hover:text-zinc-300">.MD</button>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopy}
              disabled={!props.result || props.loading}
              className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-30 transition-all"
            >
              {copied ? "Готово!" : "Копировать"}
            </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-950/20">
        <AnimatePresence mode="wait">
          {props.loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full space-y-8 p-12">
               <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-t-2 border-emerald-500 rounded-full"
                />
               </div>
               <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] animate-pulse">Архитектура смыслов...</p>
            </motion.div>
          ) : props.error ? (
            <div className="h-full flex items-center justify-center p-8 text-center">
               <div className="max-w-xs space-y-3">
                 <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto text-rose-500">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                 </div>
                 <p className="text-sm text-zinc-400 leading-relaxed font-medium">{props.error}</p>
               </div>
            </div>
          ) : props.result ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
              
              <CollapsibleSection 
                title="Заголовки" 
                isOpen={openSections.titles} 
                onToggle={() => toggleSection('titles')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>}
              >
                <div className="grid gap-2">
                  {props.result.titleOptions.map((title, i) => (
                    <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
                      <span className="text-[10px] font-black text-zinc-700 mt-0.5">{i+1}</span>
                      <p className="text-sm font-bold text-zinc-200">{title}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection 
                title="Хуки" 
                isOpen={openSections.hooks} 
                onToggle={() => toggleSection('hooks')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>}
              >
                <div className="grid gap-2">
                  {props.result.hookOptions.map((hook, i) => (
                    <div key={i} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-sm font-medium italic text-emerald-100/80">«{hook}»</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection 
                title="Сценарий" 
                isOpen={openSections.script} 
                onToggle={() => toggleSection('script')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>}
              >
                <div className="prose prose-invert max-w-none">
                  <p className="text-[15px] leading-[1.8] text-zinc-100 whitespace-pre-wrap selection:bg-emerald-500/30">
                    {props.result.scriptMarkdown}
                  </p>
                </div>
              </CollapsibleSection>

              <CollapsibleSection 
                title="План съёмки" 
                isOpen={openSections.shots} 
                onToggle={() => toggleSection('shots')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>}
              >
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-left text-[11px] border-separate border-spacing-y-1">
                    <thead>
                      <tr className="text-zinc-600 font-bold uppercase tracking-wider">
                        <th className="px-2 py-2">Время</th>
                        <th className="px-2 py-2">Кадр</th>
                        <th className="px-2 py-2">Текст</th>
                        <th className="px-2 py-2">VO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {props.result.shots.map((shot, i) => (
                        <tr key={i} className="bg-zinc-900/30 rounded-lg overflow-hidden transition-colors hover:bg-zinc-900/50">
                          <td className="px-2 py-3 font-mono text-emerald-500 rounded-l-xl">{shot.t}</td>
                          <td className="px-2 py-3 text-zinc-300 font-medium">{shot.frame}</td>
                          <td className="px-2 py-3 text-emerald-100/60 italic">{shot.onScreenText}</td>
                          <td className="px-2 py-3 text-zinc-400 rounded-r-xl">{shot.voiceOver}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CollapsibleSection>

              <CollapsibleSection 
                title="Дополнительно" 
                isOpen={openSections.extra} 
                onToggle={() => toggleSection('extra')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>}
              >
                <div className="space-y-6">
                  {props.result.checklist && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Чек-лист по реализации</h4>
                      <ul className="grid gap-2">
                        {props.result.checklist.map((item, i) => (
                          <li key={i} className="flex gap-3 items-start p-2 rounded-lg bg-zinc-900/20 border border-zinc-800/30">
                            <div className="mt-1 w-3 h-3 rounded-full border border-emerald-500/50 flex-shrink-0" />
                            <span className="text-xs text-zinc-400">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {props.result.hashtags && (
                    <div className="flex flex-wrap gap-2">
                      {props.result.hashtags.map((tag, i) => (
                        <span key={i} className="text-[10px] font-bold text-emerald-500 bg-emerald-500/5 px-2 py-1 rounded-md border border-emerald-500/10 tracking-tight lowercase">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-800 space-y-4">
               <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20">Ожидание задачи</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
