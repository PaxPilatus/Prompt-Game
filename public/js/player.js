// File: public/js/player.js

// Global State
let currentPlayer = null;
let currentSession = null;
let players = [];
let socket = null;
let isWebSocketEnabled = true;

// DOM Elements
const elements = {
    connectionStatus: document.getElementById('connection-status'),
    welcomeScreen: document.getElementById('welcome-screen'),
    gameScreen: document.getElementById('game-screen'),
    sessionInfo: document.getElementById('session-info'),
    scenarioContent: document.getElementById('scenario-content'),
    playerInfo: document.getElementById('player-info'),
    playerContent: document.getElementById('player-content'),
    answerForm: document.getElementById('answer-form'),
    waitingScreen: document.getElementById('waiting-screen'),
    playerList: document.getElementById('player-list')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // WebSocket ist optional - App funktioniert auch ohne
    try {
        await initWebSocket();
    } catch (error) {
        console.warn('⚠️ WebSocket nicht verfügbar, App läuft ohne Echtzeit-Features');
        isWebSocketEnabled = false;
        updateConnectionStatus(false);
    }
    
    await loadPlayers();
    setupEventListeners();
    checkURLParams();
    console.log('🎮 Player UI initialisiert');
});

// Check URL parameters for direct session join
function checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    
    if (sessionId) {
        // Auto-fill session ID and open join modal
        const sessionInput = document.querySelector('input[name="sessionId"]');
        if (sessionInput) {
            sessionInput.value = sessionId;
            openModal('join-session-modal');
        }
    }
}

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
        case 'session_created':
            if (currentSession && currentSession.sessionId === data.sessionId) {
                showNotification('🎯 Session wurde aktualisiert');
            }
            break;
        case 'player_joined':
            if (currentSession && currentSession.sessionId === data.sessionId) {
                showNotification(`🎭 ${data.playerName} ist beigetreten`);
            }
            break;
        case 'round_results_ready':
            if (currentSession && currentSession.sessionId === data.sessionId) {
                showNotification('🎬 Runden-Ergebnisse sind bereit!');
            }
            break;
    }
}

function updateConnectionStatus(connected) {
    if (!elements.connectionStatus) return;
    
    if (connected && isWebSocketEnabled) {
        elements.connectionStatus.textContent = 'Online';
        elements.connectionStatus.className = 'connection-status online';
    } else {
        elements.connectionStatus.textContent = isWebSocketEnabled ? 'Offline' : 'Lokal';
        elements.connectionStatus.className = 'connection-status offline';
    }
}

