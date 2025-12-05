import { GoogleGenAI, Type } from "@google/genai";
import { Language, Mode } from "../types";

// Helper to convert File/Blob to Base64
const fileToGenerativePart = async (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractTextFromImage = async (imageFile: File, language: Language): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToGenerativePart(imageFile);

  const prompt = language === Language.CHINESE 
    ? "請識別這張圖片中的所有中文文字。直接輸出文字即可，不需要解釋。" 
    : "Please OCR all the English text in this image. Output the text directly without explanation.";

  const model = 'gemini-2.5-flash'; // Good for OCR

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: imageFile.type, data: base64Data } },
          { text: prompt }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("OCR Error:", error);
    throw error;
  }
};

export const processTextForDictation = async (rawText: string, mode: Mode, language: Language): Promise<{ display: string, spoken: string }[]> => {
    if (!process.env.API_KEY) {
      // Fallback for demo if no key, simple split
      return rawText.split('\n').map(t => ({ display: t, spoken: t }));
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';

    let prompt = "";
    if (mode === Mode.VOCABULARY) {
      if (language === Language.CHINESE) {
        // CHINESE VOCABULARY STRICT PROMPT
        prompt = `
          請列出這段文字中的詞語 (Vocabulary)。
          回傳一個 JSON Array。
          每個物件必須包含：
          "display": 書寫的詞語 (Traditional Chinese)。
          "spoken": 必須完全一樣的中文詞語 (Traditional Chinese)。
          **絕對不要**使用拼音 (Pinyin) 或英文解釋。
          
          Text: ${rawText}
        `;
      } else {
        // ENGLISH VOCABULARY
        prompt = `
          List the vocabulary items from this text. 
          Return a JSON array of objects.
          Each object should have:
          "display": The word as written.
          "spoken": The word as it should be pronounced.
          
          Text: ${rawText}
        `;
      }
    } else {
      // PASSAGE MODE
      if (language === Language.ENGLISH) {
        prompt = `
          Task: Break this English text into dictation-friendly chunks.
          1. Break long sentences into smaller, meaningful semantic phrases (4-6 words max) to give students time to write.
          2. CRITICAL: In the "spoken" field, you MUST replace ALL punctuation marks with their spoken names.
             - "." becomes "Full stop"
             - "," becomes "Comma"
             - "?" becomes "Question mark"
             - "!" becomes "Exclamation mark"
             - "'" becomes "Apostrophe" (if used for possession, otherwise silent context dependent)
             - """ becomes "Quote" or "Unquote"
          3. The "display" field should show the original text chunk with normal punctuation.

          Text: ${rawText}

          Return a JSON array of objects:
          { "display": "The text chunk.", "spoken": "The text chunk Full stop" }
        `;
      } else {
        // Chinese Passage
        prompt = `
          請將這段文字分拆成適合默書的短句（約4-6個字，或根據語氣停頓）。
          在 "spoken" 欄位中，必須明確讀出標點符號（例如："," 讀作 "逗號"，"。" 讀作 "句號"，"？" 讀作 "問號"）。
          注意：必須使用繁體中文。
          
          Text: ${rawText}

          Return a JSON array of objects:
          { "display": "顯示的文字，", "spoken": "顯示的文字 逗號" }
        `;
      }
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              display: { type: Type.STRING },
              spoken: { type: Type.STRING }
            },
            propertyOrdering: ["display", "spoken"]
          }
        }
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) return [];
    
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      return [];
    }
};