const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const key = process.env.VITE_GEMINI_API_KEY;
const models = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-1.0-pro',
    'gemini-1.0-pro-latest',
    'gemini-flash-latest'
];

async function run() {
    console.log("Testing API Key:", key ? "Found" : "Missing");
    for (const m of models) {
        try {
            const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
            });
            const text = await r.text();
            console.log(m, "->", r.status, r.status === 200 ? "OK" : "Error");
            if (r.status !== 200) {
                console.log("   ", text.slice(0, 50));
            }
        } catch (e) {
            console.log(m, "-> Fetch error:", e.message);
        }
    }
}
run();
