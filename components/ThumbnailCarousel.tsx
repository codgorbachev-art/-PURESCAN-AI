
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { generateThumbnailVisual } from "../services/geminiService";

interface ThumbnailCarouselProps {
  ideas: string[];
}

interface ThumbnailCardProps {
  idea: string;
  index: number;
  visual?: string;
  isLoading: boolean;
  error: string | null;
  onVisualize: () => void;
  onDownload: () => void;
}

const ThumbnailCard: React.FC<ThumbnailCardProps> = ({ 
  idea, 
  index, 
  visual, 
  isLoading, 
  error, 
  onVisualize, 
  onDownload 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Parallax Motion Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for the parallax movement
  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  // Transform mouse movement to image offset (subtle parallax)
  const imageX = useTransform(mouseX, [-0.5, 0.5], ["-5%", "5%"]);
  const imageY = useTransform(mouseY, [-0.5, 0.5], ["-5%", "5%"]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = event.clientX - rect.left;
    const mouseYPos = event.clientY - rect.top;
    
    // Normalize to -0.5 to 0.5
    x.set((mouseXPos / width) - 0.5);
    y.set((mouseYPos / height) - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ y: -8 }}
      className="snap-start shrink-0 w-[300px] md:w-[380px] rounded-[2.5rem] bg-zinc-900/40 border border-zinc-800/40 backdrop-blur-2xl overflow-hidden flex flex-col group transition-all hover:border-emerald-500/30 shadow-2xl relative"
    >
      {/* Image Container with Parallax */}
      <div className="aspect-video bg-[#050505] relative overflow-hidden flex items-center justify-center group/img">
        <AnimatePresence mode="wait">
          {visual ? (
            <motion.div 
              key="image-container" 
              className="relative w-full h-full scale-110" // Scale up slightly to allow room for parallax
              style={{ x: imageX, y: imageY }}
            >
              <img
                src={visual}
                alt={`Thumbnail Concept ${index + 1}`}
                className="w-full h-full object-cover pointer-events-none"
                loading="lazy"
              />
              
              {/* Overlay with Prominent Buttons */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 gap-3">
                <div className="flex gap-2">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onDownload}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest shadow-xl transition-all hover:bg-zinc-100"
                    aria-label={`Скачать концепт ${index + 1}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Скачать
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onVisualize}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 text-black font-black text-[10px] uppercase tracking-widest shadow-xl transition-all hover:bg-emerald-400"
                    aria-label={`Перегенерировать концепт ${index + 1}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                    Обновить
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-14 h-14 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full"
                />
                <motion.div 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl"
                />
              </div>
              <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em] animate-pulse">Генерация...</span>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 p-8 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </div>
              <p className="text-[12px] font-bold text-rose-400/90 uppercase tracking-widest leading-relaxed">
                Ошибка AI
              </p>
              <button 
                onClick={onVisualize}
                className="mt-2 text-[10px] font-black text-white bg-zinc-800 px-5 py-2.5 rounded-2xl border border-zinc-700 hover:bg-zinc-700 transition-all uppercase tracking-[0.1em]"
              >
                Повторить
              </button>
            </motion.div>
          ) : (
            <div key="placeholder" className="flex flex-col items-center gap-6 group/placeholder">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-700 transition-all group-hover/placeholder:text-emerald-500/50 group-hover/placeholder:border-emerald-500/20 group-hover/placeholder:bg-emerald-500/5 group-hover/placeholder:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onVisualize}
                className="bg-white text-black px-8 py-4 rounded-[1.25rem] text-[11px] font-black uppercase tracking-[0.15em] shadow-2xl transition-all hover:bg-zinc-100"
              >
                Визуализировать
              </motion.button>
            </div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Content Area */}
      <div className="p-8 space-y-4 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${visual ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-zinc-800'}`} />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Вариант {index + 1}</span>
          </div>
          {visual && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">AI READY</span>
            </div>
          )}
        </div>
        <p className="text-[14px] text-zinc-300 leading-[1.7] font-medium transition-colors duration-300 group-hover:text-zinc-100">
          {idea}
        </p>
      </div>
    </motion.div>
  );
};

