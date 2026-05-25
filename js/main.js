import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/dist/module/index.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const chatsList = document.getElementById('chatsList');
const chatHeader = document.getElementById('chatHeader');
const messagesContainer = document.getElementById('messagesContainer');
const chatInput = document.getElementById('chatInput');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const newChatModal = document.getElementById('newChatModal');
const newChatName = document.getElementById('newChatName');
const createChatBtn = document.getElementById('createChatBtn');
const closeChatModal = document.getElementById('closeChatModal');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const generalMessages = document.getElementById('generalMessages');
const generalMessageInput = document.getElementById('generalMessageInput');
const generalSendBtn = document.getElementById('generalSendBtn');

let currentUser = null;
let currentChat = null;
let selectedChatId = null;

// Initialize
async function init() {
    await checkAuth();
    await loadUserName();
    await loadChats();
    await loadGeneralChat();
    setupEventListeners();
}

// Check Authentication
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'auth.html';
        return;
    }
    currentUser = user;
}

// Load User Name
async function loadUserName() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', currentUser.id)
            .single();

        if (data && data.name) {
            userName.textContent = data.name;
        } else {
            userName.textContent = currentUser.email;
        }
    } catch (error) {
        userName.textContent = currentUser.email || 'Пользователь';
    }
}

// Load Chats
async function loadChats() {
    try {
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        chatsList.innerHTML = '';
        
        if (!data || data.length === 0) {
            chatsList.innerHTML = '<p class="empty-state">Нет чатов. Создайте новый чат!</p>';
            return;
        }

        data.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.textContent = chat.name;
            chatItem.addEventListener('click', () => selectChat(chat.id, chat.name));
            chatsList.appendChild(chatItem);
        });

        // Load messages for first chat
        if (data.length > 0) {
            selectChat(data[0].id, data[0].name);
        }

    } catch (error) {
        console.error('Error loading chats:', error);
        chatsList.innerHTML = '<p class="empty-state">Ошибка загрузки чатов</p>';
    }
}

// Select Chat
async function selectChat(chatId, chatName) {
    selectedChatId = chatId;
    currentChat = { id: chatId, name: chatName };

    // Update active state
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
        if (item.textContent === chatName) {
            item.classList.add('active');
        }
    });

    // Update header
    chatHeader.innerHTML = `<h2>${chatName}</h2>`;

    // Load messages
    await loadMessages(chatId);

    // Show input
    chatInput.classList.remove('hidden');
}

// Load Messages
async function loadMessages(chatId) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        messagesContainer.innerHTML = '';

        if (!data || data.length === 0) {
            messagesContainer.innerHTML = '<p class="empty-state">Сообщений нет. Начните разговор!</p>';
            return;
        }

        data.forEach(message => {
            displayMessage(message, messagesContainer);
        });

        messagesContainer.scrollTop = messagesContainer.scrollHeight;

    } catch (error) {
        console.error('Error loading messages:', error);
        messagesContainer.innerHTML = '<p class="empty-state">Ошибка загрузки сообщений</p>';
    }
}

// Display Message
function displayMessage(message, container) {
    const messageDiv = document.createElement('div');
    const isOwn = message.user_id === currentUser.id;
    messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;

    const time = new Date(message.created_at).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageDiv.innerHTML = `
        <div class="message-content">
            ${isOwn ? '' : `<strong>${message.user_name || 'Пользователь'}</strong><br>`}
            ${escapeHtml(message.content)}
            <span class="message-time">${time}</span>
        </div>
    `;

    container.appendChild(messageDiv);
}

// Send Message
async function sendMessage() {
    const content = messageInput.value.trim();

    if (!content || !selectedChatId) {
        return;
    }

    try {
        messageInput.value = '';
        sendBtn.disabled = true;

        const { error } = await supabase
            .from('messages')
            .insert([
                {
                    chat_id: selectedChatId,
                    user_id: currentUser.id,
                    user_name: userName.textContent,
                    content: content,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        // Reload messages
        await loadMessages(selectedChatId);

    } catch (error) {
        console.error('Error sending message:', error);
        alert('Ошибка отправки сообщения');
        messageInput.value = content;
    } finally {
        sendBtn.disabled = false;
    }
}

// Load General Chat
async function loadGeneralChat() {
    try {
        const { data, error } = await supabase
            .from('general_chat')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        generalMessages.innerHTML = '';

        if (!data || data.length === 0) {
            generalMessages.innerHTML = '<p class="empty-state">Сообщений нет</p>';
            return;
        }

        data.forEach(message => {
            displayMessage(message, generalMessages);
        });

        generalMessages.scrollTop = generalMessages.scrollHeight;

    } catch (error) {
        console.error('Error loading general chat:', error);
        generalMessages.innerHTML = '<p class="empty-state">Ошибка загрузки</p>';
    }
}

// Send General Message
async function sendGeneralMessage() {
    const content = generalMessageInput.value.trim();

    if (!content) {
        return;
    }

    try {
        generalMessageInput.value = '';
        generalSendBtn.disabled = true;

        const { error } = await supabase
            .from('general_chat')
            .insert([
                {
                    user_id: currentUser.id,
                    user_name: userName.textContent,
                    content: content,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        await loadGeneralChat();

    } catch (error) {
        console.error('Error sending message:', error);
        alert('Ошибка отправки сообщения');
        generalMessageInput.value = content;
    } finally {
        generalSendBtn.disabled = false;
    }
}

// Create New Chat
async function createNewChat() {
    const chatName = newChatName.value.trim();

    if (!chatName) {
        alert('Введите название чата');
        return;
    }

    try {
        createChatBtn.disabled = true;

        const { error } = await supabase
            .from('chats')
            .insert([
                {
                    name: chatName,
                    created_by: currentUser.id,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        newChatName.value = '';
        newChatModal.classList.add('hidden');
        await loadChats();

    } catch (error) {
        console.error('Error creating chat:', error);
        alert('Ошибка создания чата');
    } finally {
        createChatBtn.disabled = false;
    }
}

// Logout
async function logout() {
    try {
        await supabase.auth.signOut();
        window.location.href = 'auth.html';
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    generalSendBtn.addEventListener('click', sendGeneralMessage);
    generalMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendGeneralMessage();
        }
    });

    newChatBtn.addEventListener('click', () => {
        newChatModal.classList.remove('hidden');
    });

    closeChatModal.addEventListener('click', () => {
        newChatModal.classList.add('hidden');
    });

    createChatBtn.addEventListener('click', createNewChat);

    logoutBtn.addEventListener('click', logout);

    // Subscribe to real-time updates
    const messageSubscription = supabase
        .channel('messages')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages' },
            (payload) => {
                if (payload.new.chat_id === selectedChatId) {
                    displayMessage(payload.new, messagesContainer);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }
        )
        .subscribe();

    const generalSubscription = supabase
        .channel('general_chat')
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'general_chat' },
            (payload) => {
                displayMessage(payload.new, generalMessages);
                generalMessages.scrollTop = generalMessages.scrollHeight;
            }
        )
        .subscribe();
}

// Utility Functions
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize app
init();