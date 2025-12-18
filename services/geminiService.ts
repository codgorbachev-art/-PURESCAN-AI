
import { GoogleGenAI } from "@google/genai";
import { GenerateRequest, GenerateResult } from "../types";
import { stripCodeFences, extractJson } from "../utils";

const SYSTEM_PROMPT_RU = `Ты — элитный сценарист виральных видео для TikTok, Reels и YouTube. 
Твоя специализация: удержание внимания (Retention), психология зрителя и драматургия.

ПРАВИЛА ГЕНЕРАЦИИ:

1. ЗАГОЛОВКИ (titleOptions): Сгенерируй 5 максимально разнообразных вариантов.
   - Обязательно используй ключевые слова из запроса пользователя.
   - Используй разные психологические триггеры: 
     * "Любопытство" (Кликбейт, но честный)
     * "Выгода" (Что получит зритель)
     * "Страх упущенного" (Почему это нельзя пропустить)
     * "Противоречие" (Разрыв шаблона)
     * "Личный опыт" (История)
   - Подстраивай заголовки под выбранную платформу (например, короткие и дерзкие для Reels).

2. ХУКИ (Hooks): Предлагай 3 варианта. Они должны бить в боль или любопытство за первые 2 секунды.

3. СЦЕНАРИЙ: Используй разговорный, живой язык. Избегай канцеляризмов.

4. ТАБЛИЦА КАДРОВ: Детально распиши визуальный ряд. Что в кадре? Какой текст на экране? Какая музыка/звуки?

5. ЧЕК-ЛИСТ: Дай советы по свету, звуку или подаче конкретно для этого сценария.

ВЫХОД СТРОГО В JSON:
{
  "extractedText": "Краткая суть",
  "titleOptions": ["Заголовок 1 (Любопытство)", "Заголовок 2 (Выгода)", "Заголовок 3 (Противоречие)", "Заголовок 4 (История)", "Заголовок 5 (Краткий/SEO)"],
  "hookOptions": ["Хук 1", "Хук 2", "Хук 3"],
  "scriptMarkdown": "Текст сценария...",
  "shots": [{ "t": "0-3s", "frame": "Описание", "onScreenText": "Текст", "voiceOver": "Речь", "broll": "Звуки" }],
  "thumbnailIdeas": ["Идея 1", "Идея 2"],
  "hashtags": ["tag1", "tag2"],
  "checklist": ["Совет 1", "Совет 2"]
}`.trim();

const MODEL_NAME = "gemini-3-pro-preview";

export async function generateScenario(req: GenerateRequest): Promise<GenerateResult> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY is missing");

  const ai = new GoogleGenAI({ apiKey });
  const parts: any[] = [];
  
  if (req.input.attachments?.length) {
    for (const a of req.input.attachments) {
      parts.push({ inlineData: { mimeType: a.mimeType, data: a.dataBase64 } });
    }
  }

  const keywords = req.input.text ? req.input.text.split(' ').slice(0, 10).join(', ') : "контент из вложений";

  const promptInput = `
ТЕМА ПОЛЬЗОВАТЕЛЯ: ${req.input.text || "Проанализируй вложения и предложи тему видео"}
КЛЮЧЕВЫЕ СЛОВА ДЛЯ ЗАГОЛОВКОВ: ${keywords}
ПЛАТФОРМА: ${req.options.platform}
ДЛИТЕЛЬНОСТЬ: ${req.options.durationSec} сек
СТИЛЬ: ${req.options.style}
ЦЕЛЬ: ${req.options.direction}
ПРИЗЫВ (CTA): ${req.options.ctaStrength}
ЯЗЫК: Русский
`.trim();

  parts.push({ text: promptInput });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_PROMPT_RU,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 16000 } // Снизил бюджет для ускорения, но оставил для качества
      }
    });

    const rawText = response.text || "";
    const cleanJson = extractJson(stripCodeFences(rawText));
    
    try {
      return JSON.parse(cleanJson) as GenerateResult;
    } catch (parseError) {
      console.error("Failed to parse JSON. Raw text:", rawText);
      console.error("Cleaned text attempted:", cleanJson);
      throw new Error("Модель вернула некорректный формат. Попробуйте уточнить запрос.");
    }
  } catch (e: any) {
    console.error("Gemini Error:", e);
    throw new Error(e.message || "Ошибка API. Попробуйте еще раз.");
  }
}
