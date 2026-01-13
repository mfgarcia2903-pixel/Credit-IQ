import { GoogleGenerativeAI } from "@google/genai";
import { Ratio } from "../types";

let genAI: GoogleGenerativeAI | null = null;

function getClient() {
  if (genAI) return genAI;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

export async function generateInterpretation(
  ratio: Ratio
): Promise<string> {
  const client = getClient();
  if (!client) return "API Key no configurada";

  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

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

