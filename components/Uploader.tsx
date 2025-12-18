
import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Attachment } from "../types";

interface FileStatus {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  errorMessage?: string;
  result?: Attachment;
}

interface UploaderProps {
  onAttachmentsChange: (files: Attachment[]) => void;
  maxFiles?: number;
  hint?: string;
}

export const Uploader: React.FC<UploaderProps> = (props) => {
  const { onAttachmentsChange, maxFiles = 3, hint } = props;
  const ref = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileStatus[]>([]);
  const lastEmittedRef = useRef<string>("");

  useEffect(() => {
    const validAttachments = files
      .filter((f) => f.status === "success" && f.result)
      .map((f) => f.result!);

    const signature = JSON.stringify(validAttachments.map(v => v.name + v.dataBase64.length));

    if (signature !== lastEmittedRef.current) {
      lastEmittedRef.current = signature;
      onAttachmentsChange(validAttachments);
    }
  }, [files, onAttachmentsChange]);

  const processFile = async (file: File, id: string) => {
    updateFile(id, { status: "uploading", progress: 0 });

    if (file.size > 5 * 1024 * 1024) {
      updateFile(id, { status: "error", errorMessage: "Лимит 5 МБ превышен" });
      return;
    }

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            updateFile(id, { progress: Math.round((e.loaded / e.total) * 100) });
          }
        };
        reader.onload = () => {
          const res = String(reader.result || "");
          const idx = res.indexOf("base64,");
          resolve(idx >= 0 ? res.slice(idx + 7) : "");
        };
        reader.onerror = () => reject(new Error("Ошибка чтения"));
        reader.readAsDataURL(file);
      });

      updateFile(id, {
        status: "success",
        progress: 100,
        result: {
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          dataBase64: base64,
        },
      });
    } catch (e) {
      updateFile(id, { status: "error", errorMessage: "Сбой загрузки" });
    }
  };

  const updateFile = (id: string, data: Partial<FileStatus>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...data } : f)));
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    
    const remainingSlots = maxFiles - files.length;
    if (remainingSlots <= 0) return;

    const newFilesRaw = Array.from(fileList).slice(0, remainingSlots);
    const newFileEntries: FileStatus[] = newFilesRaw.map((f) => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      progress: 0,
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...newFileEntries]);
    newFileEntries.forEach((entry) => processFile(entry.file, entry.id));
    
    if (ref.current) ref.current.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const getFormatLabel = (mime: string) => {
    if (mime.includes("pdf")) return "PDF";
    if (mime.includes("image")) return "IMAGE";
    if (mime.includes("text")) return "TXT";
    return "FILE";
  };

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between pl-1">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Приложения</label>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
             {files.length}/{maxFiles}
           </span>
        </div>
      </div>

      {files.length < maxFiles && (
        <div className="group relative rounded-[1.5rem] border border-dashed border-zinc-800 bg-zinc-900/10 p-5 transition-all hover:border-emerald-500/30 hover:bg-zinc-900/30">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-emerald-400 transition-colors shadow-inner">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-zinc-200">Добавить контекст</div>
                <div className="text-[11px] text-zinc-500 max-w-[220px] leading-relaxed">
                  {hint ?? "Изображения, текстовые файлы или PDF до 5 МБ"}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-xl bg-white text-black px-4 py-2 text-[11px] font-black uppercase tracking-wider hover:bg-zinc-200 transition active:scale-95"
                onClick={() => ref.current?.click()}
              >
                Выбрать
              </button>
              <label className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-2 text-zinc-300 hover:text-white transition cursor-pointer active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <input className="hidden" type="file" accept="image/*" capture="environment" onChange={(e) => handleFiles(e.target.files)} />
              </label>
            </div>
          </div>
          <input ref={ref} className="hidden" type="file" multiple accept="image/*,text/plain,application/pdf" onChange={(e) => handleFiles(e.target.files)} />
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div className="flex flex-col gap-3">
             {files.map((f) => (
                <motion.div
                  key={f.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4"
                >
                  <div className="flex items-center gap-4 relative z-10">
                     <motion.div 
                        animate={f.status === 'error' ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                        transition={{ duration: 0.4 }}
                        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${f.status === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                     >
                        {f.file.type.startsWith("image") ? (
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        ) : (
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        )}
                     </motion.div>
                     
                     <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                           <div className="text-[13px] font-bold text-zinc-100 truncate">{f.file.name}</div>
                           {f.status === "uploading" && (
                             <span className="text-[10px] font-black text-emerald-400 font-mono">{f.progress}%</span>
                           )}
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                             {getFormatLabel(f.file.type)}
                           </span>
                           <span className="text-[10px] font-medium text-zinc-600">
                             {(f.file.size / 1024).toFixed(0)} KB
                           </span>
                           {f.status === "error" && (
                             <span className="text-[10px] font-bold text-rose-500 uppercase ml-auto">{f.errorMessage}</span>
                           )}
                        </div>
                     </div>

                     <div className="shrink-0">
                        {f.status === "success" ? (
                           <motion.div 
                             initial={{ scale: 0.5, opacity: 0 }}
                             animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                             transition={{ duration: 0.5 }}
                             className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                           >
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                           </motion.div>
                        ) : (
                           <button 
                             onClick={() => removeFile(f.id)}
                             className="p-2 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                           </button>
                        )}
                     </div>
                  </div>
                  
                  {/* Progress Track */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900">
                     {f.status === "uploading" && (
                       <motion.div 
                         className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                         initial={{ width: 0 }}
                         animate={{ width: `${f.progress}%` }}
                         transition={{ duration: 0.1 }}
                       />
                     )}
                     {f.status === "success" && <div className="h-full w-full bg-emerald-500 opacity-20" />}
                     {f.status === "error" && <div className="h-full w-full bg-rose-500 opacity-40" />}
                  </div>
                </motion.div>
             ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
