import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/dist/module/index.js';

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const registerName = document.getElementById('registerName');
const registerEmail = document.getElementById('registerEmail');
const registerPassword = document.getElementById('registerPassword');
const registerPassword2 = document.getElementById('registerPassword2');
const registerBtn = document.getElementById('registerBtn');
const toRegisterBtn = document.getElementById('toRegisterBtn');
const toLoginBtn = document.getElementById('toLoginBtn');
const authError = document.getElementById('authError');
const authSuccess = document.getElementById('authSuccess');

// Form Switching
toRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    hideMessages();
});

toLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    hideMessages();
});

// Login Handler
loginBtn.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
        showError('Заполните все поля');
        return;
    }

    try {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Загрузка...';

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        showSuccess('Добро пожаловать!');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        showError(error.message || 'Ошибка входа');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Войти';
    }
});

// Register Handler
registerBtn.addEventListener('click', async () => {
    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();
    const password2 = registerPassword2.value.trim();

    if (!name || !email || !password || !password2) {
        showError('Заполните все поля');
        return;
    }

    if (password !== password2) {
        showError('Пароли не совпадают');
        return;
    }

    if (password.length < 6) {
        showError('Пароль должен быть минимум 6 символов');
        return;
    }

    try {
        registerBtn.disabled = true;
        registerBtn.textContent = 'Загрузка...';

        // Sign up
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    display_name: name
                }
            }
        });

        if (authError) {
            throw authError;
        }

        // Create user profile
        if (authData.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        name: name,
                        email: email,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (profileError && profileError.code !== 'PGRST116') {
                console.warn('Profile creation warning:', profileError);
            }
        }

        showSuccess('Регистрация успешна! Проверьте email для подтверждения.');
        setTimeout(() => {
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            registerName.value = '';
            registerEmail.value = '';
            registerPassword.value = '';
            registerPassword2.value = '';
        }, 2000);

    } catch (error) {
        showError(error.message || 'Ошибка регистрации');
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Зарегистрироваться';
    }
});

// Check if already logged in
async function checkAuth() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.log('Not authenticated');
    }
}

// Message Functions
function showError(message) {
    authError.textContent = message;
    authError.classList.remove('hidden');
    authSuccess.classList.add('hidden');
}

function showSuccess(message) {
    authSuccess.textContent = message;
    authSuccess.classList.remove('hidden');
    authError.classList.add('hidden');
}

function hideMessages() {
    authError.classList.add('hidden');
    authSuccess.classList.add('hidden');
}

// Check auth on page load
checkAuth();