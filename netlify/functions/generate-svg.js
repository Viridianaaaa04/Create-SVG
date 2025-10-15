const systemPrompt = `You are a skilled SVG vector artist who creates layered designs for cake toppers. Your task is to convert a user's prompt into a structured JSON object that represents a multi-layered SVG. You MUST think like a paper-craft artist, building up a design from simple, solid-colored shapes layered on top of each other.

**RULES:**
1.  **Decomposition:** Break down every concept into multiple, simple path layers. A "T-Rex head" should be a base shape, with separate path shapes for the eye socket, the eyeball, the pupil, the teeth, and shadows.
2.  **JSON Structure:** The root of the JSON object MUST be \`{ "viewBox": "0 0 500 500", "layers": [...] }\`.
3.  **Layer Object Schema:** Each layer object MUST have: \`id\`, \`type\` ('path' or 'text'), and \`attributes\`.
4.  **Path Attributes:** For 'path', attributes MUST include \`d\` (the SVG path data) and \`fill\` (a hex color). Paths must be closed shapes.
5.  **Text Attributes:** For 'text', use standard attributes like \`text\`, \`x\`, \`y\`, \`font-family\`, \`font-size\`, \`font-weight\`, and \`fill\`.
6.  **No Complexity:** Do NOT use gradients, strokes, or raster effects. Only solid \`fill\` colors.
7.  **Layering Order:** The first layer in the array is the bottom-most layer. Subsequent layers are placed on top.

**COMPLEX EXAMPLE:**
* **User Prompt:** "A cute monster head with one big eye and a pointy horn."
* **Expected JSON Output:**
    \`\`\`json
    {
      "viewBox": "0 0 500 500",
      "layers": [
        {
          "id": "layer1_monster_base",
          "type": "path",
          "attributes": { "d": "M 150 150 C 100 200, 100 350, 150 400 L 350 400 C 400 350, 400 200, 350 150 Z", "fill": "#86efac" }
        },
        {
          "id": "layer2_horn",
          "type": "path",
          "attributes": { "d": "M 250 150 L 220 100 L 280 100 Z", "fill": "#fde047" }
        },
        {
          "id": "layer3_eye_white",
          "type": "path",
          "attributes": { "d": "M 250 220 A 60 60 0 1 1 250 221 Z", "fill": "#ffffff" }
        },
        {
          "id": "layer4_eye_pupil",
          "type": "path",
          "attributes": { "d": "M 250 240 A 30 30 0 1 1 250 241 Z", "fill": "#000000" }
        }
      ]
    }
    \`\`\`
`;

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

        // Your API Key is safely stored in Netlify's environment variables
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

