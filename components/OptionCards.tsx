
import React from "react";
import { motion } from "framer-motion";

type Item = { key: string; title: string; desc: string };

export function OptionCards(props: {
  title: string;
  items: Item[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest pl-1">{props.title}</div>
      <div className="grid grid-cols-2 gap-3">
        {props.items.map((it) => {
          const active = props.value === it.key;
          return (
            <motion.button
              key={it.key}
              whileHover={{ 
                scale: 1.02, 
                backgroundColor: active ? "rgba(16,185,129,0.08)" : "rgba(24,24,27,0.4)",
                borderColor: active ? "rgba(16,185,129,0.5)" : "rgba(63,63,70,0.6)"
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => props.onChange(it.key)}
              className={[
                "relative flex flex-col items-start text-left rounded-2xl p-4 transition-all duration-300 border overflow-hidden",
                active
                  ? "border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_15px_-5px_rgba(16,185,129,0.1)]"
                  : "border-zinc-800/40 bg-zinc-900/20"
              ].join(" ")}
            >
              {active && (
                <motion.div 
                  layoutId={`active-bg-${props.title}`}
                  className="absolute inset-0 bg-emerald-500/5 -z-10"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className={`text-[13px] font-bold mb-1 transition-colors duration-300 ${active ? "text-emerald-400" : "text-zinc-300"}`}>
                {it.title}
              </span>
              <p className={`text-[11px] leading-snug transition-colors duration-300 ${active ? "text-emerald-100/60" : "text-zinc-500"}`}>
                {it.desc}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
