import { GoogleGenAI } from "@google/genai";
import { Ratio } from "../types";

function getGeminiClient() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ Gemini API Key not found");
    return null;
  }

  return new GoogleGenAI({ apiKey });
}

export const generateInterpretation = async (
  ratio: Ratio
): Promise<string> => {
  const ai = getGeminiClient();

  if (!ai) {
    return "Error: API Key de Gemini no configurada.";
  }

  const prompt = `
    Eres un analista financiero experto en México.
    Genera una interpretación concisa y profesional en español (máximo 20 palabras).

    Ratio: "${ratio.name}"
    Valor Actual: ${ratio.value}
    Valor Año Anterior: ${ratio.previousValue}

    Tu interpretación:
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text?.trim() || "Sin interpretación disponible.";
  } catch (error) {
    console.error("Error Gemini:", error);
    return "Error al generar interpretación.";
  }
};
