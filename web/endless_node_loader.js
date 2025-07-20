import { registerEndlessTool } from './endless_ui_helpers.js';

console.log("✅ Endless Node Loader loaded.");

let dialogInstance = null;

// Set search and recent Nodes

let recentlyUsedNodes = JSON.parse(localStorage.getItem('endlessNodeLoader_recentlyUsed') || '[]');
let searchHistory = JSON.parse(localStorage.getItem('endlessNodeLoader_searchHistory') || '[]');

// Timeout for search history drop down
let searchTimeout;
let hoverTimeout;

// Dragging state
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Filter state
let currentFilter = '';
let allNodesData = [];

function handleDrag(e) {
    if (!isDragging) return;
    const container = dialogInstance;
    if (!container) return;
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    container.style.left = `${Math.max(0, Math.min(window.innerWidth - container.offsetWidth, x))}px`;
    container.style.top = `${Math.max(0, Math.min(window.innerHeight - container.offsetHeight, y))}px`;
}

function handleDragEnd() {
    isDragging = false;
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", handleDragEnd);
    document.body.style.userSelect = "";  
}

// Get ComfyUI themes //

function getComfyUIThemeColors() {
    const computed = getComputedStyle(document.documentElement);

    const getVar = name => computed.getPropertyValue(name).trim() || null;

    return {
        background: getVar("--bg-color"),
        surface: getVar("--comfy-menu-bg"),
        surfaceSecondary: getVar("--comfy-menu-secondary-bg"),
        inputBg: getVar("--comfy-input-bg"),
        inputText: getVar("--input-text"),
        textSecondary: getVar("--descrip-text"),
        border: getVar("--border-color"),
        accent: getVar("--comfy-accent") || "#4a90e2",
        hoverBg: getVar("--content-hover-bg"),
        hoverFg: getVar("--content-hover-fg"),
        shadow: getVar("--bar-shadow")
    };
}

