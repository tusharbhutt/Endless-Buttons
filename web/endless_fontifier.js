// ComfyUI Endless 🌊✨ Fontifier - Fixed Version
import { registerEndlessTool } from './endless_ui_helpers.js';

(function() {
    'use strict';
    
    // Store original ComfyUI default values for reset functionality
    const originalValues = {
        NODE_TEXT_SIZE: 14,
        NODE_SUBTEXT_SIZE: 12,
        NODE_TITLE_HEIGHT: 30,
        DEFAULT_GROUP_FONT: 24,
        NODE_FONT: 'Arial',
        NODE_SLOT_HEIGHT: 20,
        NODE_WIDGET_HEIGHT: 20,
        WIDGET_TEXT_SIZE: 12 // Added widget text size to original values
    };
    
    // Current values (will be updated as user changes them)
    let currentValues = { ...originalValues };
    
    // Values when dialog opens (for cancel/preview rollback)
    let dialogOpenValues = {};
    
    // Get ComfyUI theme colors
    function getComfyUIColors() {
        const computedStyle = getComputedStyle(document.documentElement);
        return {
            background: computedStyle.getPropertyValue('--comfy-menu-bg') || '#353535',
            backgroundSecondary: computedStyle.getPropertyValue('--comfy-input-bg') || '#222',
            border: computedStyle.getPropertyValue('--border-color') || '#999',
            text: computedStyle.getPropertyValue('--input-text') || '#ddd',
            textSecondary: computedStyle.getPropertyValue('--descrip-text') || '#999',
            accent: computedStyle.getPropertyValue('--comfy-menu-bg') || '#0f0f0f'
        };
    }

    function makeDraggable(dialog) {
        const header = dialog.querySelector('h2');
        if (!header) return;

        let offsetX = 0, offsetY = 0, isDown = false;

        header.style.cursor = 'move';
        header.style.userSelect = 'none';
        
        header.onmousedown = (e) => {
            e.preventDefault();
            isDown = true;
            
            const rect = dialog.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            const onMouseMove = (e) => {
                if (!isDown) return;
                e.preventDefault();
                dialog.style.left = `${e.clientX - offsetX}px`;
                dialog.style.top = `${e.clientY - offsetY}px`;
                dialog.style.transform = 'none';
            };
            
            const onMouseUp = () => {
                isDown = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
    }
    
    // Function to capture current ComfyUI settings
    function captureCurrentSettings() {
        const settings = {
            NODE_TEXT_SIZE: (typeof LiteGraph !== 'undefined' && LiteGraph.NODE_TEXT_SIZE) ? LiteGraph.NODE_TEXT_SIZE : originalValues.NODE_TEXT_SIZE,
            NODE_SUBTEXT_SIZE: (typeof LiteGraph !== 'undefined' && LiteGraph.NODE_SUBTEXT_SIZE) ? LiteGraph.NODE_SUBTEXT_SIZE : originalValues.NODE_SUBTEXT_SIZE,
            NODE_TITLE_HEIGHT: (typeof LiteGraph !== 'undefined' && LiteGraph.NODE_TITLE_HEIGHT) ? LiteGraph.NODE_TITLE_HEIGHT : originalValues.NODE_TITLE_HEIGHT,
            DEFAULT_GROUP_FONT: (typeof LiteGraph !== 'undefined' && LiteGraph.DEFAULT_GROUP_FONT) ? LiteGraph.DEFAULT_GROUP_FONT : originalValues.DEFAULT_GROUP_FONT,
            NODE_FONT: (typeof LiteGraph !== 'undefined' && LiteGraph.NODE_FONT) ? LiteGraph.NODE_FONT : originalValues.NODE_FONT,
            NODE_SLOT_HEIGHT: (typeof LiteGraph !== 'undefined' && LiteGraph.NODE_SLOT_HEIGHT) ? LiteGraph.NODE_SLOT_HEIGHT : originalValues.NODE_SLOT_HEIGHT,
            WIDGET_TEXT_SIZE: currentValues.WIDGET_TEXT_SIZE // Get current widget text size
        };
        
        console.log('📸 Captured current settings:', settings);
        return settings;
    }
        
    function createFontifierDialog() {
        // Remove existing dialog if present
        const existingDialog = document.getElementById('fontifier-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }
        
        // Capture current settings when dialog opens
        currentValues = captureCurrentSettings();
        dialogOpenValues = { ...currentValues };
        
        const colors = getComfyUIColors();
        
        // Create dialog container
        const dialog = document.createElement('div');
        dialog.id = 'fontifier-dialog';
        dialog.className = 'comfyui-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${colors.background};
            border: 1px solid ${colors.border};
            border-radius: 8px;
            padding: 20px;
            z-index: 10000;
            width: 520px;
            max-height: 80vh;
            overflow-y: auto;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            color: ${colors.text};
        `;
        
        // Create backdrop - REMOVE the onclick handler to prevent accidental cancellation
        const backdrop = document.createElement('div');
        backdrop.className = 'comfyui-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        `;
        // Removed the onclick handler to prevent accidental cancellation
        
        dialog.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid ${colors.border}; padding-bottom: 15px;">
                <h2 style="color: ${colors.text}; margin: 0; font-size: 16px;">🌊✨ Endless Fontifier</h2>
                <button id="close-dialog" style="background: ${colors.backgroundSecondary}; border: 1px solid ${colors.border}; color: ${colors.text}; padding: 6px 12px; border-radius: 4px; cursor: pointer;">✕</button>
            </div>
            
            <div style="margin-bottom: 12px; padding: 12px; background: ${colors.backgroundSecondary}; border-radius: 6px; border: 1px solid ${colors.border};">
                <h3 style="color: ${colors.text}; margin: 0 0 10px 0; font-size: 16px;">Global Scale</h3>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <label style="color: ${colors.textSecondary}; min-width: 80px; font-size: 12px;">Scale All:</label>
                    <input type="range" id="global-scale" min="0.5" max="3" step="0.1" value="1" style="flex: 1; accent-color: ${colors.accent};">
                    <input type="number" id="global-scale-num" min="0.5" max="3" step="0.1" value="1" style="width: 70px; padding: 6px; background: ${colors.background}; border: 1px solid ${colors.border}; color: ${colors.text}; border-radius: 4px; font-size: 12px;">
                </div>
            </div>
            
            <div style="margin-bottom: 12px; padding: 12px; background: ${colors.backgroundSecondary}; border-radius: 6px; border: 1px solid ${colors.border};">
                <h3 style="color: ${colors.text}; margin: 0 0 12px 0; font-size: 16px;">Font Family</h3>
                <select id="font-family" style="width: 100%; padding: 8px; background: ${colors.background}; border: 1px solid ${colors.border}; color: ${colors.text}; border-radius: 4px; font-size: 12px;">
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                    <option value="Impact">Impact</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Tahoma">Tahoma</option>
                </select>
            </div>
            
            <div style="margin-bottom: 12px; padding: 12px; background: ${colors.backgroundSecondary}; border-radius: 6px; border: 1px solid ${colors.border};">
                <h3 style="color: ${colors.text}; margin: 0 0 12px 0; font-size: 16px;">Text Element Sizes</h3>
                
                <div style="margin-bottom: 10px;">
                    <label style="color: ${colors.text}; display: block; margin-bottom: 4px; font-size: 12px; font-weight: bold;">Node Title Text</label>
                    <div style="color: ${colors.textSecondary}; font-size: 11px; margin-bottom: 5px;">The main title text at the top of each node (e.g., "KSampler", "VAE Decode")</div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="range" id="node-text-size" min="8" max="32" value="${currentValues.NODE_TEXT_SIZE}" style="flex: 1; accent-color: ${colors.accent};">
                        <input type="number" id="node-text-size-num" min="8" max="32" value="${currentValues.NODE_TEXT_SIZE}" style="width: 60px; padding: 5px; background: ${colors.background}; border: 1px solid ${colors.border}; color: ${colors.text}; border-radius: 4px; font-size: 12px;">
                    </div>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <label style="color: ${colors.text}; display: block; margin-bottom: 4px; font-size: 12px; font-weight: bold;">Widget Labels & Values</label>
                    <div style="color: ${colors.textSecondary}; font-size: 11px; margin-bottom: 5px;">Text inside nodes: parameter names and values (e.g., "steps: 20", "cfg: 8.0")</div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="range" id="node-subtext-size" min="6" max="24" value="${currentValues.NODE_SUBTEXT_SIZE}" style="flex: 1; accent-color: ${colors.accent};">
                        <input type="number" id="node-subtext-size-num" min="6" max="24" value="${currentValues.NODE_SUBTEXT_SIZE}" style="width: 60px; padding: 5px; background: ${colors.background}; border: 1px solid ${colors.border}; color: ${colors.text}; border-radius: 4px; font-size: 12px;">
                    </div>
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="color: ${colors.text}; display: block; margin-bottom: 4px; font-size: 12px; font-weight: bold;">Widget Text Input Size</label>
                    <div style="color: ${colors.textSecondary}; font-size: 11px; margin-bottom: 5px;">Font size for text inside input boxes, dropdowns, and textareas in nodes.</div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="range" id="widget-text-size" min="8" max="24" value="${currentValues.WIDGET_TEXT_SIZE}" style="flex: 1; accent-color: ${colors.accent};">
                        <input type="number" id="widget-text-size-num" min="8" max="24" value="${currentValues.WIDGET_TEXT_SIZE}" style="width: 60px; padding: 5px; background: ${colors.background}; border: 1px solid ${colors.border}; color: ${colors.text}; border-radius: 4px; font-size: 12px;">
                    </div>
                </div>

                <div style="margin-bottom: 10px;">
                    <label style="color: ${colors.text}; display: block; margin-bottom: 4px; font-size: 12px; font-weight: bold;">Node Title Area Height</label>
                    <div style="color: ${colors.textSecondary}; font-size: 11px; margin-bottom: 5px;">Height of the colored title bar area at the top of nodes</div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="range" id="title-height" min="20" max="60" value="${currentValues.NODE_TITLE_HEIGHT}" style="flex: 1; accent-color: ${colors.accent};">
                        <input type="number" id="title-height-num" min="20" max="60" value="${currentValues.NODE_TITLE_HEIGHT}" style="width: 60px; padding: 5px; background: ${colors.background}; border: 1px solid ${colors.border}; color: ${colors.text}; border-radius: 4px; font-size: 12px;">
                    </div>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <label style="color: ${colors.text}; display: block; margin-bottom: 4px; font-size: 12px; font-weight: bold;">Connection Slot Height</label>
                    <div style="color: ${colors.textSecondary}; font-size: 11px; margin-bottom: 5px;">Height of input/output connection points on node sides</div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="range" id="slot-height" min="12" max="40" value="${currentValues.NODE_SLOT_HEIGHT}" style="flex: 1; accent-color: ${colors.accent};">
                        <input type="number" id="slot-height-num" min="12" max="40" value="${currentValues.NODE_SLOT_HEIGHT}" style="width: 60px; padding: 5px; background: ${colors.background}; border: 1px solid ${colors.border}; color: ${colors.text}; border-radius: 4px; font-size: 12px;">
                    </div>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <label style="color: ${colors.text}; display: block; margin-bottom: 4px; font-size: 12px; font-weight: bold;">Group Label Size</label>
                    <div style="color: ${colors.textSecondary}; font-size: 11px; margin-bottom: 5px;">Text size for node group labels (when nodes are grouped together)</div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="range" id="group-font-size" min="12" max="48" value="${currentValues.DEFAULT_GROUP_FONT}" style="flex: 1; accent-color: ${colors.accent};">
                        <input type="number" id="group-font-size-num" min="12" max="48" value="${currentValues.DEFAULT_GROUP_FONT}" style="width: 60px; padding: 5px; background: ${colors.background}; border: 1px solid ${colors.border}; color: ${colors.text}; border-radius: 4px; font-size: 12px;">
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: center; padding-top: 15px; border-top: 1px solid ${colors.border};">
                <button id="apply-btn" style="padding: 8px 16px; background: ${colors.backgroundSecondary}; border: 1px solid ${colors.border}; color: ${colors.text}; border-radius: 4px; cursor: pointer; font-size: 12px; transition: border-width 0.2s ease; background-image: linear-gradient(rgba(128, 255, 128, 0.08), rgba(128, 255, 128, 0.08));">Apply & Close</button>
                <button id="preview-btn" style="padding: 8px 16px; background: ${colors.backgroundSecondary}; border: 1px solid ${colors.border}; color: ${colors.text}; border-radius: 4px; cursor: pointer; font-size: 12px; transition: border-width 0.2s ease;">Preview</button>
                <button id="reset-btn" style="padding: 8px 16px; background: ${colors.backgroundSecondary}; border: 1px solid ${colors.border}; color: ${colors.text}; border-radius: 4px; cursor: pointer; font-size: 12px; transition: border-width 0.2s ease;">Reset to Defaults</button>
                <button id="cancel-btn" style="padding: 8px 16px; background: ${colors.backgroundSecondary}; border: 1px solid ${colors.border}; color: ${colors.textSecondary}; border-radius: 4px; cursor: pointer; font-size: 12px; transition: border-width 0.2s ease; background-image: linear-gradient(rgba(255, 128, 128, 0.08), rgba(255, 128, 128, 0.08));">Cancel</button>
            </div>
        `;
        
        document.body.appendChild(backdrop);
        document.body.appendChild(dialog);

        // ESC key handler - restore original values on escape
        function escHandler(e) {
            if (e.key === 'Escape') {
                restoreSettings(dialogOpenValues);
                backdrop.remove();
                dialog.remove();
                document.removeEventListener('keydown', escHandler);
            }
        }
        document.addEventListener('keydown', escHandler);

        // Set up event handlers
        setupDialogHandlers(dialog, backdrop);
        
        // Set font family to current value
        dialog.querySelector('#font-family').value = currentValues.NODE_FONT;
    }
    
    // Function to restore settings
    function restoreSettings(settings) {
        applySettingsToComfyUI(settings);
        console.log('🔄 Settings restored:', settings);
    }
    
    // Separated function to apply settings to ComfyUI
    function applySettingsToComfyUI(settings) {
        if (typeof LiteGraph !== 'undefined') {
            LiteGraph.NODE_TEXT_SIZE = settings.NODE_TEXT_SIZE;
            LiteGraph.NODE_SUBTEXT_SIZE = settings.NODE_SUBTEXT_SIZE;
            LiteGraph.NODE_TITLE_HEIGHT = settings.NODE_TITLE_HEIGHT;
            LiteGraph.NODE_SLOT_HEIGHT = settings.NODE_SLOT_HEIGHT;
            LiteGraph.NODE_WIDGET_HEIGHT = settings.NODE_SLOT_HEIGHT;
            LiteGraph.DEFAULT_GROUP_FONT = settings.DEFAULT_GROUP_FONT;
            LiteGraph.DEFAULT_GROUP_FONT_SIZE = settings.DEFAULT_GROUP_FONT;
            LiteGraph.NODE_FONT = settings.NODE_FONT || settings.FONT_FAMILY;
            LiteGraph.DEFAULT_FONT = settings.NODE_FONT || settings.FONT_FAMILY;
            LiteGraph.GROUP_FONT = settings.NODE_FONT || settings.FONT_FAMILY;

            if (typeof app !== 'undefined' && app.canvas) {
                app.canvas.setDirty(true, true);
                if (app.canvas.draw) {
                    setTimeout(() => app.canvas.draw(true, true), 100);
                }
            }

            const canvases = document.querySelectorAll('canvas');
            canvases.forEach(canvas => {
                if (canvas.getContext) {
                    const ctx = canvas.getContext('2d');
                    const originalWidth = canvas.width;
                    canvas.width = originalWidth + 1;
                    canvas.width = originalWidth;
                }
            });
        }

        // Apply widget font size to CSS
        let styleTag = document.getElementById('fontifier-widget-text-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'fontifier-widget-text-style';
            document.head.appendChild(styleTag);
        }
        styleTag.textContent = `
            canvas ~ * .widget input, canvas ~ * .widget select, canvas ~ * .widget textarea,
            canvas ~ * .comfy-multiline-input, canvas ~ * .comfy-input, 
            canvas ~ * input.comfy-multiline-input, canvas ~ * textarea.comfy-multiline-input,
            canvas ~ * [class*="comfy-input"], canvas ~ * [class*="comfy-multiline"],
            canvas ~ * .comfyui-widget input, canvas ~ * .comfyui-widget select, canvas ~ * .comfyui-widget textarea,
            canvas ~ * [class*="widget"] input, canvas ~ * [class*="widget"] select, canvas ~ * [class*="widget"] textarea,
            canvas ~ * .litegraph input, canvas ~ * .litegraph select, canvas ~ * .litegraph textarea,
            .litegraph input, .litegraph select, .litegraph textarea {
                font-size: ${settings.WIDGET_TEXT_SIZE}px !important;
                font-family: ${settings.NODE_FONT || settings.FONT_FAMILY} !important;
            }
            
            /* Exclude the fontifier dialog itself */
            #fontifier-dialog input, #fontifier-dialog select, #fontifier-dialog textarea {
                font-size: 14px !important;
                font-family: Arial !important;
            }
        `;
    }
    
    function setupDialogHandlers(dialog, backdrop) {
        makeDraggable(dialog);

        // Sync sliders with number inputs
        const elements = [
            'global-scale',
            'node-text-size', 
            'node-subtext-size', 
            'title-height', 
            'slot-height',
            'group-font-size',
            'widget-text-size'
        ];
        
        elements.forEach(id => {
            const slider = dialog.querySelector(`#${id}`);
            const numberInput = dialog.querySelector(`#${id}-num`);
            
            slider.oninput = () => {
                numberInput.value = slider.value;
                if (id === 'global-scale') {
                    const globalScaleNum = dialog.querySelector('#global-scale-num');
                    globalScaleNum.value = slider.value;
                }
            };
            numberInput.oninput = () => {
                slider.value = numberInput.value;
            };
        });
        
        // Global scale handler - now includes widget text size
        const globalScale = dialog.querySelector('#global-scale');
        const globalScaleNum = dialog.querySelector('#global-scale-num');
        
        function updateGlobalScale() {
            const scale = parseFloat(globalScale.value);
            globalScaleNum.value = scale;
            
            // Update all individual controls including widget text size
            const updates = [
                ['node-text-size', originalValues.NODE_TEXT_SIZE],
                ['node-subtext-size', originalValues.NODE_SUBTEXT_SIZE],
                ['title-height', originalValues.NODE_TITLE_HEIGHT],
                ['slot-height', originalValues.NODE_SLOT_HEIGHT],
                ['group-font-size', originalValues.DEFAULT_GROUP_FONT],
                ['widget-text-size', originalValues.WIDGET_TEXT_SIZE] // Added widget text size to global scaling
            ];
            
            updates.forEach(([id, originalValue]) => {
                const newValue = Math.round(originalValue * scale);
                dialog.querySelector(`#${id}`).value = newValue;
                dialog.querySelector(`#${id}-num`).value = newValue;
            });
        }
        
        globalScale.oninput = updateGlobalScale;
        globalScaleNum.oninput = () => {
            globalScale.value = globalScaleNum.value;
            updateGlobalScale();
        };
        
        // Button handlers
        dialog.querySelector('#close-dialog').onclick = () => {
            restoreSettings(dialogOpenValues);
            backdrop.remove();
            dialog.remove();
        };
        
        dialog.querySelector('#reset-btn').onclick = () => {
            dialog.querySelector('#global-scale').value = 1;
            dialog.querySelector('#global-scale-num').value = 1;
            dialog.querySelector('#node-text-size').value = originalValues.NODE_TEXT_SIZE;
            dialog.querySelector('#node-text-size-num').value = originalValues.NODE_TEXT_SIZE;
            dialog.querySelector('#node-subtext-size').value = originalValues.NODE_SUBTEXT_SIZE;
            dialog.querySelector('#node-subtext-size-num').value = originalValues.NODE_SUBTEXT_SIZE;
            dialog.querySelector('#title-height').value = originalValues.NODE_TITLE_HEIGHT;
            dialog.querySelector('#title-height-num').value = originalValues.NODE_TITLE_HEIGHT;
            dialog.querySelector('#slot-height').value = originalValues.NODE_SLOT_HEIGHT;
            dialog.querySelector('#slot-height-num').value = originalValues.NODE_SLOT_HEIGHT;
            dialog.querySelector('#group-font-size').value = originalValues.DEFAULT_GROUP_FONT;
            dialog.querySelector('#group-font-size-num').value = originalValues.DEFAULT_GROUP_FONT;
            dialog.querySelector('#widget-text-size').value = originalValues.WIDGET_TEXT_SIZE;
            dialog.querySelector('#widget-text-size-num').value = originalValues.WIDGET_TEXT_SIZE;
            dialog.querySelector('#font-family').value = 'Arial';
        };
        
        dialog.querySelector('#preview-btn').onclick = () => applyChanges(dialog, false);
        
        dialog.querySelector('#apply-btn').onclick = () => {
            applyChanges(dialog, true);
            backdrop.remove();
            dialog.remove();
        };
        
        dialog.querySelector('#cancel-btn').onclick = () => {
            restoreSettings(dialogOpenValues);
            backdrop.remove();
            dialog.remove();
        };

        // Add hover effects to buttons
        const buttons = dialog.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.boxSizing = 'border-box';
            button.style.minWidth = button.offsetWidth + 'px';
            button.addEventListener('mouseenter', () => {
                button.style.borderWidth = '2px';
                button.style.padding = '7px 15px';
            });
            button.addEventListener('mouseleave', () => {
                button.style.borderWidth = '1px';
                button.style.padding = '8px 16px';
            });
        });
    }
    
    function applyChanges(dialog, permanent = false) {
        const newValues = {
            NODE_TEXT_SIZE: parseInt(dialog.querySelector('#node-text-size').value),
            NODE_SUBTEXT_SIZE: parseInt(dialog.querySelector('#node-subtext-size').value),
            NODE_TITLE_HEIGHT: parseInt(dialog.querySelector('#title-height').value),
            NODE_SLOT_HEIGHT: parseInt(dialog.querySelector('#slot-height').value),
            DEFAULT_GROUP_FONT: parseInt(dialog.querySelector('#group-font-size').value),
            FONT_FAMILY: dialog.querySelector('#font-family').value,
            NODE_FONT: dialog.querySelector('#font-family').value,
            WIDGET_TEXT_SIZE: parseInt(dialog.querySelector('#widget-text-size').value)
        };

        applySettingsToComfyUI(newValues);
        console.log('🌊✨ Fontifier applied:', newValues);

        if (permanent) {
            currentValues = { ...newValues };
            console.log('🌊✨ Fontifier changes applied permanently (until page refresh)');
        }
    }

    registerEndlessTool("Fontifier", createFontifierDialog);
})();