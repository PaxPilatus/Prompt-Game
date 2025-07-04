// File: routes/players.js
import express from 'express';
import { postToN8n, getFromN8n } from '../services/proxy.js';
import { getN8nUrl } from '../services/url-config.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// Lokaler Player-Speicher
let players = [];

// POST /api/players - Neuen Player erstellen
router.post('/', async (req, res) => {
    try {
        const { name, tag, voice, look, mood, slogan, backgroundStory, sessionId } = req.body;
        
        if (!name || !tag || !voice || !look || !mood || !slogan || !backgroundStory) {
            return res.status(400).json({ 
                success: false,
                error: 'Alle Felder sind erforderlich' 
            });
        }

        const newPlayer = {
            id: randomUUID(),
            name,
            tag,
            voice,
            look,
            mood,
            slogan,
            backgroundStory,
            sessionId,
            createdAt: new Date().toISOString()
        };

        // Player via n8n erstellen
        try {
            const url = getN8nUrl('CREATE_PLAYER');
            if (url) {
                const result = await postToN8n(url, {
                    action: 'create',
                    section: 'players',
                    data: newPlayer
                });
                console.log('✅ Player an n8n gesendet:', result);
            }
        } catch (webhookError) {
            console.warn('⚠️ n8n Webhook Fehler (Player wird lokal gespeichert):', webhookError.message);
        }

        // Lokal hinzufügen
        players.push(newPlayer);
        
        res.json({
            success: true,
            player: newPlayer,
            message: 'Player erfolgreich erstellt'
        });
    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Players:', error);
        res.status(500).json({ 
            success: false,
            error: error.message
        });
    }
});

// GET /api/players - Alle Players auflisten
router.get('/', async (req, res) => {
    try {
        res.json({
            success: true,
            data: players
        });
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch players' 
        });
    }
});

// GET /api/players/:id - Holt einen spezifischen Player
router.get('/:id', async (req, res) => {
    try {
        const player = players.find(p => p.id === req.params.id);
        
        if (player) {
            res.json({
                success: true,
                player: player
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Player nicht gefunden'
            });
        }
    } catch (error) {
        console.error('Error fetching player:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch player' 
        });
    }
});

// PUT /api/players/:id - Aktualisiert einen Player
router.put('/:id', async (req, res) => {
    try {
        const { name, tag, voice, look, mood, slogan, backgroundStory } = req.body;
        const playerIndex = players.findIndex(p => p.id === req.params.id);
        
        if (playerIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Player nicht gefunden'
            });
        }
        
        // Validierung
        if (!name || !tag || !voice || !look || !mood || !slogan || !backgroundStory) {
            return res.status(400).json({ 
                success: false,
                error: 'Alle Felder sind erforderlich' 
            });
        }

        // Player aktualisieren
        players[playerIndex] = {
            ...players[playerIndex],
            name,
            tag,
            voice,
            look,
            mood,
            slogan,
            backgroundStory,
            updatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            player: players[playerIndex],
            message: 'Player erfolgreich aktualisiert'
        });
    } catch (error) {
        console.error('Error updating player:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update player'
        });
    }
});

// DELETE /api/players/:id - Löscht einen Player
router.delete('/:id', async (req, res) => {
    try {
        const playerIndex = players.findIndex(p => p.id === req.params.id);
        
        if (playerIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Player nicht gefunden'
            });
        }
        
        players.splice(playerIndex, 1);
        
        res.json({
            success: true,
            message: 'Player erfolgreich gelöscht'
        });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete player'
        });
    }
});

export default router; 