function addDialogBoxParts() {
    const styleId = 'endless-node-loader-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .dialog-container {
            display: flex;
            flex-direction: column;
            height: 60vh;
            width: 35vw;
            background-color: var(--comfy-menu-bg);
            color: var(--input-text);
            padding: 10px;
            border: 2px solid var(--border-color);
            position: fixed;
            top: 10%;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            border-radius: 8px;
            box-shadow: var(--bar-shadow, 0 4px 20px rgba(0,0,0,0.5));
            pointer-events: auto;
            overflow: hidden;
            box-sizing: border-box;
        }
        .dialog-title {
            margin: 0 0 15px 0;
            cursor: move;
            user-select: none;
            padding: 4px;
            background-color: var(--comfy-menu-secondary-bg);
            color: var(--input-text);
            border-radius: 4px;
            font-size: 14px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 6px;
            margin-bottom: 6px;
        }
        .dialog-filter-section {
            flex: 0 0 auto;
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border-color);
        }
        .filter-input-container {
            position: relative;
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .filter-input {
            flex: 1;
            background-color: var(--comfy-input-bg);
            color: var(--input-text);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 6px 8px;
            font-size: 12px;
        }
        .filter-input:focus {
            outline: none;
            border-color: var(--comfy-accent);
        }
        .filter-expand-btn {
            background-color: var(--comfy-input-bg);
            color: var(--input-text);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 6px 12px;
            font-size: 12px;
            cursor: pointer;
            white-space: nowrap;
        }
        .filter-expand-btn:hover {
            background-color: var(--content-hover-bg);
        }
        .search-history-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: var(--comfy-menu-bg);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            max-height: 1050px;
            overflow-y: auto;
            z-index: 10000;
            display: none;
        }
        .search-history-item {
            padding: 6px 8px;
            cursor: pointer;
            font-size: 12px;
            border-bottom: 1px solid var(--border-color);
        }
        .search-history-item:last-child {
            border-bottom: none;
        }
        .search-history-item:hover {
            background-color: var(--comfy-input-bg);
        }
        .node-counters {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: var(--descrip-text);
        }
        .counter-selected {
            color: var(--comfy-accent);
            font-weight: bold;
        }
        .dialog-recent {
            flex: 0 0 auto;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            min-height: 30px;
            max-height: 15%;
            overflow-y: auto;
            box-sizing: border-box;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 6px;
            margin-bottom: 6px;
            
        }
        .recent-chip {
            display: inline-block;
            background-color: var(--comfy-menu-secondary-bg);
            color: var(--input-text);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            white-space: nowrap;
            flex: 0 0 auto;
            border: 1px solid transparent;
            background-image: linear-gradient(rgba(128, 128, 255, 0.08), rgba(128, 128, 255, 0.08));
        }
        .recent-chip:hover {
            border-color: var(--comfy-accent);
            background-color: var(--comfy-input-bg);
            background-image: linear-gradient(rgba(128, 128, 255, 0.12), rgba(128, 128, 255, 0.12));
            transition: border-color 0.2s ease;
        }
        .dialog-list {
            flex: 1 1 auto;
            min-height: 40%;
            overflow-y: auto;
            box-sizing: border-box;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 6px;
            margin-bottom: 6px;
        }
        .node-details {
            margin-bottom: 4px;
        }

        .node-details > summary {
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 0;
            list-style: none;
            position: relative;
            color: var(--input-text);
        }

        .node-details > summary::-webkit-details-marker {
            display: none;
        }

        .node-details > summary::before {
            content: "▶";
            display: inline-block;
            width: 12px;
            text-align: center;
            color: var(--descrip-text);
            font-size: 10px;
            transition: transform 0.2s ease;
            margin-right: 4px;
        }

        .node-details[open] > summary::before {
            transform: rotate(90deg);
            color: var(--input-text);
        }

        .node-details > summary:hover::before {
            color: var(--input-text);
        }

        .node-details > summary:hover {
            background-color: var(--comfy-input-bg);
            border-radius: 4px;
        }

        .node-details ul {
            margin: 4px 0;
            padding-left: 1em;
        }

        .node-details li:hover {
            background-color: var(--comfy-menu-secondary-bg);
            border-radius: 4px;
        }

        .node-details input[type="checkbox"] {
            accent-color: var(--comfy-accent);
        }

        .node-details button {
            background-color: var(--comfy-input-bg);
            color: var(--input-text);
            border: 1px solid var(--border-color);
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 3px;
            cursor: pointer;
        }

        .node-details button:hover {
            background-color: var(--content-hover-bg);
        }

        .node-details .select-all-btn {
            background-color: var(--comfy-input-bg);
            color: var(--input-text);
            border: 1px solid var(--border-color);
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 3px;
            cursor: pointer;
            background-image: linear-gradient(rgba(128, 255, 128, 0.08), rgba(128, 255, 128, 0.08));
        }

        .node-details .select-all-btn:hover {
            background-color: var(--content-hover-bg);
            border-color: var(--comfy-accent);
            background-image: linear-gradient(rgba(128, 255, 128, 0.12), rgba(128, 255, 128, 0.12));
            transition: border-color 0.2s ease;
        }

        .node-details .select-none-btn {
            background-color: var(--comfy-input-bg);
            color: var(--input-text);
            border: 1px solid var(--border-color);
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 3px;
            cursor: pointer;
            background-image: linear-gradient(rgba(255, 128, 128, 0.08), rgba(255, 128, 128, 0.08));
        }
        
        .node-details .select-none-btn:hover {
            background-color: var(--content-hover-bg);
            border-color: var(--comfy-accent);
            background-image: linear-gradient(rgba(255, 128, 128, 0.12), rgba(255, 128, 128, 0.12));
            transition: border-color 0.2s ease;
        }

        .dialog-footer {
            display: flex;
            justify-content: space-between;
            padding: 8px;
            gap: 8px;
        }
        .dialog-btn {
            background-color: var(--comfy-input-bg);
            color: var(--input-text);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 6px 12px;
            font-size: 12px;
            cursor: pointer;
        }
        .dialog-btn:hover {
            background-color: var(--content-hover-bg);
            border-color: var(--comfy-accent);            
            transition: border-color 0.2s ease;
        }
        .dialog-btn.primary {
            background-color: var(--comfy-input-bg);
            color: var(--input-text);
            background-image: linear-gradient(rgba(128, 255, 128, 0.08), rgba(128, 255, 128, 0.08));
            border: 1px solid rgba(128, 255, 128, 0.12);
        }
        .dialog-btn.primary:hover {
            opacity: 0.9;
            background-color: var(--content-hover-bg);
            border-color: var(--comfy-accent);            
            transition: border-color 0.2s ease;
            background-image: linear-gradient(rgba(128, 255, 128, 0.12), rgba(128, 255, 128, 0.12));
        }

        .dialog-btn.sec {
            background-color: var(--comfy-input-bg);
            color: var(--input-text);
            background-image: linear-gradient(rgba(255, 128, 128, 0.08), rgba(255, 128, 128, 0.08));
            border: 1px solid rgba(255, 128, 128, 0.12);
        }
        .dialog-btn.sec:hover {
            opacity: 0.9;
            background-color: var(--content-hover-bg);
            border-color: var(--comfy-accent);
            transition: border-color 0.2s ease;
            background-image: linear-gradient(rgba(255, 128, 128, 0.12), rgba(255, 128, 128, 0.12));
        }

        .hidden {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
}

