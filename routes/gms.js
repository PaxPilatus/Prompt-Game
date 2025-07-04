// File: routes/gms.js
import express from 'express';
import { postToN8n, getFromN8n } from '../services/proxy.js';
import { getN8nUrl } from '../services/url-config.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// Lokaler GM-Speicher
let gms = [
    {
        id: 'demo-gm',
        name: 'Meister Magnus',
        tag: 'Weiser Geschichtenerzähler',
        voice: 'adam',
        look: 'Ein alter Mann mit grauem Bart und funkelnden Augen',
        mood: 'Weise und geheimnisvoll',
        slogan: 'Jedes Abenteuer beginnt mit einer Geschichte...',
        backgroundStory: 'Magnus war einst ein Abenteurer, der die Welt bereiste und viele Geschichten sammelte. Nun führt er andere durch ihre eigenen Abenteuer.',
        createdAt: new Date().toISOString()
    }
];

// POST /api/gms/load - GMs laden aus n8n
router.post('/load', async (req, res) => {
    try {
        console.log('📥 Lade Game Masters von n8n...');
        
        const url = getN8nUrl('GET_GM');
        if (!url) {
            return res.json({ 
                success: true, 
                gms: gms,
                message: 'N8n URL nicht konfiguriert - lokale GMs verwendet' 
            });
        }
        
        const data = await postToN8n(url, {
            action: 'load',
            section: 'gms'
        });
        
        console.log('📦 Game Masters von n8n erhalten:', data);
        
        if (data && data.gms) {
            // Verarbeite die GMs von n8n
            gms = data.gms.map(gm => ({
                ...gm,
                id: gm.id || randomUUID(),
                createdAt: gm.createdAt || new Date().toISOString()
            }));
            
            res.json({ 
                success: true, 
                gms: gms,
                message: `${gms.length} Game Masters geladen` 
            });
        } else {
            res.json({ 
                success: true, 
                gms: gms,
                message: 'Keine Game Masters von n8n erhalten - lokale GMs verwendet' 
            });
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Game Masters:', error);
        res.json({ 
            success: true, 
            gms: gms,
            message: 'Fehler beim Laden von n8n - lokale GMs verwendet'
        });
    }
});

// POST /api/gms - Neuen GM erstellen
router.post('/', async (req, res) => {
    try {
        const { name, tag, voice, look, mood, slogan, backgroundStory } = req.body;
        
        if (!name || !tag || !voice || !look || !mood || !slogan || !backgroundStory) {
            return res.status(400).json({ 
                success: false,
                error: 'Alle Felder sind erforderlich' 
            });
        }

        const newGM = {
            id: randomUUID(),
            name,
            tag,
            voice,
            look,
            mood,
            slogan,
            backgroundStory,
            createdAt: new Date().toISOString()
        };

        // GM via n8n erstellen
        try {
            const url = getN8nUrl('GET_GM');
            if (url) {
                const result = await postToN8n(url, {
                    action: 'create',
                    section: 'gms',
                    data: newGM
                });
                console.log('✅ GM an n8n gesendet:', result);
            }
        } catch (webhookError) {
            console.warn('⚠️ n8n Webhook Fehler (GM wird lokal gespeichert):', webhookError.message);
        }

        // Lokal hinzufügen
        gms.push(newGM);
        
        res.json({
            success: true,
            gm: newGM,
            message: 'Game Master erfolgreich erstellt'
        });
    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Game Masters:', error);
        res.status(500).json({ 
            success: false,
            error: error.message
        });
    }
});

// GET /api/gms - Alle GMs auflisten
router.get('/', async (req, res) => {
    try {
        res.json({
            success: true,
            gms: gms
        });
    } catch (error) {
        console.error('Error fetching game masters:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch game masters' 
        });
    }
});

// GET /api/gms/:id - Holt einen spezifischen Game Master
router.get('/:id', async (req, res) => {
    try {
        const gm = gms.find(g => g.id === req.params.id);
        
        if (gm) {
            res.json({
                success: true,
                gm: gm
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Game Master nicht gefunden'
            });
        }
    } catch (error) {
        console.error('Error fetching game master:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch game master' 
        });
    }
});

// PUT /api/gms/:id - Aktualisiert einen Game Master
router.put('/:id', async (req, res) => {
    try {
        const { name, tag, voice, look, mood, slogan, backgroundStory } = req.body;
        const gmIndex = gms.findIndex(g => g.id === req.params.id);
        
        if (gmIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Game Master nicht gefunden'
            });
        }
        
        // Validierung
        if (!name || !tag || !voice || !look || !mood || !slogan || !backgroundStory) {
            return res.status(400).json({ 
                success: false,
                error: 'Alle Felder sind erforderlich' 
            });
        }

        // GM aktualisieren
        gms[gmIndex] = {
            ...gms[gmIndex],
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
            gm: gms[gmIndex],
            message: 'Game Master erfolgreich aktualisiert'
        });
    } catch (error) {
        console.error('Error updating game master:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update game master'
        });
    }
});

// DELETE /api/gms/:id - Löscht einen Game Master
router.delete('/:id', async (req, res) => {
    try {
        const gmIndex = gms.findIndex(g => g.id === req.params.id);
        
        if (gmIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Game Master nicht gefunden'
            });
        }
        
        gms.splice(gmIndex, 1);
        
        res.json({
            success: true,
            message: 'Game Master erfolgreich gelöscht'
        });
    } catch (error) {
        console.error('Error deleting game master:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete game master'
        });
    }
});

export default router; 