import { GoogleGenAI } from "@google/genai";
import crypto from "node:crypto";

export const config = {
  runtime: 'edge', // Using Edge runtime for better performance, or 'node'
};

function uuid() {
  return crypto.randomUUID();
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { prompt, history } = await req.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400 });
    }

    const conversationId = uuid();
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const contents = (history || []).map((item: any) => {
       return [
          { role: "user", parts: [{ text: item.user }] },
          { role: "model", parts: [{ text: item.assistant }] }
       ];
    }).flat();

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

    return new Response(JSON.stringify({
      success: true,
      conversation_id: conversationId,
      prompt,
      answer,
      reasoning,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Vercel API Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Gagal mendapatkan respons AI: " + (error.message || "Unknown error"),
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