// Node spawning functions
function spawnNodes(types, spacingX = 300, spacingY = 150) {
    if (!window.app?.graph?.add) {
        alert("ComfyUI graph not available.");
        return;
    }
    const startX = -app.canvas.ds.offset[0] + 50;
    const startY = -app.canvas.ds.offset[1] + 50;
    const existingPositions = getExistingNodePositions();
    
    const spawnedNodes = [];
    types.forEach((type, i) => {
        const node = LiteGraph.createNode(type);
        if (node) {
            const nodeWidth = node.size ? node.size[0] : 200;
            const nodeHeight = node.size ? node.size[1] : 100;
            
            // Use collision detection
            const position = findNonOverlappingPosition(
                startX + (i % 5) * spacingX,
                startY + Math.floor(i / 5) * spacingY,
                nodeWidth,
                nodeHeight,
                existingPositions,
                spacingX,
                spacingY
            );
            
            node.pos = [position.x, position.y];
            app.graph.add(node);
            spawnedNodes.push(type);
            
            // Add this node's position to existing positions for next iteration
            existingPositions.push({
                x: position.x,
                y: position.y,
                width: nodeWidth,
                height: nodeHeight
            });
        } else {
            console.warn(`Could not create node: ${type}`);
        }
    });
    
    // Update recently used nodes
    updateRecentlyUsedNodes(spawnedNodes);
    
    app.graph.setDirtyCanvas(true, true);
}

function getExistingNodePositions() {
    const positions = [];
    if (window.app?.graph?.nodes) {
        window.app.graph.nodes.forEach(node => {
            if (node.pos) {
                positions.push({
                    x: node.pos[0],
                    y: node.pos[1],
                    width: node.size ? node.size[0] : 200,
                    height: node.size ? node.size[1] : 100
                });
            }
        });
    }
    return positions;
}

function findNonOverlappingPosition(startX, startY, width, height, existingPositions, spacingX, spacingY) {
    const padding = 20;
    let x = startX;
    let y = startY;
    
    while (true) {
        let overlaps = false;
        
        for (const pos of existingPositions) {
            if (!(x + width + padding < pos.x || 
                  x - padding > pos.x + pos.width || 
                  y + height + padding < pos.y || 
                  y - padding > pos.y + pos.height)) {
                overlaps = true;
                break;
            }
        }
        
        if (!overlaps) {
            return { x, y };
        }
        
        // Move to next position
        x += spacingX;
        if (x > startX + spacingX * 5) { // After 5 columns, move to next row
            x = startX;
            y += spacingY;
        }
    }
}

