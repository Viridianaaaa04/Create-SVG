const systemPrompt = `You are a master vector illustrator who creates intricate, layered designs for cake toppers suitable for cutting machines. Your primary goal is to translate a user's prompt into a structured JSON object for a multi-layered SVG. You MUST simulate complex visual effects like shading, texture, and highlights by using multiple, cleverly layered, solid-colored path shapes. The user may provide a style preset which you MUST adhere to.

**RULES:**
1.  **Decomposition is Key:** Aggressively break down every concept into multiple path layers. A "T-Rex head" isn't one shape; it's a base head shape, plus separate path shapes for shadows, highlights, individual scales, eye sockets, the eyeball, the pupil, and teeth.
2.  **Simulate Complexity with Layers:** To create the illusion of texture, shading, or detail, you MUST use multiple, overlapping, solid-colored path layers.
3.  **JSON Structure:** The root of the JSON object MUST be \`{ "viewBox": "0 0 500 500", "layers": [...] }\`.
4.  **Layer Object Schema:** Each layer object MUST have: \`id\`, \`type\` ('path' or 'text'), and \`attributes\`.
5.  **Path Attributes:** For 'path', attributes MUST include \`d\` (the SVG path data) and \`fill\` (a hex color). All paths must be closed shapes.
6.  **Absolutely No Gradients or Strokes:** All visual effects must be achieved by layering solid-colored fills.
7.  **Layering Order:** The first layer in the array is the bottom-most layer. Subsequent layers are placed on top.

**STYLE PRESETS:**
* **Cartoon:** Use bold outlines (as separate path layers), bright primary colors, and simplified, bubbly shapes.
* **Geometric:** Use only simple geometric shapes like triangles, circles, and rectangles to construct the design.
* **Minimalist:** Use as few lines and shapes as possible. Rely on negative space. Muted color palette.
* **Vintage:** Use a limited, faded color palette (e.g., off-whites, sepia tones, muted colors). Shapes should have a hand-drawn, slightly imperfect quality.
* **Elegant Script:** Focus heavily on flowing, cursive text layers. Accompany with delicate, simple path shapes like floral elements or swirls.
`;

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt, maxLayers, maxColors, stylePreset } = JSON.parse(event.body);
        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required.' }) };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'API key is not configured.' }) };
        }
        
        let finalPrompt = prompt;
        let constraints = [];
        if (stylePreset && stylePreset !== 'default') {
            constraints.push(`You MUST generate the design in the "${stylePreset}" style.`);
        }
        if (maxLayers) constraints.push(`Use no more than ${maxLayers} layers.`);
        if (maxColors) constraints.push(`Use no more than ${maxColors} distinct colors.`);
        
        if (constraints.length > 0) {
            finalPrompt += `\n\n**Design Constraints:**\n- ${constraints.join('\n- ')}`;
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: finalPrompt }] }],
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

