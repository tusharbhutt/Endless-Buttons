// === Endless 🌊✨ Tools UI Helper ===
const endlessToolsRegistry = [];

export function registerEndlessTool(name, callback) {
    endlessToolsRegistry.push({ name, callback });
}

export function injectEndlessToolsButton() {
    const toolbar = findToolbar();
    if (!toolbar || document.getElementById("endless-tools-button")) return;

    const btn = document.createElement("button");
    btn.id = "endless-tools-button";
    btn.textContent = "Endless 🌊✨ Tools";
    btn.className = "comfyui-button";
    btn.style.marginLeft = "8px";
    btn.onclick = showEndlessToolMenu;
    toolbar.appendChild(btn);
}

export function showEndlessToolMenu() {
    document.getElementById("endless-tools-float")?.remove();

    const colors = getComfyUIColors();

    const menu = document.createElement("div");
    menu.id = "endless-tools-float";
    menu.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors.background};
        color: ${colors.text};
        padding: 12px;
        border: 1px solid ${colors.accent};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        z-index: 99999;
        transition: opacity 0.2s ease;
        opacity: 1;
        min-width: 180px;
    `;

    const dragBar = document.createElement("div");
    dragBar.textContent = "→ Drag Me With This ←";
    dragBar.style.cssText = `
        padding: 4px;
        background: rgba(255, 255, 255, 0.05);
        cursor: move;
        font-size: 12px;
        text-align: center;
        user-select: none;
        border-bottom: 1px solid ${colors.border};
    `;
    menu.appendChild(dragBar);

    endlessToolsRegistry.forEach(tool => {
        const btn = document.createElement("div");
        btn.textContent = `🌊✨ ${tool.name}`;
        btn.style.cssText = `
            padding: 6px 10px;
            cursor: pointer;
            border-radius: 4px;
            transition: background 0.2s ease;
        `;
        btn.onmouseover = () => btn.style.background = "rgba(255, 255, 255, 0.1)";
        btn.onmouseout = () => btn.style.background = "transparent";
        btn.onclick = () => {
            tool.callback();
            menu.remove();
        };
        menu.appendChild(btn);
    });

    makeDraggable(menu, dragBar);
    document.body.appendChild(menu);
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'e') {
        showEndlessToolMenu();
        e.preventDefault();
    }
    if (e.key === "Escape") {
        document.getElementById("endless-tools-float")?.remove();
    }
});

console.log("Endless 🌊✨ Tools menu: press Ctrl+Alt+E if toolbar button is missing.");

function waitForToolbarAndInject() {
    if (document.querySelector('.comfyui-menu')) {
        injectEndlessToolsButton();
        return;
    }
    const observer = new MutationObserver(() => {
        if (document.querySelector('.comfyui-menu')) {
            injectEndlessToolsButton();
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
waitForToolbarAndInject();

function findToolbar() {
    let toolbar = document.querySelector('.comfyui-menu, .comfy-menu, [class*="menu"], [class*="toolbar"]');
    if (!toolbar) {
        const buttonGroups = document.querySelectorAll('[class*="button-group"], [class*="btn-group"], .comfyui-button-group');
        toolbar = Array.from(buttonGroups).find(group => group.querySelectorAll('button').length > 0);
    }
    if (!toolbar) {
        const allElements = document.querySelectorAll('*');
        toolbar = Array.from(allElements).find(el => {
            const buttons = el.querySelectorAll('button');
            return buttons.length >= 2 && buttons.length <= 10;
        });
    }
    if (!toolbar) {
        toolbar = Array.from(document.querySelectorAll(".comfyui-button-group")).find(div =>
            Array.from(div.querySelectorAll("button")).some(btn => btn.title === "Share")
        );
    }
    return toolbar;
}

function getComfyUIColors() {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
        background: computedStyle.getPropertyValue('--comfy-menu-bg') || '#353535',
        backgroundSecondary: computedStyle.getPropertyValue('--comfy-input-bg') || '#222',
        border: computedStyle.getPropertyValue('--border-color') || '#999',
        text: computedStyle.getPropertyValue('--input-text') || '#ddd',
        accent: computedStyle.getPropertyValue('--comfy-accent-color') || '#5fc0e9' // fallback soft blue
    };
}

function makeDraggable(element, handle = element) {
    let offsetX = 0, offsetY = 0, isDown = false;

    handle.onmousedown = (e) => {
        isDown = true;
        const rect = element.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        element.style.cursor = 'move';
        element.style.position = 'fixed';
        element.style.right = 'auto';

        document.onmousemove = (e) => {
            if (!isDown) return;
            element.style.left = `${e.clientX - offsetX}px`;
            element.style.top = `${e.clientY - offsetY}px`;
            element.style.transform = 'none';
        };
        document.onmouseup = () => {
            isDown = false;
            element.style.cursor = 'default';
            document.onmousemove = null;
            document.onmouseup = null;
        };
    };
}

