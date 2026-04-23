const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");

// Cargar .env manualmente si existe (para local)
function loadEnv() {
    const envPath = path.join(__dirname, "../.env");
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        envContent.split("\n").forEach(line => {
            const [key, ...value] = line.split("=");
            if (key && value) {
                process.env[key.trim()] = value.join("=").trim().replace(/^["']|["']$/g, "");
            }
        });
    }
}

async function ping() {
    loadEnv();
    const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
        console.error("Error: No API Key found in environment variables (GROQ_API_KEY or VITE_GROQ_API_KEY).");
        process.exit(1);
    }
    
    console.log(`API Key detectada: ${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`);

    const groq = new Groq({ apiKey });

    try {
        console.log("Iniciando llamada de mantenimiento a Groq...");
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: "ping",
                },
            ],
            model: "llama-3.3-70b-versatile",
            max_tokens: 5,
        });

        console.log("Respuesta recibida:", chatCompletion.choices[0]?.message?.content);
        console.log("¡Mantenimiento completado con éxito!");
    } catch (error) {
        console.error("Error durante la llamada a Groq:", error.message);
        process.exit(1);
    }
}

ping();
