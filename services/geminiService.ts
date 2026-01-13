
import { GoogleGenAI } from "@google/genai";
import { Ratio } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateInterpretation = async (ratio: Ratio): Promise<string> => {
    
    const prompt = `
        Eres un analista financiero experto en México.
        Genera una interpretación concisa y profesional en español (máximo 20 palabras) para un reporte de crédito.
        
        Ratio: "${ratio.name}"
        Valor Actual: ${ratio.value}
        Valor Año Anterior: ${ratio.previousValue}
        
        Ejemplo de respuesta: "La rentabilidad sobre patrimonio (ROE) creció 3.2 p.p. respecto al año anterior, indicando mejora en eficiencia del capital."
        
        Tu interpretación:
    `;

    try {
        // Use gemini-3-flash-preview for Basic Text Tasks
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        // Access .text property directly (not a method)
        return response.text?.trim() || `Sin interpretación disponible para ${ratio.name}.`;
    } catch (error) {
        console.error("Error generating interpretation:", error);
        return `Error al generar interpretación para ${ratio.name}.`;
    }
};
