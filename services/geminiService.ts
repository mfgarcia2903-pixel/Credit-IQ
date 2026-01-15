import { GoogleGenAI } from "@google/genai";
import { Ratio } from "../types";

// ✅ Leer la API Key desde Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

// ✅ Validación defensiva
if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY no está definida");
}

// ✅ Inicialización correcta para frontend
const ai = new GoogleGenAI({ apiKey });

export const generateInterpretation = async (
  ratio: Ratio
): Promise<string> => {
  const prompt = `
Eres un analista financiero experto en México.
Genera una interpretación concisa y profesional en español (máximo 20 palabras).

Ratio: "${ratio.name}"
Valor Actual: ${ratio.value}
Valor Año Anterior: ${ratio.previousValue}

Ejemplo de respuesta:
"La rentabilidad sobre patrimonio (ROE) creció 3.2 p.p. respecto al año anterior, indicando mejora en eficiencia del capital."

Tu interpretación:
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return (
      response.text?.trim() ??
      `Sin interpretación disponible para ${ratio.name}.`
    );
  } catch (error) {
    console.error("Error generating interpretation:", error);
    return `Error al generar interpretación para ${ratio.name}.`;
  }
};
