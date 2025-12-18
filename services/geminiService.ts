
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
  "titleOptions": ["Заголовок 1", "Заголовок 2", "Заголовок 3", "Заголовок 4", "Заголовок 5"],
  "hookOptions": ["Хук 1", "Хук 2", "Хук 3"],
  "scriptMarkdown": "Текст сценария...",
  "shots": [{ "t": "0-3s", "frame": "Описание", "onScreenText": "Текст", "voiceOver": "Речь", "broll": "Звуки" }],
  "thumbnailIdeas": ["Подробное описание визуальной идеи для обложки 1", "Подробное описание визуальной идеи для обложки 2", "Подробное описание визуальной идеи для обложки 3"],
  "hashtags": ["tag1", "tag2"],
  "checklist": ["Совет 1", "Совет 2"]
}`.trim();

const TEXT_MODEL_NAME = "gemini-3-pro-preview";
const IMAGE_MODEL_NAME = "gemini-2.5-flash-image";

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

  const promptInput = `
ТЕМА: ${req.input.text || "Проанализируй вложения"}
ПЛАТФОРМА: ${req.options.platform}
ДЛИТЕЛЬНОСТЬ: ${req.options.durationSec} сек
СТИЛЬ: ${req.options.style}
ЦЕЛЬ: ${req.options.direction}
`.trim();

  parts.push({ text: promptInput });

  const response = await ai.models.generateContent({
    model: TEXT_MODEL_NAME,
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_PROMPT_RU,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 16000 }
    }
  });

  const rawText = response.text || "";
  return JSON.parse(extractJson(stripCodeFences(rawText))) as GenerateResult;
}

/**
 * Генерирует визуальное превью для идеи обложки
 */
export async function generateThumbnailVisual(idea: string): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY is missing");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL_NAME,
    contents: {
      parts: [
        {
          text: `Create an ultra-professional, hyper-realistic viral YouTube thumbnail visual based on this concept: "${idea}". 
          The scene should have cinematic lighting, dynamic composition, and high-contrast colors (e.g., complementary color schemes). 
          Ensure a strong central focal point with blurred background (bokeh). Style should be clean, modern, and high-fidelity. 
          ABSOLUTELY NO TEXT, NO WATERMARKS, NO INTERFACE ELEMENTS. The image should look like a high-end photography or professional 3D render.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Не удалось извлечь изображение из ответа модели");
}
