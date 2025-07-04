// File: public/js/gm.js

// Global State
let currentSession = null;
let scenarios = [];
let gms = [];
let socket = null;
let isWebSocketEnabled = true;

// DOM Elements
const elements = {
    connectionStatus: document.getElementById('connection-status'),
    tabs: {
        setup: document.getElementById('tab-setup'),
        session: document.getElementById('tab-session'),
        players: document.getElementById('tab-players')
    },
    content: {
        setup: document.getElementById('content-setup'),
        session: document.getElementById('content-session'),
        players: document.getElementById('content-players')
    },
    qrCodeContainer: document.getElementById('qr-code-container'),
    qrCodeDisplay: document.getElementById('qr-code-display'),
    qrCodeImage: document.getElementById('qr-code-image'),
    playersList: document.getElementById('players-list'),
    playerUrl: document.getElementById('player-url')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 Game Master UI wird initialisiert...');
    
    // WebSocket ist optional - App funktioniert auch ohne
    try {
        await initWebSocket();
    } catch (error) {
        console.warn('⚠️ WebSocket nicht verfügbar, App läuft ohne Echtzeit-Features');
        isWebSocketEnabled = false;
        updateConnectionStatus(false);
    }
    
    setupTabs();
    setupEventListeners();
    initializeEmptySelects();
    
    console.log('🎮 Game Master UI initialisiert');
});

// WebSocket Setup (Optional)
async function initWebSocket() {
    if (!isWebSocketEnabled) return;
    
    try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
            console.log('🔗 WebSocket verbunden');
            updateConnectionStatus(true);
        };
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };
        
        socket.onclose = () => {
            console.log('🔌 WebSocket getrennt');
            updateConnectionStatus(false);
            // Optional reconnect - nicht kritisch
            if (isWebSocketEnabled) {
                setTimeout(() => initWebSocket(), 5000);
            }
        };
        
        socket.onerror = (error) => {
            console.warn('⚠️ WebSocket Error:', error);
            updateConnectionStatus(false);
            isWebSocketEnabled = false;
        };
    } catch (error) {
        console.warn('⚠️ WebSocket Setup fehlgeschlagen:', error);
        isWebSocketEnabled = false;
        updateConnectionStatus(false);
    }
}

function handleWebSocketMessage(data) {
    if (!isWebSocketEnabled) return;
    
    console.log('📨 WebSocket Nachricht:', data);
    
    switch (data.type) {
        case 'welcome':
            console.log('👋 Willkommen:', data.message);
            break;
        case 'player_joined':
            showNotification(`🎭 ${data.playerName} ist der Session beigetreten`);
            loadPlayersData();
            break;
        case 'player_answer_received':
            showNotification(`💭 ${data.playerName} hat geantwortet`);
            break;
        case 'round_results_ready':
            showNotification('🎬 Runden-Ergebnisse sind bereit!');
            break;
    }
}

function updateConnectionStatus(connected) {
    if (!elements.connectionStatus) return;
    
    if (connected && isWebSocketEnabled) {
        elements.connectionStatus.textContent = 'Online';
        elements.connectionStatus.className = 'text-green-500';
    } else {
        elements.connectionStatus.textContent = isWebSocketEnabled ? 'Offline' : 'Lokal';
        elements.connectionStatus.className = 'text-yellow-500';
    }
}

// Tabs Setup
function setupTabs() {
    // Tab click handlers
    Object.entries(elements.tabs).forEach(([tabName, tabElement]) => {
        if (tabElement) {
            tabElement.addEventListener('click', () => showTab(tabName));
        }
    });
}

