
import { GoogleGenAI } from "@google/genai";
import { GenerateRequest, GenerateResult } from "../types";
import { stripCodeFences } from "../utils";

const SYSTEM_PROMPT_RU = `ПРОМПТ ДЛЯ GEMINI 3 FLASH — “VIDEO SCRIPT ENGINE (FAST & ACCURATE)”

Ты — эксперт по созданию видео-контента. Твоя задача — создать идеальный сценарий видео на основе темы и материалов.

СТРУКТУРА ВЫХОДА (JSON):
{
  "extractedText": "Краткая выжимка материалов",
  "titleOptions": ["3 варианта цепляющих заголовков"],
  "hookOptions": ["3 варианта мощных вступлений"],
  "scriptMarkdown": "Полный текст сценария в Markdown",
  "shots": [{ "t": "00:00", "frame": "Описание кадра", "onScreenText": "Текст", "voiceOver": "Речь", "broll": "Спецэффекты" }],
  "thumbnailIdeas": ["Идеи для обложки"],
  "hashtags": ["теги"],
  "checklist": ["что проверить перед съемкой"]
}
`.trim();

// Используем gemini-3-flash-preview — самая быстрая и стабильная модель для API-ключей
const MODEL_NAME = "gemini-3-flash-preview";

export async function generateScenario(req: GenerateRequest): Promise<GenerateResult> {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error(
      "API_KEY не найден в системе. Пожалуйста, проверьте Environment Variables в Vercel и обязательно нажмите REDEPLOY во вкладке Deployments."
    );
  }

  // Создаем экземпляр AI непосредственно перед вызовом для актуальности ключа
  const ai = new GoogleGenAI({ apiKey });

  const parts: any[] = [];
  
  if (req.input.attachments && req.input.attachments.length > 0) {
    for (const a of req.input.attachments) {
      parts.push({
        inlineData: {
          mimeType: a.mimeType,
          data: a.dataBase64
        }
      });
    }
  }

  const aspectRatio = req.options.platform === 'youtube' ? '16:9' : '9:16';
  
  const promptInput = `
Topic: ${req.input.text || "Проанализируй вложения и предложи сценарий."}
Platform: ${req.options.platform}
Duration: ${req.options.durationSec}s
Style: ${req.options.style}
Goal: ${req.options.direction}
CTA: ${req.options.ctaStrength}
Language: Russian
`.trim();

  parts.push({ text: promptInput });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_PROMPT_RU,
        responseMimeType: "application/json",
        // Для Flash модели устанавливаем минимальный бюджет размышлений для скорости
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    const raw = response.text || "";
    const cleaned = stripCodeFences(raw);
    
    return JSON.parse(cleaned) as GenerateResult;
  } catch (e: any) {
    const errorMsg = e.message || "";
    
    // 401 / OAuth2 error usually means model selection issue or key mismatch
    if (errorMsg.includes("401") || errorMsg.includes("not supported by this API")) {
      throw new Error(
        "ОШИБКА ДОСТУПА (401).\n\n" +
        "Ваш API Key не может авторизоваться. \n" +
        "1. Убедитесь, что ключ создан в Google AI Studio.\n" +
        "2. Проверьте, что в Vercel ключ вставлен БЕЗ лишних пробелов.\n" +
        "3. ОБЯЗАТЕЛЬНО сделайте Redeploy после смены ключа."
      );
    }

    if (errorMsg.includes("leaked") || errorMsg.includes("403")) {
      throw new Error("КЛЮЧ ЗАБЛОКИРОВАН (Leaked). Google обнаружил его в сети. Создайте НОВЫЙ ключ в AI Studio и обновите его в Vercel.");
    }
    
    console.error("Gemini API Error:", e);
    throw new Error(errorMsg || "Ошибка генерации. Попробуйте еще раз через минуту.");
  }
}
