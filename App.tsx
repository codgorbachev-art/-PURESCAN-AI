
import React, { useEffect, useMemo, useState, useRef } from "react";
import { HashRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { OptionCards } from "./components/OptionCards";
import { ResultPanel } from "./components/ResultPanel";
import { Uploader } from "./components/Uploader";
import { ThumbnailCarousel } from "./components/ThumbnailCarousel";
import { GenerateRequest, GenerateResult, Limits, Attachment } from "./types";
import { formatMMSS } from "./utils";
import { generateScenario } from "./services/geminiService";
import { mockBackend } from "./services/mockBackend";

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring" as const, stiffness: 100, damping: 15 } 
  }
};

function HomePage() {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploaderKey, setUploaderKey] = useState(0);

  const [style, setStyle] = useState<GenerateRequest["options"]["style"]>("storytelling");
  const [direction, setDirection] = useState<GenerateRequest["options"]["direction"]>("expertise");
  const [platform, setPlatform] = useState<GenerateRequest["options"]["platform"]>("shorts");
  const [ctaStrength, setCtaStrength] = useState<GenerateRequest["options"]["ctaStrength"]>("soft");
  const [durationSec, setDurationSec] = useState(60);

  const [limits, setLimits] = useState<Limits | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMarkdown, setResultMarkdown] = useState("");
  const [currentResult, setCurrentResult] = useState<GenerateResult | null>(null);
  const [history, setHistory] = useState<{title: string, content: string, date: string}[]>([]);
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("scenarist_history");
    if (saved) setHistory(JSON.parse(saved));
    setLimits(mockBackend.getUserStatus());

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ru-RU';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(prev => (prev ? prev + " " + transcript : transcript));
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        // Handle common WebSpeech errors
        if (event.error === 'not-allowed') {
          setMicError("Доступ запрещен");
        } else if (event.error === 'no-speech') {
          setMicError("Голос не обнаружен");
        } else if (event.error === 'audio-capture') {
          setMicError("Ошибка захвата звука");
        } else {
          setMicError(`Ошибка: ${event.error}`);
        }
        setIsListening(false);
        setTimeout(() => setMicError(null), 3000);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleVoiceInput = async () => {
    setMicError(null);
    
    if (!recognitionRef.current) {
      alert("Ваш браузер не поддерживает голосовой ввод.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    try {
      // 1. Прямая проверка на наличие медиа-устройств
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error("MediaDevicesNotSupported");
      }

      // 2. Проверяем наличие микрофона в системе до запроса доступа
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMicrophone = devices.some(device => device.kind === 'audioinput');
      
      if (!hasMicrophone) {
        setMicError("Микрофон не найден");
        return;
      }

      // 3. Запрос разрешений (вызовет системное окно если нужно)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Закрываем временный поток сразу после получения разрешения
      stream.getTracks().forEach(track => track.stop());

      // 4. Запускаем распознавание
      setIsListening(true);
      recognitionRef.current.start();
    } catch (e: any) {
      console.warn("Microphone access diagnostic:", e.name, e.message);
      
      if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError' || e.message === 'Requested device not found') {
        setMicError("Микрофон не найден");
      } else if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setMicError("Доступ отклонен");
      } else if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
        setMicError("Микрофон занят");
      } else {
        setMicError("Ошибка устройства");
      }
      
      setIsListening(false);
      setTimeout(() => setMicError(null), 3000);
    }
  };

  const saveToHistory = (title: string, content: string) => {
    const newItem = { title: title || "Без названия", content, date: new Date().toLocaleTimeString() };
    const updated = [newItem, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem("scenarist_history", JSON.stringify(updated));
  };

  const styleItems = useMemo(() => [
    { key: "storytelling", title: "Сторителлинг", desc: "Эмоции и доверие." },
    { key: "provocative", title: "Провокация", desc: "Высокий CTR и споры." },
    { key: "educational", title: "Обучение", desc: "Польза и алгоритмы." },
    { key: "entertaining", title: "Развлечение", desc: "Юмор и динамика." }
  ], []);

  const directionItems = useMemo(() => [
    { key: "sale", title: "Продажа", desc: "Конверсия в покупку." },
    { key: "expertise", title: "Экспертиза", desc: "Личный бренд." },
    { key: "ads", title: "Реклама", desc: "Нативный прогрев." },
    { key: "engagement", title: "Охваты", desc: "Репосты и комменты." }
  ], []);

  function buildMarkdownFromResponse(r: GenerateResult) {
    const shotsTable = r.shots?.length ? [
      "### План съёмки", "",
      "| Тайминг | Кадр | Визуальный текст | Речь (VO) | Ремарки |",
      "|---|---|---|---|---|",
      ...r.shots.map((s) => `| ${s.t} | ${s.frame} | ${s.onScreenText} | ${s.voiceOver} | ${s.broll} |`)
    ].join("\n") : "";

    return [
      `# ${r.titleOptions?.[0] || "Сценарий видео"}`, "",
      "## 📌 Заголовки", ...(r.titleOptions || []).map(x => `- ${x}`), "",
      "## 🔥 Хуки (Первые 3 сек)", ...(r.hookOptions || []).map(x => `- ${x}`), "",
      "## 📝 Сценарий", "", r.scriptMarkdown || "", "",
      shotsTable, "",
      "## 📸 Идеи обложек", ...(r.thumbnailIdeas || []).map(x => `- ${x}`), "",
      "## 🏷️ Теги", (r.hashtags || []).map(x => `#${x.replace(/^#/, "")}`).join(" "), "",
      "## ✅ Чек-лист", ...(r.checklist || []).map(x => `- ${x}`)
    ].filter(Boolean).join("\n");
  }

  async function onGenerate() {
    if (!text && attachments.length === 0) {
      setError("Опишите идею или загрузите материалы");
      return;
    }
    setError(null);
    setLoading(true);
    setResultMarkdown("");
    setCurrentResult(null);

    if (!mockBackend.consumeCredit()) {
      setLoading(false);
      setError("Дневной лимит (2) исчерпан. Оформите PRO для безлимита.");
      return;
    }

    const payload: GenerateRequest = {
      input: { text, attachments },
      options: { style, direction, durationSec, platform, ctaStrength },
      client: { tz: "UTC", uiVersion: "3.1.0" }
    };

    try {
      const result = await generateScenario(payload);
      const md = buildMarkdownFromResponse(result);
      setResultMarkdown(md);
      setCurrentResult(result);
      saveToHistory(result.titleOptions?.[0] || text.slice(0, 20), md);
      setLimits(mockBackend.getUserStatus());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-[1500px] px-4 py-6 md:py-10"
      >
        {/* Header Section */}
        <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
              Сценарист <span className="text-emerald-500">AI</span>
            </h1>
            <div className="flex items-center gap-2">
              <motion.div 
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
              />
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Powered by Gemini 3 Ultra-Pro</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block px-4 py-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 text-[11px] font-bold text-zinc-400 uppercase">
              {limits?.isPro ? "Pro Mode" : `Доступно: ${limits?.remainingToday} из ${limits?.dailyLimit}`}
            </div>
            {!limits?.isPro && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/billing/success')} 
                className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                Активировать PRO
              </motion.button>
            )}
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Input & Settings */}
          <div className="lg:col-span-5 space-y-6">
            {/* Main Creative Input Card */}
            <motion.section variants={itemVariants} className="group rounded-[2rem] bg-zinc-900/40 border border-zinc-800/60 p-6 md:p-8 backdrop-blur-xl space-y-6 transition-all hover:border-zinc-700/50 shadow-lg relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Идея проекта</h3>
                  <div className="flex items-center gap-3 relative">
                    {/* Mic Error Tooltip */}
                    <AnimatePresence>
                      {micError && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, x: 10 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute right-full mr-3 whitespace-nowrap px-3 py-1.5 rounded-lg bg-rose-500/90 text-[10px] font-bold text-white shadow-xl z-50 pointer-events-none"
                        >
                          {micError}
                          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-rose-500/90 rotate-45" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleVoiceInput}
                      className={`p-2 rounded-xl border transition-all ${isListening ? 'bg-rose-500/20 border-rose-500 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
                      title={isListening ? "Остановить запись" : "Голосовой ввод"}
                    >
                      <AnimatePresence mode="wait">
                        {isListening ? (
                          <motion.div
                            key="stop"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="mic"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                    {text && (
                      <motion.button 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        onClick={() => setText("")} 
                        className="text-[10px] text-zinc-600 hover:text-zinc-400 uppercase tracking-tighter transition"
                      >Очистить</motion.button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    className="w-full min-h-[140px] bg-transparent text-[16px] text-zinc-200 placeholder:text-zinc-700 outline-none resize-none leading-relaxed transition-all focus:placeholder:opacity-0"
                    placeholder={isListening ? "Слушаю вашу идею..." : "О чем видео? (например: секреты монтажа в CapCut за 60 секунд)"}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  {isListening && (
                    <div className="absolute inset-0 bg-black/5 pointer-events-none rounded-xl">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute bottom-4 left-0 right-0 flex justify-center gap-1"
                      >
                        {[0, 1, 2, 3].map(i => (
                          <motion.div
                            key={i}
                            animate={{ height: [8, 16, 8] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                            className="w-1 bg-rose-500 rounded-full"
                          />
                        ))}
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-zinc-800/50"></div>

              <Uploader key={uploaderKey} onAttachmentsChange={setAttachments} />
            </motion.section>

            {/* Quick Settings Card */}
            <motion.section variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-3xl bg-zinc-900/20 border border-zinc-800/40 p-5 space-y-4 transition-colors hover:bg-zinc-900/40">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Хронометраж</span>
                  <span className="text-xs font-mono text-emerald-400">{formatMMSS(durationSec)}</span>
                </div>
                <input
                  type="range" min={10} max={600} step={10} value={durationSec}
                  onChange={(e) => setDurationSec(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
              <div className="rounded-3xl bg-zinc-900/20 border border-zinc-800/40 p-5 space-y-4 transition-colors hover:bg-zinc-900/40">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Платформа</span>
                <select
                  className="w-full bg-transparent text-sm text-zinc-300 outline-none cursor-pointer font-medium appearance-none"
                  value={platform} onChange={(e) => setPlatform(e.target.value as any)}
                >
                  <option value="shorts">Reels / Shorts</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube (Long)</option>
                </select>
              </div>
            </motion.section>

            {/* Strategy Options */}
            <motion.div variants={itemVariants}>
              <OptionCards title="Тональность" items={styleItems} value={style} onChange={(v) => setStyle(v as any)} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <OptionCards title="Фокус" items={directionItems} value={direction} onChange={(v) => setDirection(v as any)} />
            </motion.div>

            {/* Action Buttons */}
            <motion.div variants={itemVariants} className="flex gap-3 pt-2">
              <motion.button
                disabled={loading} 
                onClick={onGenerate}
                whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(16,185,129,0.2)" }}
                whileTap={{ scale: 0.98 }}
                className="flex-[2] relative group overflow-hidden rounded-3xl bg-white text-black px-8 py-5 text-sm font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10">{loading ? "Обработка смыслов..." : "Создать сценарий"}</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, borderColor: "rgba(244,63,94,0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setText(""); setAttachments([]); setResultMarkdown(""); setError(null); setUploaderKey(k => k + 1); setCurrentResult(null); }}
                className="flex-1 rounded-3xl border border-zinc-800 bg-zinc-900/30 text-zinc-600 hover:text-rose-400 transition-all flex items-center justify-center"
                title="Сбросить всё"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </motion.button>
            </motion.div>
          </div>

          {/* Right Column: Result */}
          <motion.div variants={itemVariants} className="lg:col-span-7 flex flex-col gap-8 h-full min-h-[700px]">
            {/* History Tabs */}
            <AnimatePresence>
              {history.length > 0 && !loading && !resultMarkdown && (
                 <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-2 overflow-x-auto pb-2 no-scrollbar"
                 >
                   {history.map((item, i) => (
                      <motion.button 
                        key={i}
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(24,24,27,1)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setResultMarkdown(item.content)}
                        className="shrink-0 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-500 hover:text-zinc-200 transition-all"
                      >
                        {item.title.slice(0, 15)}...
                      </motion.button>
                   ))}
                 </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 min-h-[500px]">
              <ResultPanel loading={loading} error={error} markdown={resultMarkdown} onCopy={() => navigator.clipboard.writeText(resultMarkdown)} />
            </div>

            {/* Thumbnails Carousel Integration */}
            {currentResult && !loading && (
              <ThumbnailCarousel ideas={currentResult.thumbnailIdeas} />
            )}
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}

function SuccessPage() {
  useEffect(() => { mockBackend.subscribe(); }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full rounded-[2.5rem] border border-emerald-500/20 bg-zinc-950 p-12 text-center shadow-[0_0_50px_rgba(16,185,129,0.1)]"
      >
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-400">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-black text-white mb-3">PRO Активирован</h2>
        <p className="text-zinc-500 mb-10 leading-relaxed">Лимиты сняты. Теперь вы можете генерировать сценарии без ограничений.</p>
        <Link to="/" className="block w-full rounded-2xl bg-white text-black py-4 font-black uppercase tracking-widest transition hover:scale-[1.02] active:scale-95 shadow-xl">Начать работу</Link>
      </motion.div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/billing/success" element={<SuccessPage />} />
      </Routes>
    </Router>
  );
}
