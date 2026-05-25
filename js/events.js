import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/dist/module/index.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const eventsList = document.getElementById('eventsList');
const newEventBtn = document.getElementById('newEventBtn');
const eventModal = document.getElementById('eventModal');
const eventTitle = document.getElementById('eventTitle');
const eventDescription = document.getElementById('eventDescription');
const eventDateTime = document.getElementById('eventDateTime');
const createEventBtn = document.getElementById('createEventBtn');
const closeEventModal = document.getElementById('closeEventModal');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');

let currentUser = null;

// Initialize
async function init() {
    await checkAuth();
    await loadUserName();
    await loadEvents();
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

// Load Events
async function loadEvents() {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('event_date', { ascending: true });

        if (error) throw error;

        eventsList.innerHTML = '';

        if (!data || data.length === 0) {
            eventsList.innerHTML = '<p class="empty-state">Ивенты появятся здесь</p>';
            return;
        }

        data.forEach(event => {
            const eventCard = createEventCard(event);
            eventsList.appendChild(eventCard);
        });

    } catch (error) {
        console.error('Error loading events:', error);
        eventsList.innerHTML = '<p class="empty-state">Ошибка загрузки ивентов</p>';
    }
}

// Create Event Card
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';

    const eventDate = new Date(event.event_date);
    const formattedDate = eventDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    card.innerHTML = `
        <h3>${escapeHtml(event.title)}</h3>
        <p>${escapeHtml(event.description || 'Без описания')}</p>
        <span class="event-date">${formattedDate}</span>
        <div style="margin-top: 1rem; font-size: 0.85rem; color: #666;">
            <p>Создал: ${escapeHtml(event.creator_name || 'Неизвестный')}</p>
        </div>
    `;

    return card;
}

// Create New Event
async function createNewEvent() {
    const title = eventTitle.value.trim();
    const description = eventDescription.value.trim();
    const dateTime = eventDateTime.value;

    if (!title || !dateTime) {
        alert('Заполните название и дату ивента');
        return;
    }

    try {
        createEventBtn.disabled = true;

        const { error } = await supabase
            .from('events')
            .insert([
                {
                    title: title,
                    description: description,
                    event_date: new Date(dateTime).toISOString(),
                    created_by: currentUser.id,
                    creator_name: userName.textContent,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        eventTitle.value = '';
        eventDescription.value = '';
        eventDateTime.value = '';
        eventModal.classList.add('hidden');

        await loadEvents();

    } catch (error) {
        console.error('Error creating event:', error);
        alert('Ошибка создания ивента');
    } finally {
        createEventBtn.disabled = false;
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
    newEventBtn.addEventListener('click', () => {
        eventModal.classList.remove('hidden');
    });

    closeEventModal.addEventListener('click', () => {
        eventModal.classList.add('hidden');
    });

    createEventBtn.addEventListener('click', createNewEvent);

    logoutBtn.addEventListener('click', logout);

    // Subscribe to real-time updates
    supabase
        .channel('events')
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'events' },
            (payload) => {
                const eventCard = createEventCard(payload.new);
                if (eventsList.textContent.includes('появятся')) {
                    eventsList.innerHTML = '';
                }
                eventsList.appendChild(eventCard);
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