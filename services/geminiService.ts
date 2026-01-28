import { GoogleGenerativeAI } from "@google/genai";
import { Ratio } from "../types";

let client: GoogleGenerativeAI | null = null;

function getGeminiClient() {
  if (client) return client;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ VITE_GEMINI_API_KEY is missing");
    return null;
  }

  client = new GoogleGenerativeAI(apiKey);
  return client;
}

export async function generateInterpretation(
  ratio: Ratio
): Promise<string> {
  const gemini = getGeminiClient();

  if (!gemini) {
    return "API Key de Gemini no configurada";
  }

  const model = gemini.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const prompt = `
Eres un analista financiero experto en México.
Ratio: "${ratio.name}"
Valor Actual: ${ratio.value}
Valor Año Anterior: ${ratio.previousValue}
Genera una interpretación profesional (máx. 20 palabras).
`;

  const result = await model.generateContent(prompt);
  return result.response.text() ?? "Sin respuesta";
}
