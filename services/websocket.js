// File: services/websocket.js

class WebSocketService {
    constructor() {
        this.wss = null;
        this.connections = new Map();
        this.sessions = new Map();
        this.isEnabled = false;
    }

    init(wss) {
        try {
            this.wss = wss;
            this.isEnabled = true;
            
            wss.on('connection', (ws, req) => {
                this.handleConnection(ws, req);
            });

            wss.on('error', (error) => {
                console.error('❌ WebSocket Server Error:', error);
                this.isEnabled = false;
            });

            console.log('🌐 WebSocket Service initialisiert');
        } catch (error) {
            console.error('❌ WebSocket Service Fehler:', error);
            this.isEnabled = false;
        }
    }

    handleConnection(ws, req) {
        if (!this.isEnabled) return;
        
        try {
            const clientId = this.generateClientId();
            this.connections.set(clientId, {
                ws: ws,
                id: clientId,
                type: null, // 'gm' oder 'player'
                sessionId: null,
                playerName: null,
                joinedAt: new Date()
            });

            console.log(`🔗 Client ${clientId} verbunden`);

            // Send welcome message
            this.safeSend(ws, {
                type: 'connected',
                clientId: clientId,
                message: 'Verbunden mit Promt Game Server'
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMessage(clientId, message);
                } catch (error) {
                    console.error(`❌ Fehler beim Verarbeiten der Nachricht von ${clientId}:`, error);
                }
            });

            ws.on('close', () => {
                this.handleDisconnection(clientId);
            });

            ws.on('error', (error) => {
                console.error(`❌ WebSocket Fehler für Client ${clientId}:`, error);
            });
        } catch (error) {
            console.error('❌ Fehler beim Behandeln der WebSocket-Verbindung:', error);
        }
    }

    handleDisconnection(clientId) {
        console.log(`🔌 Client ${clientId} getrennt`);
        
        const connection = this.connections.get(clientId);
        if (connection && connection.sessionId) {
            this.leaveSession(clientId, connection.sessionId);
        }
        
        this.connections.delete(clientId);
    }

    safeSend(ws, data) {
        if (!ws || ws.readyState !== 1) return false; // WebSocket.OPEN = 1
        
        try {
            ws.send(JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Senden:', error);
            return false;
        }
    }

    handleMessage(clientId, message) {
        if (!this.isEnabled) return;
        
        const connection = this.connections.get(clientId);
        if (!connection) {
            console.error(`❌ Verbindung für Client ${clientId} nicht gefunden`);
            return;
        }

        console.log(`📨 Nachricht von ${clientId}:`, message);

        try {
            switch (message.type) {
                case 'join_session':
                    this.joinSession(clientId, message.sessionId, message.playerName, message.clientType);
                    break;
                case 'leave_session':
                    this.leaveSession(clientId, message.sessionId);
                    break;
                case 'player_action':
                    this.broadcastToSession(message.sessionId, {
                        type: 'player_action',
                        playerName: connection.playerName,
                        action: message.action,
                        data: message.data,
                        timestamp: new Date().toISOString()
                    });
                    break;
                case 'gm_action':
                    this.broadcastToSession(message.sessionId, {
                        type: 'gm_action',
                        data: message.data,
                        timestamp: new Date().toISOString()
                    });
                    break;
                default:
                    console.warn(`⚠️ Unbekannter Nachrichtentyp: ${message.type}`);
            }
        } catch (error) {
            console.error('❌ Fehler beim Behandeln der Nachricht:', error);
        }
    }

    joinSession(clientId, sessionId, playerName, type) {
        if (!this.isEnabled) return;
        
        const connection = this.connections.get(clientId);
        if (!connection) return;

        try {
            // Update connection info
            connection.sessionId = sessionId;
            connection.playerName = playerName;
            connection.type = type;

            // Add to session
            if (!this.sessions.has(sessionId)) {
                this.sessions.set(sessionId, new Set());
            }
            this.sessions.get(sessionId).add(clientId);

            console.log(`🎭 ${playerName} (${type}) ist Session ${sessionId} beigetreten`);

            // Notify other session members
            this.broadcastToSession(sessionId, {
                type: 'player_joined',
                playerName: playerName,
                playerType: type,
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            }, clientId);

            // Send confirmation to the joining client
            this.safeSend(connection.ws, {
                type: 'session_joined',
                sessionId: sessionId,
                playerName: playerName,
                message: `Erfolgreich Session ${sessionId} beigetreten`
            });
        } catch (error) {
            console.error('❌ Fehler beim Beitreten zur Session:', error);
        }
    }

    leaveSession(clientId, sessionId) {
        if (!this.isEnabled) return;
        
        const connection = this.connections.get(clientId);
        if (!connection) return;

        try {
            // Remove from session
            if (this.sessions.has(sessionId)) {
                this.sessions.get(sessionId).delete(clientId);
                
                // Clean up empty sessions
                if (this.sessions.get(sessionId).size === 0) {
                    this.sessions.delete(sessionId);
                }
            }

            console.log(`👋 ${connection.playerName} hat Session ${sessionId} verlassen`);

            // Notify other session members
            this.broadcastToSession(sessionId, {
                type: 'player_left',
                playerName: connection.playerName,
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            });

            // Clear session info from connection
            connection.sessionId = null;
            connection.playerName = null;
            connection.type = null;
        } catch (error) {
            console.error('❌ Fehler beim Verlassen der Session:', error);
        }
    }

    broadcastToSession(sessionId, message, excludeClientId = null) {
        if (!this.isEnabled || !sessionId) return;
        
        try {
            if (!this.sessions.has(sessionId)) {
                console.warn(`⚠️ Session ${sessionId} nicht gefunden für Broadcast`);
                return;
            }

            const sessionClients = this.sessions.get(sessionId);
            let sentCount = 0;

            sessionClients.forEach(clientId => {
                if (clientId === excludeClientId) return;
                
                const connection = this.connections.get(clientId);
                if (connection && this.safeSend(connection.ws, message)) {
                    sentCount++;
                }
            });

            console.log(`📡 Broadcast an Session ${sessionId}: ${sentCount} Clients erreicht`);
        } catch (error) {
            console.error('❌ Fehler beim Session-Broadcast:', error);
        }
    }

    broadcastToAll(message, excludeClientId = null) {
        if (!this.isEnabled) return;
        
        try {
            let sentCount = 0;

            this.connections.forEach((connection, clientId) => {
                if (clientId === excludeClientId) return;
                
                if (this.safeSend(connection.ws, message)) {
                    sentCount++;
                }
            });

            console.log(`📡 Global Broadcast: ${sentCount} Clients erreicht`);
        } catch (error) {
            console.error('❌ Fehler beim Global-Broadcast:', error);
        }
    }

    generateClientId() {
        return `client_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    }

    getConnectionCount() {
        return this.connections.size;
    }

    getSessionCount() {
        return this.sessions.size;
    }

    getAllSessions() {
        const sessionsArray = [];
        this.sessions.forEach((clients, sessionId) => {
            sessionsArray.push({
                sessionId: sessionId,
                clientCount: clients.size,
                clients: Array.from(clients)
            });
        });
        return sessionsArray;
    }

    getDebugInfo() {
        return {
            enabled: this.isEnabled,
            totalConnections: this.getConnectionCount(),
            totalSessions: this.getSessionCount(),
            sessions: this.getAllSessions(),
            connections: Array.from(this.connections.entries()).map(([id, conn]) => ({
                id: id,
                type: conn.type,
                sessionId: conn.sessionId,
                playerName: conn.playerName,
                joinedAt: conn.joinedAt,
                connected: conn.ws.readyState === 1
            }))
        };
    }
}

const websocketService = new WebSocketService();
export default websocketService; 