// app.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 ChromaPick Initializing...');
    
    // Use global notification function or create simple fallback
    const showNotification = window.showNotification || function(message, type = 'info') {
        console.log(`[${type}] ${message}`);
        // Simple fallback - you could add alert() here if needed
    };

    // DOM Elements
    const elements = {
        imageLoader: document.getElementById('imageLoader'),
        canvas: document.getElementById('imageCanvas'),
        preview: document.getElementById('color-preview'),
        hexValue: document.getElementById('hexValue'),
        rgbValue: document.getElementById('rgbValue'),
        copyHexBtn: document.getElementById('copyHex'),
        copyRgbBtn: document.getElementById('copyRgb'),
        darkModeToggle: document.getElementById('darkModeToggle'),
        uploaderLabel: document.querySelector('.uploader label'),
        cursorLogo: document.getElementById('cursorLogo'),
        colorsPalette: document.getElementById('colorsPalette'),
        zoomInBtn: document.getElementById('zoomInBtn'),
        zoomOutBtn: document.getElementById('zoomOutBtn'),
        loginBtn: document.getElementById('loginBtn'),
        registerBtn: document.getElementById('registerBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        loginModal: document.getElementById('loginModal'),
        registerModal: document.getElementById('registerModal'),
        loginForm: document.getElementById('loginForm'),
        registerForm: document.getElementById('registerForm')
    };

    // State
    let originalImage = null;
    let scale = 1.0;
    const MAX_SCALE = 5.0;
    const MIN_SCALE = 0.5;
    const ZOOM_STEP = 0.2;

    // Initialize Canvas Context
    let ctx = null;
    if (elements.canvas) {
        ctx = elements.canvas.getContext('2d', { willReadFrequently: true });
    }

    // 1. Dark Mode Setup
    function initDarkMode() {
        const darkMode = localStorage.getItem('darkMode') === 'enabled';
        document.body.classList.toggle('dark-mode', darkMode);
        if (elements.darkModeToggle) {
            elements.darkModeToggle.checked = darkMode;
        }
    }

    if (elements.darkModeToggle) {
        elements.darkModeToggle.addEventListener('change', function(e) {
            const enabled = e.target.checked;
            document.body.classList.toggle('dark-mode', enabled);
            localStorage.setItem('darkMode', enabled ? 'enabled' : 'disabled');
        });
    }

    // 2. Image Handling
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                loadAndDrawImage(event.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            showNotification('Please select a valid image file (JPEG, PNG, etc.)', 'error');
        }
    }

    function handleImagePaste(e) {
        const items = e.clipboardData?.items;
        if (items) {
            for (let item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        loadAndDrawImage(event.target.result);
                    };
                    reader.readAsDataURL(file);
                    showNotification('Image pasted successfully!', 'success');
                    break;
                }
            }
        }
    }

    function loadAndDrawImage(imageSrc) {
        const img = new Image();
        img.onload = function() {
            originalImage = img;
            scale = 1.0;
            drawImage(img);
            extractAndDisplayColors();
            if (elements.canvas) {
                elements.canvas.style.display = 'block';
            }
            showNotification('Image loaded successfully!', 'success');
        };
        img.onerror = function() {
            showNotification('Error loading image. Please try another image file.', 'error');
        };
        img.src = imageSrc;
    }

    function drawImage(img) {
        if (!elements.canvas || !ctx) return;
        
        const container = document.querySelector('.color-picker-wrapper');
        const maxWidth = Math.min(container.clientWidth - 200, 600);
        
        let { width, height } = img;
        const aspectRatio = width / height;
        
        if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
        }
        
        elements.canvas.width = img.width;
        elements.canvas.height = img.height;
        elements.canvas.style.width = (width * scale) + 'px';
        elements.canvas.style.height = (height * scale) + 'px';
        
        ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
        ctx.drawImage(img, 0, 0, elements.canvas.width, elements.canvas.height);
    }

    // 3. Event Listeners for Images
    if (elements.imageLoader) {
        elements.imageLoader.addEventListener('change', handleImageUpload);
    }
    window.addEventListener('paste', handleImagePaste);

    // 4. Zoom Functionality
    function changeZoom(delta) {
        if (!originalImage) {
            showNotification('Please load an image first', 'error');
            return;
        }
        
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
        if (newScale !== scale) {
            scale = newScale;
            drawImage(originalImage);
        }
    }

    if (elements.zoomInBtn) {
        elements.zoomInBtn.addEventListener('click', () => changeZoom(ZOOM_STEP));
    }
    if (elements.zoomOutBtn) {
        elements.zoomOutBtn.addEventListener('click', () => changeZoom(-ZOOM_STEP));
    }
    
    if (elements.canvas) {
        elements.canvas.addEventListener('wheel', function(e) {
            if (!originalImage) return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
            changeZoom(delta);
        });
    }

    // 5. Color Picking
    function pickColor(e) {
        if (!originalImage || !elements.canvas || !ctx) return;
        
        const rect = elements.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) * (elements.canvas.width / rect.width));
        const y = Math.floor((e.clientY - rect.top) * (elements.canvas.height / rect.height));
        
        if (x < 0 || x >= elements.canvas.width || y < 0 || y >= elements.canvas.height) return;
        
        const pixel = ctx.getImageData(x, y, 1, 1);
        const [r, g, b] = pixel.data;
        
        const rgb = `rgb(${r}, ${g}, ${b})`;
        const hex = rgbToHex(r, g, b);
        
        updateColorInfo(hex, rgb);
    }

    function updateColorInfo(hex, rgb) {
        if (elements.preview) elements.preview.style.background = hex;
        if (elements.hexValue) elements.hexValue.value = hex;
        if (elements.rgbValue) elements.rgbValue.value = rgb;
    }

    if (elements.canvas) {
        elements.canvas.addEventListener('mousemove', pickColor);
        elements.canvas.addEventListener('click', pickColor);
    }

    // 6. Color Extraction
    function extractAndDisplayColors() {
        if (!elements.colorsPalette || !originalImage) return;
        
        elements.colorsPalette.innerHTML = '';

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const size = 50;
        
        tempCanvas.width = size;
        tempCanvas.height = size;
        tempCtx.drawImage(originalImage, 0, 0, size, size);
        
        const imageData = tempCtx.getImageData(0, 0, size, size).data;
        const colorMap = {};

        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const key = `${Math.floor(r/32)*32},${Math.floor(g/32)*32},${Math.floor(b/32)*32}`;
            colorMap[key] = (colorMap[key] || 0) + 1;
        }

        const sortedColors = Object.entries(colorMap)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8);

        sortedColors.forEach(([key]) => {
            const [qr, qg, qb] = key.split(',').map(Number);
            const r = qr + 16;
            const g = qg + 16;
            const b = qb + 16;
            const hex = rgbToHex(r, g, b);
            
            createColorBox(hex, r, g, b);
        });
    }

    function createColorBox(hex, r, g, b) {
        const colorBox = document.createElement('div');
        colorBox.className = 'palette-color-box';
        colorBox.style.backgroundColor = hex;
        
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        const textColor = brightness > 128 ? '#000000' : '#ffffff';

        colorBox.innerHTML = `
            <span style="color: ${textColor}; font-weight: 600;">${hex}</span>
            <button class="copy-btn" style="color: ${textColor}; border: 1px solid ${textColor}40; background: rgba(255,255,255,0.2);">Copy</button>
        `;

        colorBox.querySelector('.copy-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            copyToClipboard(hex);
        });

        colorBox.addEventListener('click', function() {
            updateColorInfo(hex, `rgb(${r}, ${g}, ${b})`);
        });

        elements.colorsPalette.appendChild(colorBox);
    }

    // 7. Utility Functions
    function rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(function() {
            showNotification('Copied to clipboard!', 'success');
        }).catch(function() {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('Copied to clipboard!', 'success');
        });
    }

    // 8. Copy Button Events
    if (elements.copyHexBtn) {
        elements.copyHexBtn.addEventListener('click', function() {
            if (elements.hexValue && elements.hexValue.value) {
                copyToClipboard(elements.hexValue.value);
            } else {
                showNotification('No color to copy', 'error');
            }
        });
    }
    
    if (elements.copyRgbBtn) {
        elements.copyRgbBtn.addEventListener('click', function() {
            if (elements.rgbValue && elements.rgbValue.value) {
                copyToClipboard(elements.rgbValue.value);
            } else {
                showNotification('No color to copy', 'error');
            }
        });
    }

    // 9. Cursor Logo Effect
    function moveCursorLogo(e) {
        if (!elements.cursorLogo) return;
        elements.cursorLogo.style.left = (e.clientX + 15) + 'px';
        elements.cursorLogo.style.top = (e.clientY + 15) + 'px';
    }

    if (elements.uploaderLabel && elements.cursorLogo) {
        elements.uploaderLabel.addEventListener('mouseenter', function() {
            elements.cursorLogo.style.display = 'block';
            document.addEventListener('mousemove', moveCursorLogo);
        });

        elements.uploaderLabel.addEventListener('mouseleave', function() {
            elements.cursorLogo.style.display = 'none';
            document.removeEventListener('mousemove', moveCursorLogo);
        });
    }

    // 10. Modal Handling
    function setupModals() {
        // Close buttons
        const closeLogin = document.getElementById('closeLogin');
        const closeRegister = document.getElementById('closeRegister');
        
        if (closeLogin) {
            closeLogin.addEventListener('click', function() {
                if (elements.loginModal) elements.loginModal.style.display = 'none';
            });
        }
        
        if (closeRegister) {
            closeRegister.addEventListener('click', function() {
                if (elements.registerModal) elements.registerModal.style.display = 'none';
            });
        }

        // Outside click to close
        window.addEventListener('click', function(e) {
            if (elements.loginModal && e.target === elements.loginModal) {
                elements.loginModal.style.display = 'none';
            }
            if (elements.registerModal && e.target === elements.registerModal) {
                elements.registerModal.style.display = 'none';
            }
        });

        // Form submissions
        if (elements.loginForm) {
            elements.loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                
                if (!email || !password) {
                    showNotification('Please fill in all fields', 'error');
                    return;
                }
                
                try {
                    await window.loginUser(email, password);
                    if (elements.loginModal) elements.loginModal.style.display = 'none';
                    elements.loginForm.reset();
                } catch (error) {
                    // Error handled in loginUser
                }
            });
        }

        if (elements.registerForm) {
            elements.registerForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const email = document.getElementById('registerEmail').value;
                const password = document.getElementById('registerPassword').value;
                
                if (!email || !password) {
                    showNotification('Please fill in all fields', 'error');
                    return;
                }
                
                if (password.length < 6) {
                    showNotification('Password must be at least 6 characters', 'error');
                    return;
                }
                
                try {
                    await window.registerUser(email, password);
                    if (elements.registerModal) elements.registerModal.style.display = 'none';
                    elements.registerForm.reset();
                } catch (error) {
                    // Error handled in registerUser
                }
            });
        }

        // Auth buttons
        if (elements.loginBtn) {
            elements.loginBtn.addEventListener('click', function() {
                if (elements.loginModal) elements.loginModal.style.display = 'block';
            });
        }
        
        if (elements.registerBtn) {
            elements.registerBtn.addEventListener('click', function() {
                if (elements.registerModal) elements.registerModal.style.display = 'block';
            });
        }
        
        if (elements.logoutBtn) {
            elements.logoutBtn.addEventListener('click', function() {
                if (window.logoutUser) {
                    window.logoutUser();
                }
            });
        }
    }

    // 11. Initialize Everything
    function init() {
        initDarkMode();
        setupModals();
        console.log('✅ ChromaPick initialized successfully!');
        showNotification('Welcome to ChromaPick! Upload or paste an image to start picking colors.', 'info');
    }

    // Start the app
    init();
});