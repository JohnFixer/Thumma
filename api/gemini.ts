// @ts-ignore
import { GoogleGenAI } from "@google/genai";

// This is a Vercel serverless function.
// It receives a request from the frontend, calls the Gemini API securely,
// and sends the response back.

export default async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { prompt, systemInstruction } = await req.json();

        if (!process.env.API_KEY) {
            return new Response(JSON.stringify({ error: 'API key not configured on the server.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        if (!prompt) {
             return new Response(JSON.stringify({ error: 'Prompt is required.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // FIX: The GoogleGenAI constructor requires a named `apiKey` parameter.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { systemInstruction }
        });

        const text = response.text;
        
        return new Response(JSON.stringify({ text }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Error in Gemini API function:', error);
        return new Response(JSON.stringify({ error: error.message || 'An internal server error occurred.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

// Vercel Edge Runtime configuration
export const config = {
  runtime: 'edge',
};