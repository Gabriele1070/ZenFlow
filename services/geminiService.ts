import { GoogleGenAI, Modality } from "@google/genai";
import { decodeAudioData } from "./audioUtils";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is missing from environment variables");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Generates the written meditation script.
 */
export const generateMeditationScript = async (topic: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Crea uno script dettagliato per una meditazione guidata sul tema: "${topic}". 
      
      Istruzioni:
      1. Scrivi in Italiano.
      2. Usa un tono calmo, accogliente e rilassante.
      3. Struttura la meditazione in: Introduzione (respiro), Corpo centrale (visualizzazione legata al tema "${topic}"), e Conclusione (ritorno al presente).
      4. NON aggiungere titoli, bullet points o marcatori come "Introduzione:". Scrivilo come un flusso continuo di testo che verrebbe letto ad alta voce.
      5. Usa pause naturali nel testo.
      6. Lunghezza ideale: circa 200-300 parole.`,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "Mi dispiace, non sono riuscito a generare la meditazione. Riprova.";
  } catch (error) {
    console.error("Error generating script:", error);
    throw error;
  }
};

/**
 * Generates audio from the provided text using Gemini TTS.
 */
export const generateMeditationAudio = async (text: string, audioContext: AudioContext): Promise<AudioBuffer> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is often good for calm female voice, 'Fenrir' for male
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from API");
    }

    return await decodeAudioData(base64Audio, audioContext, 24000, 1);
  } catch (error) {
    console.error("Error generating audio:", error);
    throw error;
  }
};