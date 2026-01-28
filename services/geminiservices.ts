import { GoogleGenAI, Modality } from "@google/genai";
import { PrayerStyle } from "../types";

// Initialize AI Client
// API Key is strictly from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a prayer text based on user inputs (Text or Audio).
 * Uses gemini-3-pro-preview for advanced creative writing.
 */
export const generatePrayerText = async (
  recipient: string,
  style: PrayerStyle,
  topic?: string,
  audioBase64?: string
): Promise<string> => {
  try {
    const parts: any[] = [];

    // Construct the prompt based on available inputs
    let promptText = `Write a short, soulful, and poetic prayer for ${recipient}. 
    The tone should be ${style.toLowerCase()}. 
    Keep it under 100 words. 
    Focus on light, hope, and connection. 
    Do not use traditional religious jargon unless asked, keep it universal and spiritual.`;

    if (audioBase64) {
      // Multimodal Input: Audio + Text
      parts.push({
        inlineData: {
          mimeType: "audio/wav",
          data: audioBase64,
        },
      });
      promptText +=
        " The intent of the prayer is described in the attached audio. Listen closely to the speaker's emotion and meaning.";
    } else if (topic) {
      // Text only input
      promptText += ` The prayer is regarding "${topic}".`;
    }

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Upgraded to Pro for better creative writing
      contents: { parts },
      config: {
        systemInstruction:
          "You are a gentle spiritual guide. Your words are soothing, poetic, and full of light.",
        temperature: 0.8, // Slightly higher for more creativity
      },
    });

    return response.text || "May light find its way to you.";
  } catch (error) {
    console.error("Error generating prayer text:", error);
    throw new Error("Could not generate prayer. Please try again.");
  }
};

/**
 * Generates an ethereal background image for the prayer card.
 */
export const generatePrayerImage = async (
  topic: string,
  style: PrayerStyle
): Promise<string> => {
  try {
    // If we only have audio (no topic string), we use the style to guide the image
    const effectiveTopic = topic || `A spiritual feeling of ${style}`;

    const prompt = `Abstract ethereal digital art representing ${effectiveTopic}, spiritual, glowing light beams, nebulae, soft colors, dreamlike, cinematic lighting, 8k resolution, photorealistic masterpiece, golden particles.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    // Extract image from response parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    return "";
  } catch (error) {
    console.error("Error generating image:", error);
    return "";
  }
};

/**
 * Text-to-Speech generation using Gemini.
 */
export const generatePrayerAudio = async (
  text: string
): Promise<AudioBuffer | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      audioContext,
      24000,
      1
    );

    return audioBuffer;
  } catch (error) {
    console.error("Error generating audio:", error);
    return null;
  }
};

// --- Audio Helpers ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
