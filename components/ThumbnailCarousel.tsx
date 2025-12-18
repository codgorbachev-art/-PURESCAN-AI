
import React from "react";
import { motion } from "framer-motion";

interface ThumbnailCarouselProps {
  ideas: string[];
}

export function ThumbnailCarousel({ ideas }: ThumbnailCarouselProps) {
  if (!ideas || ideas.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Идеи для обложек (Thumbnails)</h3>
        <span className="text-[10px] text-zinc-600 font-medium tracking-tighter">SCROLL →</span>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar cursor-grab active:cursor-grabbing px-1">
        {ideas.map((idea, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -5, borderColor: "rgba(16,185,129,0.3)" }}
            className="shrink-0 w-[260px] p-5 rounded-[2rem] bg-zinc-900/30 border border-zinc-800/60 backdrop-blur-sm flex flex-col gap-4 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <span className="text-[10px] font-black text-zinc-700 uppercase">Option {index + 1}</span>
            </div>
            
            <p className="text-sm text-zinc-300 leading-relaxed font-medium">
              {idea}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
