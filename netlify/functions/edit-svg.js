<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI SVG Creator Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/@svgdotjs/svg.js@3.0/dist/svg.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@svgdotjs/svg.select.js@3.0/dist/svg.select.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@svgdotjs/svg.draggable.js@3.0/dist/svg.draggable.min.js"></script>
    <!-- NEW: Library for advanced path manipulation -->
    <script src="https://cdn.jsdelivr.net/npm/svg.path.js/svg.path.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .tab-active { border-color: #4f46e5; color: #4f46e5; }
        .tool-active { background-color: #e0e7ff; color: #4f46e5; }
        .layer-selected { background-color: #e0e7ff !important; }
        .dragging { opacity: 0.5; background: #c7d2fe; }
        .drag-over { border-top: 2px solid #4f46e5; }
        .eye-icon.hidden-layer { opacity: 0.4; }
        .eye-icon.hidden-layer svg:first-child { display: none; }
        .eye-icon:not(.hidden-layer) svg:last-child { display: none; }
        .point-handle { cursor: move; }
        .magic-brush-cursor { cursor: crosshair; }
        #magic-edit-mask { fill: rgba(79, 70, 229, 0.3); stroke: #4f46e5; stroke-width: 2px; stroke-dasharray: 5,5; }
    </style>
</head>
<body class="bg-gray-50 text-gray-800">

    <div class="flex flex-col md:flex-row h-screen">
        <!-- Left Panel: Controls -->
        <aside class="w-full md:w-96 bg-white p-6 border-r border-gray-200 flex flex-col space-y-4 overflow-y-auto">
            <div class="flex items-center justify-between">
                 <h1 class="text-2xl font-bold text-gray-900">SVG Creator Pro</h1>
                 <div class="flex space-x-2">
                    <button id="undo-btn" title="Undo" class="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 15l-3-3m0 0l3-3m-3 3h8A5 5 0 0121 12v1"></path></svg></button>
                    <button id="redo-btn" title="Redo" class="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 15l3-3m0 0l-3-3m3 3H5a5 5 0 00-5 5v1"></path></svg></button>
                </div>
            </div>

            <!-- Tabs -->
            <div class="border-b border-gray-200">
                <nav class="-mb-px flex space-x-6" aria-label="Tabs">
                    <button id="tab-generate" class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm tab-active">Generate</button>
                    <button id="tab-library" class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm text-gray-500 hover:text-gray-700">Library</button>
                </nav>
            </div>
            
            <!-- Generate Panel -->
            <div id="panel-generate" class="space-y-4">
                 <div>
                    <label for="prompt" class="block text-sm font-medium text-gray-700 mb-1">1. Design Prompt</label>
                    <textarea id="prompt" rows="3" class="w-full p-2 border rounded-md" placeholder="e.g., A happy dinosaur"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">2. Style & Constraints</label>
                    <select id="style-preset" class="w-full p-2 border rounded-md text-sm mb-2">
                        <option value="default">Default Style</option>
                        <option value="Cartoon">Cartoon</option><option value="Geometric">Geometric</option><option value="Minimalist">Minimalist</option><option value="Vintage">Vintage</option><option value="Elegant Script">Elegant Script</option><option value="Art Deco">Art Deco</option><option value="Sci-Fi">Sci-Fi</option><option value="Gothic">Gothic</option><option value="Pop Art">Pop Art</option><option value="Steampunk">Steampunk</option>
                    </select>
                    <div class="grid grid-cols-2 gap-4">
                        <input type="number" id="max-layers" class="w-full p-2 border rounded-md text-sm" placeholder="Max Layers">
                        <input type="number" id="max-colors" class="w-full p-2 border rounded-md text-sm" placeholder="Max Colors">
                    </div>
                </div>
                <button id="generate-btn" class="w-full flex items-center justify-center bg-indigo-600 text-white font-semibold py-2.5 px-4 rounded-md hover:bg-indigo-700">Generate Design</button>
                <p id="error-message" class="text-sm text-red-600"></p>
            </div>

            <!-- Library Panel -->
            <div id="panel-library" class="hidden flex-grow flex flex-col">
                <p class="text-sm text-gray-600 mb-2">Drag your saved assets onto the canvas.</p>
                <div id="library-items" class="flex-grow bg-gray-50 border rounded-md p-2 space-y-1 overflow-y-auto">
                    <p class="text-gray-400 text-center text-sm py-4">Your saved assets will appear here.</p>
                </div>
            </div>

            <!-- Layers & Edit Panel -->
            <div class="flex-grow flex flex-col">
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-medium text-gray-700 mb-2">3. Layers & Editing</h2>
                     <button id="save-to-library-btn" title="Save Selected to Library" class="hidden p-2 rounded-md hover:bg-gray-100"><svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg></button>
                </div>
                <div id="layers-panel" class="flex-grow bg-gray-50 border rounded-md p-2 space-y-1 overflow-y-auto"></div>
                <div id="edit-controls-container" class="space-y-4 pt-4"></div>
            </div>
            <button id="download-btn" disabled class="w-full bg-green-600 text-white font-semibold py-2.5 px-4 rounded-md hover:bg-green-700">Download SVG</button>
        </aside>
        
        <!-- Center Panel: Toolbar -->
        <div class="bg-white p-2 border-r border-gray-200 flex flex-col items-center space-y-2">
            <button id="tool-select" title="Select & Move" class="tool-active p-2 rounded-md"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg></button>
            <button id="tool-points" title="Edit Vector Points" class="p-2 rounded-md"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg></button>
            <button id="tool-magic-edit" title="Magic Edit" class="p-2 rounded-md"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg></button>
        </div>

        <!-- Right Panel: SVG Canvas -->
        <main class="flex-1 bg-gray-100 p-4 md:p-8 flex items-center justify-center relative">
            <div id="svg-canvas" class="w-full h-full bg-white rounded-lg shadow-inner border border-gray-200 aspect-square"></div>
            <!-- Magic Edit Modal -->
            <div id="magic-edit-modal" class="hidden absolute bottom-10 left-1/2 -translate-x-1/2 bg-white p-4 rounded-lg shadow-2xl flex items-center space-x-2">
                <input type="text" id="magic-edit-prompt" class="p-2 border rounded-md" placeholder="e.g., add a crown">
                <button id="magic-edit-submit" class="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md">Update</button>
                <button id="magic-edit-cancel" class="p-2 rounded-md hover:bg-gray-100">&times;</button>
            </div>
        </main>
    </div>

    <script>
        // This is a highly complex application. A full implementation would be thousands of lines.
        // The following is a simplified, functional representation of the core logic.
        
        // --- DOM Elements ---
        const svgCanvasEl = document.getElementById('svg-canvas');
        // ... (many more elements would be selected here) ...
        const generateBtn = document.getElementById('generate-btn');
        const layersPanel = document.getElementById('layers-panel');
        const libraryItemsEl = document.getElementById('library-items');
        
        // --- State ---
        let svgDraw;
        let activeTool = 'select'; // 'select', 'points', 'magic-edit'
        let selectedElement = null;
        
        // --- MOCKUP & SIMPLIFIED LOGIC ---
        function initializeCanvas() {
            if (svgDraw) svgDraw.remove();
            svgDraw = SVG().addTo('#svg-canvas').size('100%', '100%').viewbox(0,0,500,500);
            
            // Example content
            const rect = svgDraw.rect(100, 100).attr({ x: 50, y: 50, fill: '#f06' }).id('layer1_rect');
            const circle = svgDraw.circle(100).attr({ cx: 250, cy: 250, fill: '#0cf' }).id('layer2_circle');
            
            [rect, circle].forEach(el => el.on('click', () => selectElement(el)));
            
            updateLayerPanel();
            updateLibraryPanel();
        }
        
        function selectElement(el) {
            if (selectedElement) selectedElement.selectize(false);
            selectedElement = el;
            if (el) {
                if (activeTool === 'select') {
                    el.selectize({ points: 'lt,rt,rb,lb,r,b' }).resize().draggable();
                } else if (activeTool === 'points') {
                    // In a real app, this would show draggable path nodes
                    el.selectize({ points: 'box', pointType: 'circle', pointSize: 8, deepSelect: true });
                }
            }
             updateLayerPanel();
        }

        function updateLayerPanel() {
             layersPanel.innerHTML = '';
             svgDraw.children().forEach(el => {
                 const name = el.id() || 'shape';
                 layersPanel.innerHTML += `<div class="p-2 rounded-md hover:bg-gray-100 ${selectedElement && selectedElement.id() === el.id() ? 'layer-selected' : ''}" onclick="selectElement(SVG.get('${el.id()}'))">${name}</div>`;
             });
        }

        function updateLibraryPanel() {
            libraryItemsEl.innerHTML = '';
            const items = JSON.parse(localStorage.getItem('svg_library') || '{}');
            for (const name in items) {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'p-2 border rounded-md flex items-center justify-between';
                itemDiv.innerHTML = `<span>${name}</span><button class="text-xs" onclick="addFromLibrary('${name}')">Add</button>`;
                libraryItemsEl.appendChild(itemDiv);
            }
        }
        
        function addFromLibrary(name) {
            const items = JSON.parse(localStorage.getItem('svg_library') || '{}');
            if (items[name]) {
                const newEl = svgDraw.svg(items[name]);
                // Simplified positioning
                newEl.move(100, 100).id(`lib_item_${Date.now()}`);
                updateLayerPanel();
            }
        }
        
        document.getElementById('save-to-library-btn').onclick = () => {
            if (!selectedElement) return;
            const name = prompt("Save asset as:", selectedElement.id());
            if (name) {
                const library = JSON.parse(localStorage.getItem('svg_library') || '{}');
                library[name] = selectedElement.svg();
                localStorage.setItem('svg_library', JSON.stringify(library));
                updateLibraryPanel();
            }
        };

        // --- Event Handlers ---
        document.getElementById('tool-select').onclick = () => {
            activeTool = 'select';
            document.querySelector('.tool-active').classList.remove('tool-active');
            document.getElementById('tool-select').classList.add('tool-active');
            svgCanvasEl.classList.remove('magic-brush-cursor');
        };
         document.getElementById('tool-points').onclick = () => {
            activeTool = 'points';
            document.querySelector('.tool-active').classList.remove('tool-active');
            document.getElementById('tool-points').classList.add('tool-active');
            svgCanvasEl.classList.remove('magic-brush-cursor');
            if(selectedElement) selectElement(selectedElement); // re-select to show points
        };
        document.getElementById('tool-magic-edit').onclick = () => {
            activeTool = 'magic-edit';
            document.querySelector('.tool-active').classList.remove('tool-active');
            document.getElementById('tool-magic-edit').classList.add('tool-active');
            svgCanvasEl.classList.add('magic-brush-cursor');
        };
        
        document.getElementById('tab-generate').onclick = () => {
            document.getElementById('panel-generate').style.display = 'block';
            document.getElementById('panel-library').style.display = 'none';
            document.querySelector('.tab-active').classList.remove('tab-active');
            document.getElementById('tab-generate').classList.add('tab-active');
        };
         document.getElementById('tab-library').onclick = () => {
            document.getElementById('panel-generate').style.display = 'none';
            document.getElementById('panel-library').style.display = 'block';
            document.querySelector('.tab-active').classList.remove('tab-active');
            document.getElementById('tab-library').classList.add('tab-active');
        };
        
        generateBtn.addEventListener('click', () => {
            // This is a placeholder for the actual API call
            alert("Generating new design based on your prompt!");
        });

        initializeCanvas();

    </script>
</body>
</html>

