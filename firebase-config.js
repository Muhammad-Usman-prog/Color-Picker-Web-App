// firebase-config.js
console.log('Loading Firebase configuration...');

// Simple notification system
function showNotification(message, type = 'info') {
    console.log(`Notification [${type}]:`, message);
    
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;

    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 16px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: 300px;
                animation: slideIn 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            .notification-success { background: #10b981; }
            .notification-error { background: #ef4444; }
            .notification-info { background: #3b82f6; }
            .notification-warning { background: #f59e0b; }
            .notification-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    const autoRemove = setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);

    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(autoRemove);
        notification.remove();
    });
}




const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_AUTH_DOMAIN_HERE",
    projectId: "YOUR_PROJECT_ID_HERE",
    storageBucket: "YOUR_STORAGE_BUCKET_HERE",
    messagingSenderId: "YOUR_SENDER_ID_HERE",
    appId: "YOUR_APP_ID_HERE",
    measurementId: "YOUR_MEASUREMENT_ID_HERE"
};


let auth = null;
let app = null;
let isDemoMode = false;

try {
    if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded. Check your script tags.');
    }

    console.log('Firebase SDK detected, initializing...');
    
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    
    console.log('✅ Firebase initialized successfully!');
    showNotification('Firebase connected! You can now create an account.', 'success');

} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    showNotification('Firebase connection failed. Running in demo mode.', 'warning');
    isDemoMode = true;
    setupDemoMode();
}

function setupDemoMode() {
    console.log('🔄 Setting up demo mode...');
    
    auth = {
        currentUser: null,
        onAuthStateChanged(callback) {
            callback(null);
            return () => {};
        },
        async signInWithEmailAndPassword(email, password) {
            throw new Error('Authentication disabled in demo mode');
        },
        async createUserWithEmailAndPassword(email, password) {
            throw new Error('Registration disabled in demo mode');
        },
        async signOut() {
            return Promise.resolve();
        }
    };

    setTimeout(() => {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        
        if (loginBtn) {
            loginBtn.textContent = 'Demo Mode';
            loginBtn.style.opacity = '0.7';
        }
        if (registerBtn) {
            registerBtn.style.display = 'none';
        }
    }, 100);
}

// Auth state management
if (auth) {
    auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? user.email : 'No user');
        updateAuthUI(user);
    });
}

function updateAuthUI(user) {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (!loginBtn || !registerBtn || !logoutBtn) return;
    
    if (user && !isDemoMode) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        showNotification(`Welcome, ${user.email}!`, 'success');
    } else {
        loginBtn.style.display = 'inline-block';
        registerBtn.style.display = isDemoMode ? 'none' : 'inline-block';
        logoutBtn.style.display = 'none';
        
        if (isDemoMode && loginBtn.textContent !== 'Demo Mode') {
            loginBtn.textContent = 'Demo Mode';
            loginBtn.style.opacity = '0.7';
        }
    }
}

// Authentication functions
async function loginUser(email, password) {
    if (isDemoMode) {
        showNotification('Authentication disabled in demo mode', 'warning');
        throw new Error('Demo mode active');
    }
    
    if (!auth?.signInWithEmailAndPassword) {
        showNotification('Authentication service not available', 'error');
        throw new Error('Auth service unavailable');
    }

    try {
        showNotification('Signing in...', 'info');
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('✅ Login successful:', userCredential.user.email);
        return userCredential.user;
    } catch (error) {
        console.error('❌ Login error:', error);
        
        let userMessage = 'Login failed. ';
        
        if (error.code === 'auth/invalid-login-credentials') {
            userMessage = '❌ Invalid email or password. Please check your credentials or create a new account.';
        } else if (error.code === 'auth/user-not-found') {
            userMessage = '🔍 No account found with this email. Please register first.';
        } else if (error.code === 'auth/wrong-password') {
            userMessage = '🔐 Incorrect password. Please try again or reset your password.';
        } else if (error.code === 'auth/invalid-email') {
            userMessage = '📧 Invalid email address format.';
        } else if (error.code === 'auth/too-many-requests') {
            userMessage = '🚫 Too many failed attempts. Please try again later.';
        } else {
            userMessage = 'Login error: ' + (error.message || 'Please try again.');
        }
        
        showNotification(userMessage, 'error');
        throw error;
    }
}

async function registerUser(email, password) {
    if (isDemoMode) {
        showNotification('Registration disabled in demo mode', 'warning');
        throw new Error('Demo mode active');
    }
    
    if (!auth?.createUserWithEmailAndPassword) {
        showNotification('Registration service not available', 'error');
        throw new Error('Registration service unavailable');
    }

    try {
        showNotification('Creating your account...', 'info');
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        console.log('✅ Registration successful:', userCredential.user.email);
        showNotification('🎉 Account created successfully! You are now logged in.', 'success');
        return userCredential.user;
    } catch (error) {
        console.error('❌ Registration error:', error);
        
        let userMessage = 'Registration failed. ';
        
        if (error.code === 'auth/email-already-in-use') {
            userMessage = '📧 Email already registered. Please login instead.';
        } else if (error.code === 'auth/invalid-email') {
            userMessage = '📧 Invalid email address format.';
        } else if (error.code === 'auth/weak-password') {
            userMessage = '🔐 Password should be at least 6 characters long.';
        } else if (error.code === 'auth/operation-not-allowed') {
            userMessage = '🚫 Email/password accounts are not enabled. Check Firebase Console.';
        } else {
            userMessage = 'Registration error: ' + (error.message || 'Please try again.');
        }
        
        showNotification(userMessage, 'error');
        throw error;
    }
}

async function logoutUser() {
    if (isDemoMode) {
        showNotification('You are in demo mode', 'info');
        return;
    }
    
    if (!auth?.signOut) {
        showNotification('Logout service not available', 'error');
        return;
    }

    try {
        await auth.signOut();
        showNotification('👋 Successfully logged out!', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Error during logout', 'error');
    }
}

// Make functions globally available
window.loginUser = loginUser;
window.registerUser = registerUser;
window.logoutUser = logoutUser;
window.firebaseAuth = auth;
window.showNotification = showNotification;
window.isDemoMode = isDemoMode;

console.log('🔥 Firebase configuration loaded');