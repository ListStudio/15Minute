import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/dist/module/index.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const channelsList = document.getElementById('channelsList');
const channelHeader = document.getElementById('channelHeader');
const channelMessages = document.getElementById('channelMessages');
const channelInput = document.getElementById('channelInput');
const channelMessageInput = document.getElementById('channelMessageInput');
const channelSendBtn = document.getElementById('channelSendBtn');
const newChannelBtn = document.getElementById('newChannelBtn');
const newChannelModal = document.getElementById('newChannelModal');
const newChannelName = document.getElementById('newChannelName');
const newChannelDescription = document.getElementById('newChannelDescription');
const createChannelBtn = document.getElementById('createChannelBtn');
const closeChannelModal = document.getElementById('closeChannelModal');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');

let currentUser = null;
let selectedChannelId = null;

// Initialize
async function init() {
    await checkAuth();
    await loadUserName();
    await loadChannels();
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

// Load Channels
async function loadChannels() {
    try {
        const { data, error } = await supabase
            .from('channels')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        channelsList.innerHTML = '';

        if (!data || data.length === 0) {
            channelsList.innerHTML = '<p class="empty-state">Нет каналов. Создайте новый!</p>';
            return;
        }

        data.forEach(channel => {
            const channelItem = document.createElement('div');
            channelItem.className = 'channel-item';
            channelItem.innerHTML = `
                <strong>${escapeHtml(channel.name)}</strong>
                <p style="font-size: 0.85rem; color: #666; margin-top: 0.3rem;">
                    ${escapeHtml(channel.description || 'Без описания')}
                </p>
            `;
            channelItem.addEventListener('click', () => selectChannel(channel.id, channel.name));
            channelsList.appendChild(channelItem);
        });

        // Load messages for first channel
        if (data.length > 0) {
            selectChannel(data[0].id, data[0].name);
        }

    } catch (error) {
        console.error('Error loading channels:', error);
        channelsList.innerHTML = '<p class="empty-state">Ошибка загрузки каналов</p>';
    }
}

// Select Channel
async function selectChannel(channelId, channelName) {
    selectedChannelId = channelId;

    // Update active state
    document.querySelectorAll('.channel-item').forEach(item => {
        item.classList.remove('active');
        if (item.textContent.includes(channelName)) {
            item.classList.add('active');
        }
    });

    // Update header
    channelHeader.innerHTML = `<h2>#${escapeHtml(channelName)}</h2>`;

    // Load messages
    await loadChannelMessages(channelId);

    // Show input
    channelInput.classList.remove('hidden');
}

// Load Channel Messages
async function loadChannelMessages(channelId) {
    try {
        const { data, error } = await supabase
            .from('channel_messages')
            .select('*')
            .eq('channel_id', channelId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        channelMessages.innerHTML = '';

        if (!data || data.length === 0) {
            channelMessages.innerHTML = '<p class="empty-state">Сообщений нет. Начните разговор!</p>';
            return;
        }

        data.forEach(message => {
            displayMessage(message);
        });

        channelMessages.scrollTop = channelMessages.scrollHeight;

    } catch (error) {
        console.error('Error loading channel messages:', error);
        channelMessages.innerHTML = '<p class="empty-state">Ошибка загрузки сообщений</p>';
    }
}

// Display Message
function displayMessage(message) {
    const messageDiv = document.createElement('div');
    const isOwn = message.user_id === currentUser.id;
    messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;

    const time = new Date(message.created_at).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageDiv.innerHTML = `
        <div class="message-content">
            ${isOwn ? '' : `<strong>${escapeHtml(message.user_name || 'Пользователь')}</strong><br>`}
            ${escapeHtml(message.content)}
            <span class="message-time">${time}</span>
        </div>
    `;

    channelMessages.appendChild(messageDiv);
}

// Send Channel Message
async function sendChannelMessage() {
    const content = channelMessageInput.value.trim();

    if (!content || !selectedChannelId) {
        return;
    }

    try {
        channelMessageInput.value = '';
        channelSendBtn.disabled = true;

        const { error } = await supabase
            .from('channel_messages')
            .insert([
                {
                    channel_id: selectedChannelId,
                    user_id: currentUser.id,
                    user_name: userName.textContent,
                    content: content,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        // Reload messages
        await loadChannelMessages(selectedChannelId);

    } catch (error) {
        console.error('Error sending message:', error);
        alert('Ошибка отправки сообщения');
        channelMessageInput.value = content;
    } finally {
        channelSendBtn.disabled = false;
    }
}

// Create New Channel
async function createNewChannel() {
    const name = newChannelName.value.trim();
    const description = newChannelDescription.value.trim();

    if (!name) {
        alert('Введите название канала');
        return;
    }

    try {
        createChannelBtn.disabled = true;

        const { error } = await supabase
            .from('channels')
            .insert([
                {
                    name: name,
                    description: description,
                    created_by: currentUser.id,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        newChannelName.value = '';
        newChannelDescription.value = '';
        newChannelModal.classList.add('hidden');

        await loadChannels();

    } catch (error) {
        console.error('Error creating channel:', error);
        alert('Ошибка создания канала');
    } finally {
        createChannelBtn.disabled = false;
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
    channelSendBtn.addEventListener('click', sendChannelMessage);
    channelMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChannelMessage();
        }
    });

    newChannelBtn.addEventListener('click', () => {
        newChannelModal.classList.remove('hidden');
    });

    closeChannelModal.addEventListener('click', () => {
        newChannelModal.classList.add('hidden');
    });

    createChannelBtn.addEventListener('click', createNewChannel);

    logoutBtn.addEventListener('click', logout);

    // Subscribe to real-time updates
    supabase
        .channel('channel_messages')
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'channel_messages' },
            (payload) => {
                if (payload.new.channel_id === selectedChannelId) {
                    displayMessage(payload.new);
                    channelMessages.scrollTop = channelMessages.scrollHeight;
                }
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