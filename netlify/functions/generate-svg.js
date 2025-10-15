const systemPrompt = `You are an expert SVG designer specializing in creating layered designs for cutting machines like Cricut and Glowforge, specifically for cake toppers. Analyze the user's prompt and convert it into a structured JSON format representing the layers of an SVG file.

**RULES:**
1.  **JSON Structure:** The root of the JSON object MUST be \`{ "viewBox": "0 0 500 500", "layers": [...] }\`.
2.  **Layers:** The \`layers\` array must contain objects. Each object is a distinct, non-overlapping layer suitable for cutting.
3.  **Layer Object Schema:** Each layer object must have:
    * \`id\`: a unique string ID (e.g., "layer1_text").
    * \`type\`: MUST be either 'path' or 'text'.
    * \`attributes\`: An object containing valid SVG attributes.
4.  **Path Attributes:** For \`type: 'path'\`, \`attributes\` MUST include \`d\` (the SVG path data string) and \`fill\`.
5.  **Text Attributes:** For \`type: 'text'\`, \`attributes\` MUST include \`text\` (the content), \`x\`, \`y\`, \`font-family\` (e.g., 'cursive', 'sans-serif', 'serif'), \`font-size\`, \`font-weight\` ('normal', 'bold'), and \`fill\`. Anchor text in the middle using \`text-anchor: "middle"\`.
6.  **Simplicity:** Designs should be simple, bold, and connected where necessary to form a solid object. Avoid overly complex or thin paths.
7.  **Colors:** Use simple, web-safe hex color codes.`;

exports.handler = async function(event) {
    // We only accept POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required.' }) };
        }

        // Your API Key is now safely stored in Netlify's environment variables
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'API key is not configured.' }) };
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { responseMimeType: "application/json" }
        };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Google API Error:', errorBody);
            return { statusCode: response.status, body: JSON.stringify({ error: `Google API Error: ${response.statusText}` }) };
        }

        const result = await response.json();
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!jsonText) {
            return { statusCode: 500, body: JSON.stringify({ error: "Received an empty response from the AI." }) };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: jsonText // We return the raw JSON text from Google
        };

    } catch (error) {
        console.error('Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'An internal server error occurred.' })
        };
    }
};