// Recently used nodes management
function updateRecentlyUsedNodes(newNodes) {
    newNodes.forEach(nodeType => {
        // Remove if already exists
        const index = recentlyUsedNodes.indexOf(nodeType);
        if (index > -1) {
            recentlyUsedNodes.splice(index, 1);
        }
        // Add to beginning
        recentlyUsedNodes.unshift(nodeType);
    });
    
    // Keep only last 15
    recentlyUsedNodes = recentlyUsedNodes.slice(0, 15);
    localStorage.setItem('endlessNodeLoader_recentlyUsed', JSON.stringify(recentlyUsedNodes));
    
    // Update chips if dialog is open
    if (dialogInstance) {
        updateRecentChips();
    }
}

function updateRecentChips() {
    const recentSection = dialogInstance.querySelector('.dialog-recent');
    if (!recentSection) return;
    
    recentSection.innerHTML = '';
    
    recentlyUsedNodes.forEach(nodeType => {
        const chip = document.createElement('button');
        chip.className = 'recent-chip';
        
        // Get display name
        const nodeClass = LiteGraph.registered_node_types[nodeType];
        const displayName = nodeClass?.title || nodeClass?.name || nodeType.split("/").pop();
        chip.textContent = displayName;
        chip.title = nodeType; // Full type as tooltip
        
        chip.onclick = () => {
            // Check this node type in the list
            const checkbox = Array.from(dialogInstance.querySelectorAll('.node-checkbox')).find(cb => {
                return cb.closest('li').dataset.nodeType === nodeType;
            });
            if (checkbox) {
                checkbox.checked = true;
                updateSelectedCounter();
            }
        };
        
        recentSection.appendChild(chip);
    });
}

// Search history management
function addToSearchHistory(searchTerm) {
    if (!searchTerm.trim() || searchHistory.includes(searchTerm)) return;
    
    searchHistory.unshift(searchTerm);
    searchHistory = searchHistory.slice(0, 15);
    localStorage.setItem('endlessNodeLoader_searchHistory', JSON.stringify(searchHistory));
}

function showSearchHistory(inputElement) {
    const dropdown = inputElement.parentElement.querySelector('.search-history-dropdown');
    if (!dropdown || searchHistory.length === 0) {
        if (dropdown) dropdown.style.display = 'none';
        return;
    }
    
    dropdown.innerHTML = '';
    searchHistory.forEach(term => {
        const item = document.createElement('div');
        item.className = 'search-history-item';
        item.textContent = term;
        item.onclick = () => {
            inputElement.value = term;
            applyFilter(term, true); // Save this selection to history
            hideSearchHistory(dropdown);
        };
        dropdown.appendChild(item);
    });
    
    dropdown.style.display = 'block';
    
    // Auto-hide after 10 seconds if no interaction
    setTimeout(() => {
        if (dropdown.style.display === 'block') {
            hideSearchHistory(dropdown);
        }
    }, 10000);
}

function hideSearchHistory(dropdown) {
    dropdown.style.display = 'none';
}

// Filter functionality
function applyFilter(filterText, saveToHistory = true) {
    currentFilter = filterText.toLowerCase();
    const nodeListSection = dialogInstance.querySelector('.dialog-list');
    
    if (!currentFilter) {
        // Show all
        nodeListSection.querySelectorAll('.node-details, .node-details li').forEach(el => {
            el.classList.remove('hidden');
        });
        updateTotalCounter();
        return;
    }
    
    // Filter logic
    nodeListSection.querySelectorAll('.node-details').forEach(details => {
        const categoryName = details.querySelector('summary span').textContent.toLowerCase();
        const categoryMatches = categoryName.includes(currentFilter);
        
        let hasMatchingNodes = false;
        const nodeItems = details.querySelectorAll('li');
        
        nodeItems.forEach(li => {
            const nodeText = li.textContent.toLowerCase();
            const nodeType = li.dataset.nodeType?.toLowerCase() || '';
            const matches = nodeText.includes(currentFilter) || nodeType.includes(currentFilter);
            
            if (matches) {
                li.classList.remove('hidden');
                hasMatchingNodes = true;
            } else {
                li.classList.add('hidden');
            }
        });
        
        // Show category if it matches or has matching nodes
        if (categoryMatches || hasMatchingNodes) {
            details.classList.remove('hidden');
            if (hasMatchingNodes && !categoryMatches) {
                details.open = true; // Auto-expand if contains matches
            }
        } else {
            details.classList.add('hidden');
        }
    });
    
    updateTotalCounter();
}

