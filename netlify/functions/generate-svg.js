const systemPrompt = `You are a master vector illustrator who creates intricate, layered designs for cake toppers suitable for cutting machines. Your primary goal is to translate a user's prompt into a structured JSON object for a multi-layered SVG. You MUST simulate complex visual effects like shading, texture, and highlights by using multiple, cleverly layered, solid-colored path shapes.

**RULES:**
1.  **Decomposition is Key:** Aggressively break down every concept into multiple path layers. A "T-Rex head" isn't one shape; it's a base head shape, plus separate path shapes for shadows, highlights, individual scales, eye sockets, the eyeball, the pupil, and teeth.
2.  **Simulate Complexity with Layers:** To create the illusion of texture, shading, or detail, you MUST use multiple, overlapping, solid-colored path layers.
    * **For Shading:** Add a new, darker-colored path shape on top of the base layer to represent a shadow.
    * **For Texture (e.g., 'scales', 'stone cracks'):** Overlay the base shape with many smaller, slightly darker or lighter path shapes.
3.  **JSON Structure:** The root of the JSON object MUST be \`{ "viewBox": "0 0 500 500", "layers": [...] }\`.
4.  **Layer Object Schema:** Each layer object MUST have: \`id\`, \`type\` ('path' or 'text'), and \`attributes\`.
5.  **Path Attributes:** For 'path', attributes MUST include \`d\` (the SVG path data) and \`fill\` (a hex color). All paths must be closed shapes.
6.  **Absolutely No Gradients or Strokes:** All visual effects must be achieved by layering solid-colored fills.
7.  **Layering Order:** The first layer in the array is the bottom-most layer. Subsequent layers are placed on top.

**ADVANCED EXAMPLE (SIMULATING SHADING):**
* **User Prompt:** "a shaded red ball"
* **Expected JSON Output:**
    \`\`\`json
    {
      "viewBox": "0 0 100 100",
      "layers": [
        {
          "id": "layer1_ball_base",
          "type": "path",
          "attributes": { "d": "M 50 10 A 40 40 0 1 1 50 90 A 40 40 0 1 1 50 10 Z", "fill": "#ef4444" }
        },
        {
          "id": "layer2_ball_shadow",
          "type": "path",
          "attributes": { "d": "M 50 50 A 40 40 0 1 0 85 85 A 40 40 0 0 1 50 50 Z", "fill": "#b91c1c" }
        },
        {
          "id": "layer3_ball_highlight",
          "type": "path",
          "attributes": { "d": "M 40 30 A 10 10 0 1 1 40 31 Z", "fill": "#fca5a5" }
        }
      ]
    }
    \`\`\`
`;

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt, maxLayers, maxColors } = JSON.parse(event.body);
        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required.' }) };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'API key is not configured.' }) };
        }
        
        // --- NEW: Add user constraints to the prompt ---
        let finalPrompt = prompt;
        let constraints = [];
        if (maxLayers) constraints.push(`Use no more than ${maxLayers} layers.`);
        if (maxColors) constraints.push(`Use no more than ${maxColors} distinct colors.`);
        
        if (constraints.length > 0) {
            finalPrompt += `\n\n**Design Constraints:**\n- ${constraints.join('\n- ')}`;
        }
        // --- END NEW ---

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: finalPrompt }] }], // Use the new prompt with constraints
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
            body: jsonText
        };

    } catch (error) {
        console.error('Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'An internal server error occurred.' })
        };
    }
};

