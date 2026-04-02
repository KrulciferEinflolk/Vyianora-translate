import Groq from "groq-sdk";
import { KJI_RULES } from "../constants/kjiRules";

let _groq = null;

const getGroqClient = () => {
    if (!_groq) {
        const apiKey = import.meta.env.VITE_GROQ_API_KEY;
        if (!apiKey) throw new Error("No se ha configurado la API Key de Groq. Por favor añade VITE_GROQ_API_KEY a tu archivo .env");

        // Habilitamos dangerouslyAllowBrowser ya que el motor corre 100% en el cliente de React (Vite)
        _groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
    }
    return _groq;
};

const executeAI = async (prompt) => {
    try {
        const groq = getGroqClient();
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Eres una IA estricta que SIGUE instrucciones. SIEMPRE debes responder en JSON válido, usando el formato requerido y nada más."
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            // Utilizamos el inmenso modelo Llama 3.3 de 70 Billones de parámetros para un raciocinio inmejorable
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            response_format: { type: "json_object" } // Fuerza salidas JSON puras
        });

        const text = chatCompletion.choices[0]?.message?.content || "";
        const cleanText = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Groq AI Error:", error);
        if (error.message?.includes("429") || error.message?.includes("rate limit")) {
            throw new Error("Has excedido la cuota gratuita de Groq. Por favor espera un instante y reintenta.");
        }
        throw new Error("Fallo de Modelo / Red: " + error.message);
    }
};

export const analyzeVyioPhrase = async (items) => {
    const systemPrompt = `
Eres el Motor Lingüístico y Analizador de la lengua construida Vyianóra.
Tu objetivo es analizar la secuencia de morfemas/raíces/palabras que el usuario ha seleccionado, verificar si siguen las reglas visuales y conceptuales de Vyianóra, y sugerir mejoras, correcciones y clasificaciones.

REGLAS MAESTRAS DE VYIANÓRA:
${KJI_RULES}

INSTRUCCIONES DE RESPUESTA:
1. Revisa la secuencia de ítems proporcionados.
2. Analiza si el orden o la combinación empata lógicamente (ej. dominación de núcleos, estructura visual).
3. Responde ESTRICTAMENTE en JSON válido con la siguiente estructura y en español:
{
  "valido": true o false (evaluación lógica de la estructura),
  "correccion": "La secuencia ideal (si hay error) o confirmación de validez",
  "traduccionSugerida": "El significado literal propuesto de esta combinación de trazos o morfemas unidos",
  "categoria": "Categoría o nivel resultantes (Ej: EMOCIÓN CONTENIDA, Nivel 2)",
  "analisis": "Explicación de por qué significa eso (Ej: 'El núcleo de ESENCIA está dominado por el trazo de PODER, lo que rompe la curba...')",
  "sugerenciaComplemento": "Sugerir otro trazo/morfema u orden que enriquecería la frase."
}

Morfemas en el tapiz del usuario:
${JSON.stringify(items.map(i => ({ vyio: i.vyio, spanish: i.spanish, tipo: i.type })), null, 2)}

Asegúrate de NO incluir formato markdown extra, solo devuelve el objeto JSON puro.
`;
    return await executeAI(systemPrompt);
};

export const generateLexiconItem = async (type, partialData, extraContext = null) => {
    const prompt = `
Eres el lingüista creador de Vyianóra.
REGLAS MAESTRAS DE VYIANÓRA:
${KJI_RULES}

El usuario quiere autocompletar un elemento del diccionario de tipo: "${type}".
Los datos que proporcionó hasta el momento son:
${JSON.stringify(partialData, null, 2)}

${extraContext ? `CONTEXTO ADICIONAL PARA TU DECISIÓN: ${JSON.stringify(extraContext)}` : ''}

INSTRUCCIONES:
Completa lógicamente lo que falta. Si falta el Vyio inventa una sílaba potente y fonética (ej: kor, zen, vy). Si falta Español, deduce un concepto. Si es raíz, debes asignar la categoría MÁS ACORDE AL SIGNIFICADO. Si te pasaron categorías en el contexto adicional, DEBES escoger EXACTAMENTE una de esa lista.
Responde ESTRICTAMENTE con un JSON válido.
Si tipo == "categoria", devuelve: {"name": "nombre_logico"}
Si tipo == "raiz", devuelve: {"vyio": "sílaba", "spanish": "significado", "category": "categoria_sugerida"}
Si tipo == "modificador", devuelve: {"vyio": "sílaba", "spanish": "significado"}
Ningún otro texto.
`;
    return await executeAI(prompt);
};

export const generateWordFromMeaning = async (meaning, roots, prefixes, suffixes) => {
    const prompt = `
Eres el armador de Morfemas de Vyianóra.
El usuario quiere construir un morfema compuesto (Palabra) con este significado en español: "${meaning}".
Tus piezas disponibles son:
RAÍCES: ${JSON.stringify(roots.map(r => r.vyio + "=" + r.spanish))}
PREFIJOS: ${JSON.stringify(prefixes.map(p => p.vyio + "=" + p.spanish))}
SUFIJOS: ${JSON.stringify(suffixes.map(s => s.vyio + "=" + s.spanish))}

Selecciona la mejor raíz (obligatorio), y opcionalmente un prefijo y un sufijo que combinados representen el significado solicitado.
Responde ESTRICTAMENTE en JSON con este formato:
{
  "selectedRoot": "vyio_de_la_raiz_elegida",
  "selectedPrefix": "vyio_del_prefijo_elegido_o_vacio",
  "selectedSuffix": "vyio_del_sufijo_elegido_o_vacio"
}
Ningún texto adicional.
`;
    return await executeAI(prompt);
};

export const generatePhraseFromMeaning = async (intent, allElements) => {
    const prompt = `
Eres el Tejedor de Decretos en Vyianóra.
REGLAS MAESTRAS DE GRAMÁTICA Y ESTRUCTURA DE VYIANÓRA:
${KJI_RULES}

El usuario quiere formar una frase para expresar: "${intent}".
Tienes estas piezas en tu biblioteca:
${JSON.stringify(allElements.map(e => ({ id: e.firebaseId, vyio: e.vyio, span: e.spanish, type: e.type })))}

Construye una secuencia lógica usando SOLO los elementos proporcionados. Aplica estrictamente las reglas de dominancia y orden (ej: prefijo, raíz dominante, sufijo, etc).
Devuelve entre 2 y 6 elementos.
Responde ESTRICTAMENTE en JSON con un arreglo de los "id" que seleccionaste en orden para formar la secuencia válida:
{
  "selectedIds": ["id1", "id2", ...]
}
Ningún texto adicional.
`;
    return await executeAI(prompt);
};