// Counter management
function updateSelectedCounter() {
    const counter = dialogInstance.querySelector('.counter-selected');
    if (!counter) return;
    
    const checkedBoxes = dialogInstance.querySelectorAll('.node-checkbox:checked');
    counter.textContent = `Selected: ${checkedBoxes.length}`;
}

function updateTotalCounter() {
    const counter = dialogInstance.querySelector('.counter-total');
    if (!counter) return;
    
    const visibleNodes = dialogInstance.querySelectorAll('.node-details li:not(.hidden)');
    const totalNodes = allNodesData.length;
    counter.textContent = `Total: ${visibleNodes.length}/${totalNodes}`;
}

// Expand/collapse functionality
function toggleAllCategories(expand) {
    const details = dialogInstance.querySelectorAll('.node-details:not(.hidden)');
    details.forEach(detail => {
        detail.open = expand;
    });
}

// Build node list and hierarchy //

function buildHierarchy(nodes) {
    const root = {};
    nodes.forEach(n => {
        let current = root;
        n.pathParts.forEach((part, idx) => {
            if (!current[part]) {
                current[part] = { _nodes: [], _subcategories: {} };
            }
            if (idx === n.pathParts.length - 1) {
                current[part]._nodes.push(n);
            } else {
                current = current[part]._subcategories;
            }
        });
    });
    return root;
}

function countNodesInCategory(categoryObj) {
    let count = 0;
    count += categoryObj._nodes ? categoryObj._nodes.length : 0;
    if (categoryObj._subcategories) {
        Object.values(categoryObj._subcategories).forEach(sub => {
            count += countNodesInCategory(sub);
        });
    }
    return count;
}

function selectAllInCategory(categoryDetails, select = true) {
    const items = categoryDetails.querySelectorAll("input[type='checkbox']");
    items.forEach(checkbox => {
        checkbox.checked = select;
    });
    updateSelectedCounter();
}

function renderCategory(categoryObj, depth = 0) {
    return Object.entries(categoryObj)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([cat, obj]) => {
            const totalNodes = countNodesInCategory(obj);

            const details = document.createElement("details");
            details.open = false;
            details.className = "node-details";
            details.style.paddingLeft = `${depth * 1.2}em`;

            const summary = document.createElement("summary");

            const categoryName = document.createElement("span");
            categoryName.textContent = `${cat} (${totalNodes})`;

            const selectAllBtn = document.createElement("button");
            selectAllBtn.textContent = "All";
            selectAllBtn.className = "select-all-btn";
            selectAllBtn.onclick = (e) => {
                e.stopPropagation();
                selectAllInCategory(details, true);
            };

            const selectNoneBtn = document.createElement("button");
            selectNoneBtn.textContent = "None";
            selectNoneBtn.className = "select-none-btn";
            selectNoneBtn.onclick = (e) => {
                e.stopPropagation();
                selectAllInCategory(details, false);
            };

            summary.appendChild(categoryName);
            summary.appendChild(selectAllBtn);
            summary.appendChild(selectNoneBtn);
            details.appendChild(summary);

            const list = document.createElement("ul");
            list.className = "node-list";

            (obj._nodes || []).forEach(node => {
                const li = document.createElement("li");
                li.dataset.nodeType = node.type; // Store node type for filtering
                
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.className = "node-checkbox";
                checkbox.onchange = updateSelectedCounter;
                
                const label = document.createElement("label");
                label.textContent = node.displayName;

                li.appendChild(checkbox);
                li.appendChild(label);
                list.appendChild(li);
            });

            details.appendChild(list);

            const subCategories = renderCategory(obj._subcategories || {}, depth + 1);
            subCategories.forEach(sub => details.appendChild(sub));

            return details;
        });
}