// Event Listeners
function setupEventListeners() {
    // Form Submissions
    document.getElementById('player-form').addEventListener('submit', handleCreatePlayer);
    document.getElementById('join-session-form').addEventListener('submit', handleJoinSession);
    document.getElementById('player-answer-form').addEventListener('submit', handleSubmitAnswer);
    
    // Modal close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
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

// Load Data
async function loadPlayers() {
    try {
        const response = await apiCall('/api/players');
        players = response.data || [];
        updatePlayerList();
    } catch (error) {
        console.error('❌ Fehler beim Laden der Spieler:', error);
        players = [];
    }
}

function updatePlayerList() {
    elements.playerList.innerHTML = '';
    
    if (players.length === 0) {
        elements.playerList.innerHTML = '<p class="text-gray-400 text-center">Keine Charaktere verfügbar</p>';
        return;
    }
    
    players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors';
        playerDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <h4 class="font-bold">${player.name}</h4>
                    <p class="text-sm text-gray-300">${player.look}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs text-gray-400">${player.voice}</p>
                </div>
            </div>
        `;
        
        playerDiv.addEventListener('click', () => {
            selectPlayer(player);
        });
        
        elements.playerList.appendChild(playerDiv);
    });
}

// Form Handlers
async function handleCreatePlayer(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await apiCall('/api/players', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        showNotification('✅ Charakter erfolgreich erstellt!');
        closeModal('create-player-modal');
        e.target.reset();
        await loadPlayers();
    } catch (error) {
        console.error('❌ Charakter erstellen fehlgeschlagen:', error);
    }
}

async function handleJoinSession(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const sessionId = formData.get('sessionId');
    
    if (!currentPlayer) {
        showNotification('❌ Bitte wähle zuerst einen Charakter aus', 'error');
        return;
    }
    
    try {
        // Get session details
        const sessionResponse = await apiCall(`/api/sessions/${sessionId}`);
        currentSession = sessionResponse.data;
        
        // Join session
        await apiCall(`/api/sessions/${sessionId}/join`, {
            method: 'POST',
            body: JSON.stringify({
                playerId: currentPlayer.id,
                playerName: currentPlayer.name
            })
        });
        
        showGame();
        showNotification('✅ Session erfolgreich beigetreten!');
        closeModal('join-session-modal');
        e.target.reset();
    } catch (error) {
        console.error('❌ Session beitreten fehlgeschlagen:', error);
    }
}

async function handleSubmitAnswer(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const answer = formData.get('answer');
    
    if (!currentSession || !currentPlayer) {
        showNotification('❌ Keine aktive Session oder Charakter', 'error');
        return;
    }
    
    try {
        const payload = {
            sessionId: currentSession.sessionId,
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            voice: currentPlayer.voice,
            look: currentPlayer.look,
            mood: currentPlayer.mood,
            slogan: currentPlayer.slogan,
            backgroundStory: currentPlayer.backgroundStory,
            answer: answer
        };
        
        await apiCall('/api/rounds', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        showWaitingScreen();
        showNotification('✅ Antwort erfolgreich gesendet!');
        e.target.reset();
    } catch (error) {
        console.error('❌ Antwort senden fehlgeschlagen:', error);
    }
}

// Player Selection
function selectPlayer(player) {
    currentPlayer = player;
    showNotification(`🎭 ${player.name} ausgewählt!`);
    closeModal('select-player-modal');
    
    // If we have a session in URL, auto-open join modal
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    if (sessionId) {
        openModal('join-session-modal');
    }
}

// Screen Management
function showGame() {
    elements.welcomeScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');
    elements.answerForm.classList.remove('hidden');
    elements.waitingScreen.classList.add('hidden');
    
    displaySessionInfo();
    displayPlayerInfo();
}

function showWaitingScreen() {
    elements.answerForm.classList.add('hidden');
    elements.waitingScreen.classList.remove('hidden');
}

function displaySessionInfo() {
    if (!currentSession) return;
    
    // Find scenario info (would need to be passed from session data)
    let scenarioText = `
        <p class="mb-2"><strong>Session:</strong> ${currentSession.sessionId}</p>
        <p class="mb-2"><strong>Scenario ID:</strong> ${currentSession.scenarioId}</p>
        <p class="mb-2"><strong>GM ID:</strong> ${currentSession.gmId}</p>
        <p class="text-sm text-gray-400">Weitere Details werden vom Game Master bereitgestellt.</p>
    `;
    
    elements.scenarioContent.innerHTML = scenarioText;
}

function displayPlayerInfo() {
    if (!currentPlayer) return;
    
    const playerHtml = `
        <div class="space-y-2">
            <p><strong>Name:</strong> ${currentPlayer.name}</p>
            <p><strong>Aussehen:</strong> ${currentPlayer.look}</p>
            <p><strong>Stimmung:</strong> ${currentPlayer.mood}</p>
            <p><strong>Slogan:</strong> "${currentPlayer.slogan}"</p>
            <p><strong>Hintergrund:</strong> ${currentPlayer.backgroundStory}</p>
            <p><strong>Stimme:</strong> ${currentPlayer.voice}</p>
        </div>
    `;
    
    elements.playerContent.innerHTML = playerHtml;
}

// Modal Management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        
        // Special handling for select player modal
        if (modalId === 'select-player-modal') {
            updatePlayerList();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => modal.classList.add('hidden'));
}

// Notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white font-medium z-50 text-sm ${
        type === 'error' ? 'bg-red-600' : 'bg-green-600'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Global Functions (called from HTML)
window.openModal = openModal;
window.closeModal = closeModal;

class PlayerInterface {
    constructor() {
        this.socket = null;
        this.sessionId = null;
        this.playerId = null;
        this.playerName = '';
        this.currentCharacter = null;
        this.connectionStatus = 'disconnected';
    }

    init() {
        this.setupEventListeners();
        this.setupWebSocket();
        this.checkSessionFromURL();
        console.log('🎮 Player Interface initialisiert');
    }

    setupEventListeners() {
        // Character creation form
        document.getElementById('join-session-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createCharacterAndJoin();
        });

        // Action buttons
        document.querySelectorAll('.action-button').forEach(button => {
            if (button.id === 'custom-action-btn') {
                button.addEventListener('click', () => {
                    this.submitCustomAction();
                });
            } else {
                button.addEventListener('click', (e) => {
                    const actionType = e.target.getAttribute('data-action');
                    if (actionType) {
                        this.playerAction(actionType);
                    }
                });
            }
        });

        // Custom action form
        document.getElementById('custom-action-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitCustomAction();
        });
    }

    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
            console.log('🔗 WebSocket verbunden');
            this.updateConnectionStatus('Online', 'bg-green-500');
        };
        
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };
        
        this.socket.onclose = () => {
            console.log('🔌 WebSocket getrennt');
            this.updateConnectionStatus('Offline', 'bg-red-500');
            // Reconnect after 3 seconds
            setTimeout(() => this.setupWebSocket(), 3000);
        };
        
        this.socket.onerror = (error) => {
            console.error('❌ WebSocket Error:', error);
            this.updateConnectionStatus('Error', 'bg-red-500');
        };
    }

    checkSessionFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.sessionId = urlParams.get('session');
        
        if (this.sessionId) {
            console.log(`Session ID from URL: ${this.sessionId}`);
            this.showMessage('Session erkannt! Erstelle deinen Charakter um beizutreten.', 'info');
        }
    }

    async createCharacterAndJoin() {
        const playerData = {
            name: document.getElementById('player-name').value,
            tag: document.getElementById('player-tag').value,
            voice: document.getElementById('player-voice').value,
            look: document.getElementById('player-look').value,
            mood: document.getElementById('player-mood').value,
            slogan: document.getElementById('player-slogan').value,
            backgroundStory: document.getElementById('player-background-story').value
        };

        this.showLoading('Charakter wird erstellt...');
        
        try {
            // Create character via API
            const result = await this.apiCall('/api/players', 'POST', playerData);
            this.currentCharacter = result.player;
            this.playerName = playerData.name;
            
            // Update UI with character info
            this.displayCharacterInfo(playerData);
            
            // Join session if we have a session ID
            if (this.sessionId) {
                await this.joinSession();
            } else {
                this.showMessage('Charakter erstellt! Warte auf Session-Zuweisung...', 'success');
                this.showScreen('game');
            }
            
        } catch (error) {
            this.showMessage('Fehler beim Erstellen des Charakters: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async joinSession() {
        if (!this.sessionId || !this.playerName) {
            this.showMessage('Session ID oder Spielername fehlt', 'error');
            return;
        }

        try {
            // Join session via API
            const result = await this.apiCall(`/api/sessions/${this.sessionId}/join`, 'POST', {
                playerName: this.playerName,
                playerId: this.playerId
            });

            // Join session via WebSocket
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type: 'join_session',
                    sessionId: this.sessionId,
                    playerName: this.playerName,
                    type: 'player'
                }));
            }

            this.showMessage('Erfolgreich der Session beigetreten!', 'success');
            this.showScreen('game');
            this.updateSessionInfo(result.session);

        } catch (error) {
            this.showMessage('Fehler beim Beitreten: ' + error.message, 'error');
        }
    }

    displayCharacterInfo(playerData) {
        // Update character display
        document.getElementById('character-name').textContent = playerData.name;
        document.getElementById('character-details').textContent = 
            `${playerData.tag || ''} | ${playerData.mood || ''} | ${playerData.voice || ''}`;
        
        // Update header
        document.getElementById('player-name-display').textContent = playerData.name;
        
        // Set character avatar based on look or use default
        document.getElementById('character-avatar').textContent = '🎭';
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    updateSessionInfo(session) {
        if (session) {
            document.getElementById('session-status').textContent = 
                session.status === 'waiting' ? 'Warten auf Spieler' : 
                session.status === 'active' ? 'Aktiv' : session.status;
            
            document.getElementById('player-count').textContent = 
                `${session.players ? session.players.length : 0}/${session.maxPlayers || 6}`;
        }
    }

    handleWebSocketMessage(data) {
        console.log('WebSocket message received:', data);
        
        switch(data.type) {
            case 'connected':
                this.playerId = data.clientId;
                this.updateConnectionStatus('Online', 'bg-green-500');
                break;
            case 'session_joined':
                this.updateSessionInfo(data.sessionInfo);
                break;
            case 'player_joined':
                this.showMessage(`${data.playerName} ist beigetreten`, 'info');
                this.addToGameLog(`🎭 ${data.playerName} ist der Session beigetreten`);
                break;
            case 'player_left':
                this.showMessage(`${data.playerName} hat die Session verlassen`, 'info');
                this.addToGameLog(`👋 ${data.playerName} hat die Session verlassen`);
                break;
            case 'gm_action':
                this.handleGMAction(data);
                break;
            case 'round_completed':
                this.handleRoundCompleted(data);
                break;
            case 'session_updated':
                this.updateSessionInfo(data.session);
                break;
            case 'session_ended':
                this.showMessage('Session wurde beendet', 'warning');
                this.addToGameLog('🎬 Session wurde vom Game Master beendet');
                break;
        }
    }

    handleGMAction(data) {
        const gmMessage = document.getElementById('gm-message');
        const gmMessageText = document.getElementById('gm-message-text');
        
        if (data.data && data.data.message) {
            gmMessageText.textContent = data.data.message;
            gmMessage.classList.remove('hidden');
            this.addToGameLog(`🎭 GM: ${data.data.message}`);
        }
    }

    handleRoundCompleted(data) {
        if (data.result && data.result.message) {
            this.addToGameLog(`🎲 ${data.result.message}`);
        }
    }

    // Player Actions
    async playerAction(actionType) {
        if (!this.sessionId) {
            this.showMessage('Nicht mit einer Session verbunden', 'error');
            return;
        }

        const actionData = {
            sessionId: this.sessionId,
            playerId: this.playerId,
            action: actionType,
            answer: this.getActionDescription(actionType),
            context: {
                playerName: this.playerName,
                character: this.currentCharacter
            }
        };

        try {
            this.showLoading('Aktion wird verarbeitet...');
            
            // Send action via API
            const result = await this.apiCall('/api/rounds', 'POST', actionData);
            
            // Also send via WebSocket for real-time updates
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type: 'player_action',
                    action: actionType,
                    data: actionData
                }));
            }

            this.addToGameLog(`🎬 Du: ${this.getActionDescription(actionType)}`);
            this.showMessage('Aktion gesendet!', 'success');

        } catch (error) {
            this.showMessage('Fehler beim Senden der Aktion: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async submitCustomAction() {
        const customText = document.getElementById('custom-action-text').value.trim();
        
        if (!customText) {
            this.showMessage('Bitte gib eine Aktion ein', 'warning');
            return;
        }

        if (!this.sessionId) {
            this.showMessage('Nicht mit einer Session verbunden', 'error');
            return;
        }

        const actionData = {
            sessionId: this.sessionId,
            playerId: this.playerId,
            action: 'custom',
            answer: customText,
            context: {
                playerName: this.playerName,
                character: this.currentCharacter
            }
        };

        try {
            this.showLoading('Aktion wird verarbeitet...');
            
            // Send action via API
            const result = await this.apiCall('/api/rounds', 'POST', actionData);
            
            // Also send via WebSocket for real-time updates
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type: 'player_action',
                    action: 'custom',
                    data: actionData
                }));
            }

            this.addToGameLog(`🎬 Du: ${customText}`);
            this.showMessage('Aktion gesendet!', 'success');
            
            // Clear the input
            document.getElementById('custom-action-text').value = '';

        } catch (error) {
            this.showMessage('Fehler beim Senden der Aktion: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    getActionDescription(actionType) {
        const descriptions = {
            explore: 'Ich erkunde die Umgebung',
            attack: 'Ich greife an',
            defend: 'Ich verteidige mich',
            talk: 'Ich spreche mit jemandem',
            hide: 'Ich verstecke mich',
            run: 'Ich renne weg',
            investigate: 'Ich untersuche etwas genauer',
            help: 'Ich helfe jemandem'
        };
        return descriptions[actionType] || 'Unbekannte Aktion';
    }

    addToGameLog(message) {
        const gameLog = document.getElementById('game-log');
        if (!gameLog) return;

        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'border-b border-gray-200 pb-2 mb-2';
        logEntry.innerHTML = `
            <div class="flex justify-between items-start">
                <span class="text-sm">${message}</span>
                <span class="text-xs text-gray-500 ml-2">${timestamp}</span>
            </div>
        `;

        gameLog.appendChild(logEntry);
        gameLog.scrollTop = gameLog.scrollHeight;
    }

    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Show selected screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
        }
    }

    showLoading(text = 'Lade...') {
        // Implementation depends on your loading UI
        console.log('🔄 Loading:', text);
    }

    hideLoading() {
        // Implementation depends on your loading UI
        console.log('✅ Loading complete');
    }

    updateConnectionStatus(text, className) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.className = `w-2 h-2 rounded-full ${className}`;
        }
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(endpoint, options);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('message-container') || document.body;
        
        const messageElement = document.createElement('div');
        messageElement.className = `fixed top-4 right-4 p-3 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        messageElement.textContent = message;

        messageContainer.appendChild(messageElement);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }
}

// Initialize the interface when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const playerInterface = new PlayerInterface();
    playerInterface.init();
}); 