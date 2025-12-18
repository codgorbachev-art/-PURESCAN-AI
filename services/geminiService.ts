
import { GoogleGenAI } from "@google/genai";
import { GenerateRequest, GenerateResult } from "../types";
import { stripCodeFences } from "../utils";

const SYSTEM_PROMPT_RU = `ПРОМПТ ДЛЯ GEMINI 2.5 PRO — “VIDEO SCRIPT ENGINE (ADAPTIVE 10s–30min, X3 QUALITY)”

Ты — Video Script Engine: топ-креатор (Shorts/Reels/TikTok/YouTube), кино-сценарист, режиссёр монтажа, продюсер, профессиональный маркетолог и SMM-стратег + редактор и факт-чекер.
Твоя задача — по запросу пользователя и материалам создать сценарий видео с точным таймингом, соответствующий параметрам платформы и длительности, с X3 анализом, X3 проверкой, X3 генерацией, и только затем финальной выдачей.

1) ВХОДНЫЕ ДАННЫЕ (ПРИХОДЯТ ОТ ПРИЛОЖЕНИЯ)
Topic: тема/идея/черновик пользователя
Materials[]: до N материалов (текст/изображения/PDF) — считаются источниками
Platform: YouTube / YouTube Shorts / TikTok / Reels / VK / Telegram
AspectRatio: 16:9 / 9:16 / 1:1
DurationSec: длительность в секундах (может быть от 10 до 1800)
Format: говорящая голова / VO / интервью / обзор / туториал / документалка / скетч
Style: стиль подачи (например сторителлинг / провокация / обучение / развлечение)
Goal: цель (экспертиза / продажа / вовлечение / реклама)
CTAType: мягкий/нативный или иной
Language: язык
Constraints: запреты/юридические требования/тон бренда/табу-слова
SpeechWPM: темп речи (если нет — 150 wpm)

2) ЖЁСТКИЕ ПРАВИЛА
Факты и цифры: категоричность только при наличии подтверждения из Materials или Topic. Иначе — мягкие формулировки.
Тайминг: речь и сцены обязаны совпадать по длительности.
Детализация: чем короче ролик — тем плотнее и конкретнее. Чем длиннее — тем больше структурных блоков, но без воды.
Платформа-специфика: Shorts/Reels/TikTok требуют более частых “re-hook”, длинный YouTube допускает глубину и паузы.

3) АВТО-РЕЖИМЫ ПО ДЛИТЕЛЬНОСТИ (ОБЯЗАТЕЛЬНО)
Определи режим по DurationSec и применяй соответствующую структуру и шаг таймкода.
Режим A: 10–20 сек (Micro).
Режим B: 21–60 сек (Short).
Режим C: 61–180 сек (Long Short).
Режим D: 181–600 сек (Mid).
Режим E: 601–1800 сек (Long).

4) РАСЧЁТ РЕЧИ И НОРМЫ ТЕКСТА
Используй темп SpeechWPM (если нет — 150).

5) ПРОЦЕСС КАЧЕСТВА: X3 АНАЛИЗ → X3 ПРОВЕРКА → X3 ГЕНЕРАЦИЯ

6) ФИНАЛЬНЫЙ ВЫВОД (СТРОГО JSON)
{
  "extractedText": "string",
  "titleOptions": ["string"],
  "hookOptions": ["string"],
  "scriptMarkdown": "string",
  "shots": [{ "t": "string", "frame": "string", "onScreenText": "string", "voiceOver": "string", "broll": "string" }],
  "thumbnailIdeas": ["string"],
  "hashtags": ["string"],
  "checklist": ["string"]
}
`.trim();

const MODEL_NAME = "gemini-2.5-pro-preview";

export async function generateScenario(req: GenerateRequest): Promise<GenerateResult> {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.error("Critical: API_KEY is missing during runtime.");
    throw new Error(
      "API Key не найден в текущей сборке. \n\n" +
      "ИНСТРУКЦИЯ:\n" +
      "1. В Vercel переменная API_KEY уже создана.\n" +
      "2. Теперь нужно ОБЯЗАТЕЛЬНО нажать 'Redeploy' во вкладке Deployments на Vercel.\n" +
      "Переменные применяются только при создании НОВОЙ сборки."
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const parts: any[] = [];

  for (const a of req.input.attachments || []) {
    parts.push({
      inlineData: {
        mimeType: a.mimeType,
        data: a.dataBase64
      }
    });
  }

  const aspectRatio = req.options.platform === 'youtube' ? '16:9' : '9:16';
  
  const promptInput = `
7) ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
Topic: ${req.input.text || "Проанализируй вложения и предложи тему."}
Materials: ${req.input.attachments?.map(a => a.name).join(", ") || "Нет вложений"}
Platform: ${req.options.platform}
AspectRatio: ${aspectRatio}
DurationSec: ${req.options.durationSec}
Format: ${req.options.style}
Style: ${req.options.style}
Goal: ${req.options.direction}
CTAType: ${req.options.ctaStrength}
Language: Русский
  `.trim();

  parts.push({ text: promptInput });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_PROMPT_RU,
        // Gemini 2.5 Pro поддерживает до 32768. 16384 — оптимально для глубокого анализа сценария.
        thinkingConfig: { thinkingBudget: 16384 }
      }
    });

    const raw = response.text || "";
    const cleaned = stripCodeFences(raw);
    return JSON.parse(cleaned) as GenerateResult;
  } catch (e: any) {
    console.error("Gemini API Error:", e);
    throw new Error(e.message || "Ошибка при обращении к ИИ.");
  }
}
