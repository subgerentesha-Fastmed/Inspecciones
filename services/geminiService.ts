import { GoogleGenAI } from "@google/genai";
import { ClientData, InspectionDetail } from "../types";

/**
 * Genera un informe narrativo profesional utilizando Gemini 3 Pro.
 * No requiere que el usuario ingrese una API Key manualmente.
 */
export const generateSSTReport = async (
  client: ClientData,
  findings: InspectionDetail[],
  compliance: string,
  riskBs: string,
  riskUsd: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const categorizedFindings = findings.reduce((acc, f) => {
    if (!acc[f.sec]) acc[f.sec] = [];
    acc[f.sec].push(f);
    return acc;
  }, {} as Record<string, InspectionDetail[]>);

  const contextData = Object.entries(categorizedFindings).map(([area, items]) => {
    return `ÁREA: ${area}\n` + items.map(i => `- Desviación: ${i.q}\n  Hallazgo: ${i.obs}\n  Acción Recomendada: ${i.act}`).join('\n');
  }).join('\n\n');

  const prompt = `Actúa como un Consultor Senior de Seguridad y Salud en el Trabajo (SST) experto en la LOPCYMAT. 
  Genera un INFORME TÉCNICO en formato de MEMORÁNDUM EJECUTIVO para '${client.cliente}'.
  
  DATOS CLAVE:
  - Cliente: ${client.cliente}
  - Fecha: ${client.fecha}
  - Nivel de Cumplimiento: ${compliance}
  - Riesgo Económico: ${riskBs} (${riskUsd})
  - Inspector: ${client.inspector}
  
  HALLAZGOS TÉCNICOS:
  ${contextData}

  REQUISITOS DEL DOCUMENTO:
  - Usa tags HTML: <h3>, <p>, <ul>, <li>, <b>.
  - El texto debe ser negro (#000).
  - Estructura: Encabezado de Memorándum (De, Para, Asunto, Fecha), Resumen Ejecutivo, Diagnóstico Situacional Narrativo, Marco Legal y Recomendaciones Prioritarias.
  - El tono debe ser profesional, persuasivo y técnico.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    
    return response.text || "No se pudo generar el texto del informe.";
  } catch (error) {
    console.error("AI Service Error:", error);
    throw new Error("Error al conectar con el servicio de IA.");
  }
};