function getSelectedNodeTypes() {
    const selected = [];
    dialogInstance.querySelectorAll('.node-checkbox:checked').forEach(checkbox => {
        const nodeType = checkbox.closest('li').dataset.nodeType;
        if (nodeType) selected.push(nodeType);
    });
    return selected;
}

function clearSelectedNodes() {
    dialogInstance.querySelectorAll('.node-checkbox:checked').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateSelectedCounter();
}

function showNodeLoaderDialog() {
    //Overall box //
    if (dialogInstance) return;
    addDialogBoxParts();

    const container = document.createElement("div");
    container.className = "dialog-container";
    const theme = getComfyUIThemeColors();

// ESC key to close
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            closeDialog();
        }
    };

    const closeDialog = () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.removeChild(container);
        dialogInstance = null;
    };

document.addEventListener('keydown', handleKeyDown);
    
    //Title Section //
    const title = document.createElement("h3");
    title.textContent = "Endless 🌊✨ Node Loader";
    title.className = "dialog-title";
    container.appendChild(title);

    title.addEventListener("mousedown", (e) => {
        isDragging = true;
        container.style.transform = "none";  // 🚨 Disable center alignment during drag
        const rect = container.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        document.addEventListener("mousemove", handleDrag);
        document.body.style.userSelect = "none";
        document.addEventListener("mouseup", handleDragEnd);
        e.preventDefault();
    });

    // Filter Section
    const filterSection = document.createElement("div");
    filterSection.className = "dialog-filter-section";
    
    const filterInputContainer = document.createElement("div");
    filterInputContainer.className = "filter-input-container";
    
    const filterInput = document.createElement("input");
    filterInput.type = "text";
    filterInput.className = "filter-input";
    filterInput.placeholder = "Filter nodes...";
    
    const searchHistoryDropdown = document.createElement("div");
    searchHistoryDropdown.className = "search-history-dropdown";
    
    filterInput.oninput = (e) => applyFilter(e.target.value, false); // Don't save to history on input

    filterInput.onkeydown = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            addToSearchHistory(e.target.value.trim());
            hideSearchHistory(searchHistoryDropdown);
        } else if (e.key === 'ArrowDown' && searchHistory.length > 0) {
            // Show history when user presses down arrow
            showSearchHistory(filterInput);
            e.preventDefault();
        }
    };

    filterInput.onfocus = (e) => {
        // Only show history if input is empty
        if (!e.target.value.trim()) {
            showSearchHistory(filterInput);
        }
    };

    filterInput.onblur = (e) => {
        // Save to history when leaving the field (if it has content)
        if (e.target.value.trim()) {
            addToSearchHistory(e.target.value.trim());
        }
        // Clear any pending hover timeout
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        // Delay hiding to allow clicks on dropdown items
        setTimeout(() => hideSearchHistory(searchHistoryDropdown), 150);
    };

    filterInput.onmouseenter = () => {
        // Clear auto-hide timer when mouse enters
        if (searchTimeout) {
            clearTimeout(searchTimeout);
            searchTimeout = null;
        }
        
        // Start hover timer - show history after 1 second of hovering
        hoverTimeout = setTimeout(() => {
            if (searchHistory.length > 0) {
                showSearchHistory(filterInput);
            }
        }, 1000);
    };

    filterInput.onmouseleave = (e) => {
        // Clear hover timeout when mouse leaves
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        
        // Start auto-hide timer for the dropdown
        searchTimeout = setTimeout(() => {
            hideSearchHistory(searchHistoryDropdown);
        }, 10000);
    };
    
    const expandBtn = document.createElement("button");
    expandBtn.className = "filter-expand-btn";
    expandBtn.textContent = "Expand All";
    let isExpanded = false;
    expandBtn.onclick = () => {
        isExpanded = !isExpanded;
        toggleAllCategories(isExpanded);
        expandBtn.textContent = isExpanded ? "Collapse All" : "Expand All";
    };
    
    filterInputContainer.appendChild(filterInput);
    filterInputContainer.appendChild(searchHistoryDropdown);
    filterInputContainer.appendChild(expandBtn);
    
    const nodeCounters = document.createElement("div");
    nodeCounters.className = "node-counters";
    nodeCounters.innerHTML = `
        <span class="counter-selected">Selected: 0</span>
        <span class="counter-total">Total: 0</span>
    `;
    
    filterSection.appendChild(filterInputContainer);
    filterSection.appendChild(nodeCounters);
    container.appendChild(filterSection);

    // Recent Section //
    const recentSection = document.createElement("div");
    recentSection.className = "dialog-recent";
    container.appendChild(recentSection);

    // Node Section //
    const nodeListSection = document.createElement("div");
    nodeListSection.className = "dialog-list";

    const nodes = Object.entries(LiteGraph.registered_node_types)
        .filter(([key, value]) => key && value)
        .map(([type, nodeClass]) => {
            const category = nodeClass.category || "Other";
            const displayName = nodeClass.title || nodeClass.name || type.split("/").pop();
            return {
                type,
                category,
                pathParts: category.split("/"),
                displayName,
                description: nodeClass.desc || nodeClass.description || "",
                fullPath: category + "/" + displayName
            };
        })
        .sort((a, b) => a.category.localeCompare(b.category) || a.displayName.localeCompare(b.displayName));

    allNodesData = nodes; // Store for filtering
    
    const hierarchy = buildHierarchy(nodes);
    const tree = renderCategory(hierarchy);
    tree.forEach(section => {
        nodeListSection.appendChild(section);
    });
    container.appendChild(nodeListSection);

