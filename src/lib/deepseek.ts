import { GoogleGenAI } from "@google/genai";
import crypto from "node:crypto";

function uuid() {
  return crypto.randomUUID();
}

export async function DeepSeekThinking(
  prompt: string,
  history: { user: string; assistant: string }[] = []
) {
  const conversationId = uuid();
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "AIzaSyCrzIl0CP3-rUgNZmTy065TdH3MCn4SDOc" });
    
    // Convert history into Gemini expected format
    const contents = history.map((item) => {
       return [
          { role: "user", parts: [{ text: item.user }] },
          { role: "model", parts: [{ text: item.assistant }] }
       ];
    }).flat();

    // Add the current prompt and explicit system instructions to simulate deepseek
    contents.push({ role: "user", parts: [{ text: prompt }] });

    const systemInstruction = `Kamu adalah sebuah AI Assistant canggih.
Kamu HARUS mematuhi format balasan berikut TANPA KECUALI. Kamu harus memiliki pemikiran internal lalu memberikan jawaban:

<think>
(Tuliskan proses berpikirmu, analisis, dan rencanamu di sini. Jangan menyapa pengguna atau menaruh jawaban akhir di dalam tag ini.)
</think>
(Tuliskan jawaban final yang sangat rapi, terstruktur, ramah, dan informatif di sini.)

ATURAN MUTLAK:
1. Kamu WAJIB menyertakan tag <think> dan tag penutup </think>.
2. Jawaban akhir yang disajikan ke pengguna HARUS berada di LUAR blok <think>.
3. Gunakan formatting Markdown yang rapi (bold, list, spasi) untuk jawaban final.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents as any,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const fullText = response.text || "";
    let answer = fullText;
    let reasoning = "";

    // Parse the <think> block robustly
    const thinkMatch = fullText.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch) {
      reasoning = thinkMatch[1].trim();
      answer = fullText.replace(thinkMatch[0], "").trim();
    } else {
      const thinkStart = fullText.indexOf("<think>");
      if (thinkStart !== -1) {
        reasoning = fullText.slice(thinkStart + 7).trim();
        answer = "";
      }
    }

    return {
      status: 200,
      success: true,
      conversation_id: conversationId,
      model: "gemini-simulated-deepseek",
      chat_mode: "deep_think",
      prompt,
      answer,
      reasoning,
      history_used: Math.min(history.length, 5),
    };
  } catch (error: any) {
    console.error("Error in simulated DeepSeek:", error);
    return {
      status: 500,
      success: false,
      conversation_id: conversationId,
      model: "gemini-simulated-deepseek",
      chat_mode: "deep_think",
      prompt,
      answer: "",
      reasoning: "",
      history_used: Math.min(history.length, 5),
      error: "Gagal mendapatkan respons AI: " + (error.message || "Unknown error"),
    };
  }
}

