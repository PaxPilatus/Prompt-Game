// File: routes/sessions.js
import express from 'express';
import { postToN8n, getFromN8n } from '../services/proxy.js';
import { getN8nUrl } from '../services/url-config.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// In-memory storage for sessions
let sessions = [];

// POST /api/sessions - Neue Session erstellen
router.post('/', async (req, res) => {
    try {
        const { gmId, scenarioId, maxPlayers } = req.body;
        
        if (!gmId || !scenarioId) {
            return res.status(400).json({ 
                success: false,
                error: 'GM ID und Scenario ID sind erforderlich' 
            });
        }
        
        // Create new session
        const sessionId = randomUUID();
        const newSession = {
            id: sessionId,
            gmId,
            scenarioId,
            maxPlayers: maxPlayers || 6,
            status: 'waiting',
            players: [],
            createdAt: new Date().toISOString(),
            playerUrl: `${req.protocol}://${req.get('host')}/player.html?session=${sessionId}`,
            qrCode: `/api/sessions/${sessionId}/qr`
        };
        
        sessions.push(newSession);
        
        res.json({
            success: true,
            session: newSession,
            message: 'Session erfolgreich erstellt'
        });
        
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// GET /api/sessions - Alle Sessions auflisten
router.get('/', async (req, res) => {
    try {
        res.json({
            success: true,
            sessions: sessions
        });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch sessions' 
        });
    }
});

// GET /api/sessions/:id - Einzelne Session abrufen
router.get('/:id', async (req, res) => {
    try {
        const session = sessions.find(s => s.id === req.params.id);
        
        if (session) {
            res.json({
                success: true,
                session: session
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Session nicht gefunden'
            });
        }
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch session' 
        });
    }
});

// POST /api/sessions/:id/join - Einem Session beitreten
router.post('/:id/join', async (req, res) => {
    try {
        const { playerName, playerId } = req.body;
        const sessionIndex = sessions.findIndex(s => s.id === req.params.id);
        
        if (sessionIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Session nicht gefunden'
            });
        }
        
        const session = sessions[sessionIndex];
        
        // Check if session is full
        if (session.players.length >= session.maxPlayers) {
            return res.status(400).json({
                success: false,
                error: 'Session ist voll'
            });
        }
        
        // Add player to session
        const newPlayer = {
            id: playerId || randomUUID(),
            name: playerName,
            joinedAt: new Date().toISOString(),
            status: 'connected'
        };
        
        session.players.push(newPlayer);
        
        // Update session status
        if (session.status === 'waiting' && session.players.length > 0) {
            session.status = 'active';
        }
        
        res.json({
            success: true,
            session: session,
            player: newPlayer,
            message: `${playerName} ist der Session beigetreten`
        });
        
    } catch (error) {
        console.error('Error joining session:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// GET /api/sessions/:id/players - Spieler einer Session abrufen
router.get('/:id/players', async (req, res) => {
    try {
        const session = sessions.find(s => s.id === req.params.id);
        
        if (session) {
            res.json({
                success: true,
                players: session.players
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Session nicht gefunden'
            });
        }
    } catch (error) {
        console.error('Error fetching session players:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch session players' 
        });
    }
});

// GET /api/sessions/:id/qr - QR Code für Session
router.get('/:id/qr', async (req, res) => {
    try {
        const session = sessions.find(s => s.id === req.params.id);
        
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session nicht gefunden'
            });
        }
        
        const QRCode = await import('qrcode');
        const qrCodeBuffer = await QRCode.toBuffer(session.playerUrl, {
            width: 200,
            margin: 2
        });
        
        res.setHeader('Content-Type', 'image/png');
        res.send(qrCodeBuffer);
        
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to generate QR code' 
        });
    }
});

// DELETE /api/sessions/:id - Session löschen
router.delete('/:id', async (req, res) => {
    try {
        const sessionIndex = sessions.findIndex(s => s.id === req.params.id);
        
        if (sessionIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Session nicht gefunden'
            });
        }
        
        sessions.splice(sessionIndex, 1);
        
        res.json({
            success: true,
            message: 'Session erfolgreich gelöscht'
        });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete session' 
        });
    }
});

export default router; 