function showTab(tabName) {
    // Reset all tabs
    Object.entries(elements.tabs).forEach(([name, element]) => {
        if (element) {
            element.classList.remove('active', 'text-blue-600', 'border-b-2', 'border-blue-600');
            element.classList.add('text-gray-600');
        }
    });
    
    // Reset all content
    Object.entries(elements.content).forEach(([name, element]) => {
        if (element) {
            element.classList.add('hidden');
        }
    });
    
    // Activate selected tab
    if (elements.tabs[tabName]) {
        elements.tabs[tabName].classList.add('active', 'text-blue-600', 'border-b-2', 'border-blue-600');
        elements.tabs[tabName].classList.remove('text-gray-600');
    }
    
    // Show selected content
    if (elements.content[tabName]) {
        elements.content[tabName].classList.remove('hidden');
    }
    
    // Load data for specific tabs
    if (tabName === 'players') {
        loadPlayersData();
    }
}

// Event Listeners
function setupEventListeners() {
    // Form Submissions
    const createGMForm = document.getElementById('create-gm-form');
    if (createGMForm) {
        createGMForm.addEventListener('submit', handleCreateGM);
    }
    
    const createScenarioForm = document.getElementById('create-scenario-form');
    if (createScenarioForm) {
        createScenarioForm.addEventListener('submit', handleCreateScenario);
    }
    
    const createSessionForm = document.getElementById('create-session-form');
    if (createSessionForm) {
        createSessionForm.addEventListener('submit', handleCreateSession);
    }
    
    // Load buttons
    const loadGMsBtn = document.getElementById('load-gms-btn');
    if (loadGMsBtn) {
        loadGMsBtn.addEventListener('click', loadGMs);
    }
    
    const loadScenariosBtn = document.getElementById('load-scenarios-btn');
    if (loadScenariosBtn) {
        loadScenariosBtn.addEventListener('click', loadScenarios);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
    }
}

// API Calls
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('❌ API Call Error:', error);
        showNotification(`Fehler: ${error.message}`, 'error');
        throw error;
    }
}

// Initialize empty selects
function initializeEmptySelects() {
    updateScenarioSelect();
    updateGMSelect();
}

// Load Data
async function loadScenarios() {
    try {
        const response = await apiCall('/api/scenarios');
        scenarios = response.data || [];
        updateScenarioSelect();
        showNotification('Szenarien geladen', 'success');
    } catch (error) {
        console.error('❌ Fehler beim Laden der Scenarios:', error);
    }
}

async function loadGMs() {
    try {
        const response = await apiCall('/api/gms');
        gms = response.data || [];
        updateGMSelect();
        showNotification('Game Masters geladen', 'success');
    } catch (error) {
        console.error('❌ Fehler beim Laden der GMs:', error);
    }
}

async function loadPlayersData() {
    try {
        const response = await apiCall('/api/players');
        const players = response.data || [];
        displayPlayers(players);
    } catch (error) {
        console.error('❌ Fehler beim Laden der Spieler:', error);
    }
}

function updateScenarioSelect() {
    const select = document.getElementById('session-scenario');
    if (!select) return;
    
    select.innerHTML = '<option value="">Wähle ein Szenario</option>';
    
    if (scenarios && scenarios.length > 0) {
        scenarios.forEach(scenario => {
            const option = document.createElement('option');
            option.value = scenario.id;
            option.textContent = `${scenario.number}. ${scenario.title}`;
            select.appendChild(option);
        });
    }
}

function updateGMSelect() {
    const select = document.getElementById('session-gm');
    if (!select) return;
    
    select.innerHTML = '<option value="">Wähle einen Game Master</option>';
    
    if (gms && gms.length > 0) {
        gms.forEach(gm => {
            const option = document.createElement('option');
            option.value = gm.id;
            option.textContent = gm.name;
            select.appendChild(option);
        });
    }
}