export function ThumbnailCarousel({ ideas }: ThumbnailCarouselProps) {
  const [visuals, setVisuals] = useState<Record<number, string>>({});
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<number, string | null>>({});
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);

  // Reset visuals when ideas list changes
  useEffect(() => {
    setVisuals({});
    setLoadingStates({});
    setErrorStates({});
    setIsBatchGenerating(false);
  }, [ideas]);

  const stats = useMemo(() => {
    const total = ideas.length;
    const completed = Object.keys(visuals).length;
    const loading = Object.values(loadingStates).filter(Boolean).length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, loading, progress };
  }, [ideas, visuals, loadingStates]);

  if (!ideas || ideas.length === 0) return null;

  const handleVisualize = async (index: number, idea: string) => {
    if (loadingStates[index]) return;

    setLoadingStates(prev => ({ ...prev, [index]: true }));
    setErrorStates(prev => ({ ...prev, [index]: null }));
    
    try {
      const imageUrl = await generateThumbnailVisual(idea);
      setVisuals(prev => ({ ...prev, [index]: imageUrl }));
    } catch (err) {
      console.error(`Failed to generate image for index ${index}:`, err);
      setErrorStates(prev => ({ ...prev, [index]: "Ошибка" }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleVisualizeAll = async () => {
    if (isBatchGenerating) return;
    setIsBatchGenerating(true);
    
    const tasks = ideas.map((idea, index) => {
      if (!visuals[index] && !loadingStates[index]) {
        return handleVisualize(index, idea);
      }
      return Promise.resolve();
    });

    await Promise.all(tasks);
    setIsBatchGenerating(false);
  };

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `thumbnail-concept-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-[13px] font-black text-zinc-100 uppercase tracking-[0.2em]">Превью обложек</h3>
            {stats.loading > 0 ? (
              <span className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase animate-pulse">
                Генерация: {stats.completed} / {stats.total}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
                {stats.completed === stats.total ? 'Все идеи готовы' : 'Визуализируйте концепты'}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleVisualizeAll}
            disabled={stats.completed === stats.total || stats.loading > 0}
            className={`relative overflow-hidden group px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl border ${
              stats.completed === stats.total 
              ? 'bg-zinc-800/50 border-zinc-700 text-zinc-600 cursor-not-allowed' 
              : 'bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400'
            }`}
          >
            <div className="flex items-center gap-3 relative z-10">
              {stats.loading > 0 ? (
                <>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full"
                  />
                  <span>В процессе...</span>
                </>
              ) : stats.completed === stats.total ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Завершено</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                  <span>Создать всё</span>
                </>
              )}
            </div>
            
            {/* Batch Progress Bar Overlay */}
            {stats.loading > 0 && (
              <motion.div 
                className="absolute inset-0 bg-white/20 origin-left -z-0"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: stats.progress / 100 }}
              />
            )}
          </motion.button>
        </div>
      </div>

      {/* Global Progress Track */}
      {stats.loading > 0 && (
        <div className="mx-2 h-1 bg-zinc-900 rounded-full overflow-hidden shadow-inner">
          <motion.div 
            className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]"
            initial={{ width: 0 }}
            animate={{ width: `${stats.progress}%` }}
            transition={{ type: "spring", stiffness: 50 }}
          />
        </div>
      )}
      
      <div className="flex gap-8 overflow-x-auto pb-12 no-scrollbar px-1 snap-x snap-mandatory">
        {ideas.map((idea, index) => (
          <ThumbnailCard 
            key={index}
            idea={idea}
            index={index}
            visual={visuals[index]}
            isLoading={loadingStates[index]}
            error={errorStates[index]}
            onVisualize={() => handleVisualize(index, idea)}
            onDownload={() => visuals[index] && handleDownload(visuals[index], index)}
          />
        ))}
      </div>
    </motion.div>
  );
}
