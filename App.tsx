
import React, { useEffect, useMemo, useState } from "react";
import { HashRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { OptionCards } from "./components/OptionCards";
import { ResultPanel } from "./components/ResultPanel";
import { Uploader } from "./components/Uploader";
import { GenerateRequest, GenerateResult, Limits, Attachment } from "./types";
import { clamp, formatMMSS } from "./utils";
import { generateScenario } from "./services/geminiService";
import { mockBackend } from "./services/mockBackend";

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
  
  const navigate = useNavigate();

  const styleItems = useMemo(() => [
    { key: "storytelling", title: "Сторителлинг", desc: "История → вывод → доверие." },
    { key: "provocative", title: "Провокация", desc: "Миф → правда. Высокий CTR." },
    { key: "educational", title: "Обучение", desc: "Алгоритм, примеры, польза." },
    { key: "entertaining", title: "Развлечение", desc: "Лёгкий формат, юмор, стиль." }
  ], []);

  const directionItems = useMemo(() => [
    { key: "sale", title: "Продажа", desc: "Конверсия через боль и решение." },
    { key: "expertise", title: "Экспертиза", desc: "Рост доверия к бренду." },
    { key: "ads", title: "Реклама", desc: "Нативная интеграция продукта." },
    { key: "engagement", title: "Вовлечение", desc: "Комментарии и репосты." }
  ], []);

  useEffect(() => { setLimits(mockBackend.getUserStatus()); }, []);

  function buildMarkdownFromResponse(r: GenerateResult) {
    const shotsTable = r.shots?.length ? [
      "### Таблица кадров", "",
      "| Время | Кадр | Текст | Речь | SFX |",
      "|---|---|---|---|---|",
      ...r.shots.map((s) => `| ${s.t} | ${s.frame} | ${s.onScreenText} | ${s.voiceOver} | ${s.broll} |`)
    ].join("\n") : "";

    return [
      `# ${r.titleOptions?.[0] || "Сценарий видео"}`, "",
      "## Заголовки", ...(r.titleOptions || []).map(x => `- ${x}`), "",
      "## Хуки", ...(r.hookOptions || []).map(x => `- ${x}`), "",
      "## Основной текст", "", r.scriptMarkdown || "", "",
      shotsTable, "",
      "## Идеи для обложки", ...(r.thumbnailIdeas || []).map(x => `- ${x}`), "",
      "## Теги", (r.hashtags || []).map(x => `#${x.replace(/^#/, "")}`).join(" "), "",
      "## Чек-лист", ...(r.checklist || []).map(x => `- ${x}`)
    ].filter(Boolean).join("\n");
  }

  async function onGenerate() {
    setError(null);
    setLoading(true);
    setResultMarkdown("");

    if (!mockBackend.consumeCredit()) {
      setLoading(false);
      setError("Лимит исчерпан (2 в день). Оформите PRO.");
      return;
    }

    const payload: GenerateRequest = {
      input: { text, attachments },
      options: { style, direction, durationSec, platform, ctaStrength },
      client: { tz: "UTC", uiVersion: "2.5.0" }
    };

    try {
      const result = await generateScenario(payload);
      setResultMarkdown(buildMarkdownFromResponse(result));
      setLimits(mockBackend.getUserStatus());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 md:py-12 bg-[#09090b] text-zinc-100 font-sans">
      <div className="mx-auto max-w-[1400px]">
        <div className="relative rounded-[2.5rem] bg-zinc-950/40 border border-zinc-800/40 backdrop-blur-2xl shadow-2xl overflow-hidden p-6 md:p-12">
          
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
                Сценарист <span className="text-emerald-400">AI</span>
              </h1>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/20">Gemini 3 Flash</span>
                <p className="text-zinc-500 text-sm italic">Мгновенная генерация сценариев</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs font-bold text-zinc-400">
                {limits?.isPro ? "Unlimited" : `${limits?.remainingToday}/${limits?.dailyLimit} Free`}
              </div>
              {!limits?.isPro && (
                <button onClick={() => navigate('/billing/success')} className="px-6 py-2.5 rounded-full bg-white text-zinc-950 text-sm font-bold hover:scale-105 transition shadow-lg">
                  Upgrade to PRO
                </button>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider pl-1">Идея или черновик</label>
                <textarea
                  className="w-full min-h-[160px] rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 text-[15px] text-zinc-200 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all resize-none"
                  placeholder="О чем будет видео? Можно просто вставить ссылку или тезисы..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>

              <Uploader key={uploaderKey} onAttachmentsChange={setAttachments} />

              <div className="rounded-3xl border border-zinc-800/60 bg-zinc-900/20 p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Длительность</label>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">{formatMMSS(durationSec)}</span>
                  </div>
                  <input
                    type="range" min={10} max={600} value={durationSec}
                    onChange={(e) => setDurationSec(clamp(Number(e.target.value), 10, 600))}
                    className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Платформа</label>
                    <select
                      className="w-full appearance-none rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300 outline-none"
                      value={platform} onChange={(e) => setPlatform(e.target.value as any)}
                    >
                      <option value="shorts">YouTube Shorts</option>
                      <option value="reels">Instagram Reels</option>
                      <option value="tiktok">TikTok</option>
                      <option value="youtube">Long YouTube</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Призыв</label>
                    <select
                      className="w-full appearance-none rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300 outline-none"
                      value={ctaStrength} onChange={(e) => setCtaStrength(e.target.value as any)}
                    >
                      <option value="soft">Мягкий</option>
                      <option value="hard">Продающий</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  disabled={loading} onClick={onGenerate}
                  className="flex-1 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-8 py-5 text-sm font-bold uppercase tracking-wider hover:shadow-emerald-500/20 hover:shadow-2xl transition disabled:opacity-50"
                >
                  {loading ? "Думаю..." : "Сгенерировать"}
                </button>
                <button
                  onClick={() => { setText(""); setAttachments([]); setResultMarkdown(""); setError(null); setUploaderKey(k => k + 1); }}
                  className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30 text-zinc-500 hover:text-white transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <OptionCards title="Стиль" items={styleItems} value={style} onChange={(v) => setStyle(v as any)} />
                <OptionCards title="Цель" items={directionItems} value={direction} onChange={(v) => setDirection(v as any)} />
              </div>
              <div className="flex-1 min-h-[500px]">
                <ResultPanel loading={loading} error={error} markdown={resultMarkdown} onCopy={() => navigator.clipboard.writeText(resultMarkdown)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SuccessPage() {
  useEffect(() => { mockBackend.subscribe(); }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-6">
      <div className="max-w-md w-full rounded-[2rem] border border-zinc-800 bg-zinc-950 p-10 text-center shadow-2xl">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">PRO активирован!</h2>
        <p className="text-zinc-500 mb-8">Теперь лимиты на генерацию сняты.</p>
        <Link to="/" className="block w-full rounded-2xl bg-white text-zinc-950 py-4 font-bold transition hover:scale-[1.02]">НАЧАТЬ</Link>
      </div>
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