// Footer Section //
const footerSection = document.createElement("div");
footerSection.className = "dialog-footer";

const leftButtons = document.createElement("div");
leftButtons.style.display = "flex";
leftButtons.style.gap = "8px";

const spawnBtn = document.createElement("button");
spawnBtn.textContent = "Spawn Nodes";
spawnBtn.className = "dialog-btn primary";
spawnBtn.onclick = () => {
    const selectedTypes = getSelectedNodeTypes();
    if (selectedTypes.length === 0) {
        alert("Please select at least one node to spawn.");
        return;
    }
    spawnNodes(selectedTypes);
    closeDialog();  // Use the shared closeDialog function
};

const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear Selected";
clearBtn.className = "dialog-btn";
clearBtn.onclick = clearSelectedNodes;

const cancelBtn = document.createElement("button");
cancelBtn.textContent = "Cancel";
cancelBtn.className = "dialog-btn sec";
cancelBtn.onclick = closeDialog;  // Use the shared closeDialog function

leftButtons.appendChild(spawnBtn);
leftButtons.appendChild(clearBtn);

const rightButtons = document.createElement("div");
rightButtons.style.display = "flex";
rightButtons.style.gap = "8px";

const clearHistoryBtn = document.createElement("button");
clearHistoryBtn.textContent = "Clear History";
clearHistoryBtn.className = "dialog-btn";
clearHistoryBtn.onclick = () => {
    searchHistory = [];
    localStorage.setItem('endlessNodeLoader_searchHistory', JSON.stringify(searchHistory));
    // Hide dropdown if it's currently showing
    const dropdown = dialogInstance.querySelector('.search-history-dropdown');
    if (dropdown) dropdown.style.display = 'none';
};

rightButtons.appendChild(clearHistoryBtn);
rightButtons.appendChild(cancelBtn);

footerSection.appendChild(leftButtons);
footerSection.appendChild(rightButtons);
container.appendChild(footerSection);

    document.body.appendChild(container);
    dialogInstance = container;
    
    // Initialize
    updateRecentChips();
    updateSelectedCounter();
    updateTotalCounter();
    
    // Focus filter input
    filterInput.focus();
}

registerEndlessTool("Node Loader", showNodeLoaderDialog);