// Form Handlers
async function handleCreateGM(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const gmData = {
        name: formData.get('name') || document.getElementById('gm-name').value,
        tag: formData.get('tag') || document.getElementById('gm-tag').value,
        voice: formData.get('voice') || document.getElementById('gm-voice').value,
        look: formData.get('look') || document.getElementById('gm-look').value,
        mood: formData.get('mood') || document.getElementById('gm-mood').value,
        slogan: formData.get('slogan') || document.getElementById('gm-slogan').value,
        backgroundStory: formData.get('backgroundStory') || document.getElementById('gm-background-story').value
    };
    
    try {
        const response = await apiCall('/api/gms', {
            method: 'POST',
            body: JSON.stringify(gmData)
        });
        
        showNotification('Game Master erfolgreich erstellt!', 'success');
        e.target.reset();
        await loadGMs();
    } catch (error) {
        console.error('❌ Fehler beim Erstellen des GMs:', error);
    }
}

async function handleCreateScenario(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const scenarioData = {
        number: parseInt(formData.get('number')) || parseInt(document.getElementById('scenario-number').value),
        title: formData.get('title') || document.getElementById('scenario-title').value,
        text: formData.get('text') || document.getElementById('scenario-text').value
    };
    
    try {
        const response = await apiCall('/api/scenarios', {
            method: 'POST',
            body: JSON.stringify(scenarioData)
        });
        
        showNotification('Szenario erfolgreich erstellt!', 'success');
        e.target.reset();
        await loadScenarios();
    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Szenarios:', error);
    }
}

async function handleCreateSession(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const sessionData = {
        gmId: formData.get('gmId') || document.getElementById('session-gm').value,
        scenarioId: formData.get('scenarioId') || document.getElementById('session-scenario').value,
        maxPlayers: parseInt(formData.get('maxPlayers')) || parseInt(document.getElementById('session-max-players').value) || 6
    };
    
    try {
        const response = await apiCall('/api/sessions', {
            method: 'POST',
            body: JSON.stringify(sessionData)
        });
        
        currentSession = response.data;
        showNotification('Session erfolgreich erstellt!', 'success');
        displaySession(currentSession);
        e.target.reset();
    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Session:', error);
    }
}

function displaySession(session) {
    if (!session) return;
    
    // Generate QR Code
    const playerUrl = `${window.location.origin}/player?session=${session.id}`;
    
    if (elements.qrCodeContainer) {
        elements.qrCodeContainer.classList.remove('hidden');
    }
    
    if (elements.qrCodeDisplay) {
        elements.qrCodeDisplay.classList.remove('hidden');
    }
    
    if (elements.qrCodeImage) {
        elements.qrCodeImage.src = `/qr?url=${encodeURIComponent(playerUrl)}`;
    }
    
    if (elements.playerUrl) {
        elements.playerUrl.textContent = playerUrl;
    }
}

function displayPlayers(players) {
    if (!elements.playersList) return;
    
    if (!players || players.length === 0) {
        elements.playersList.innerHTML = `
            <div class="bg-gray-100 rounded-lg p-4 text-center">
                <p class="text-gray-600">Keine Spieler verbunden</p>
            </div>
        `;
        return;
    }
    
    elements.playersList.innerHTML = players.map(player => `
        <div class="bg-white border rounded-lg p-4 flex items-center justify-between">
            <div>
                <h3 class="font-semibold text-gray-800">${player.name}</h3>
                <p class="text-sm text-gray-600">Session: ${player.sessionId}</p>
            </div>
            <div class="text-right">
                <span class="text-sm text-gray-500">${player.joinedAt ? new Date(player.joinedAt).toLocaleTimeString() : 'Gerade beigetreten'}</span>
            </div>
        </div>
    `).join('');
}

function refreshData() {
    loadGMs();
    loadScenarios();
    loadPlayersData();
    showNotification('Daten aktualisiert', 'info');
}

// Utility Functions
function showNotification(message, type = 'success') {
    const statusContainer = document.getElementById('status-messages');
    if (!statusContainer) return;
    
    const notification = document.createElement('div');
    notification.className = `px-4 py-3 rounded-lg text-white ${
        type === 'error' ? 'bg-red-500' : 
        type === 'success' ? 'bg-green-500' : 
        'bg-blue-500'
    }`;
    notification.textContent = message;
    
    statusContainer.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Debug
console.log('🎮 Game Master JavaScript geladen'); 