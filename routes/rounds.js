// File: routes/rounds.js
import express from 'express';
import { postToN8n, getFromN8n } from '../services/proxy.js';
import websocketService from '../services/websocket.js';
import { getN8nUrl } from '../services/url-config.js';

const router = express.Router();

// POST /api/rounds - Player Answer senden
router.post('/', async (req, res) => {
  try {
    const { 
      sessionId, 
      playerId, 
      playerName, 
      voice, 
      look, 
      mood, 
      slogan, 
      backgroundStory, 
      answer 
    } = req.body;
    
    if (!sessionId || !playerId || !playerName || !answer) {
      return res.status(400).json({ 
        error: 'Fehlende Felder: sessionId, playerId, playerName, answer sind erforderlich' 
      });
    }

    const payload = {
      sessionId,
      playerId,
      playerName,
      voice,
      look,
      mood,
      slogan,
      backgroundStory,
      answer,
      timestamp: new Date().toISOString()
    };

    const url = getN8nUrl('CREATE_ROUND');
    if (!url) {
      return res.status(500).json({ 
        error: 'N8n URL für CREATE_ROUND nicht konfiguriert' 
      });
    }
    
    const result = await postToN8n(url, payload);
    
    // WebSocket Broadcast für neue Antwort
    websocketService.broadcastToSession(sessionId, {
      type: 'player_answer_received',
      sessionId,
      playerId,
      playerName,
      timestamp: payload.timestamp
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Create Round Error:', error);
    res.status(500).json({ 
      error: 'Antwort konnte nicht verarbeitet werden',
      details: error.message 
    });
  }
});

// GET /api/rounds/:sessionId/latest - Neueste Runde mit Bildern, Audio und Rankings
router.get('/:sessionId/latest', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ 
        error: 'Session ID ist erforderlich' 
      });
    }

    const url = getN8nUrl('GET_LATEST_ROUND');
    if (!url) {
      return res.status(500).json({ 
        error: 'N8n URL für GET_LATEST_ROUND nicht konfiguriert' 
      });
    }
    
    const result = await getFromN8n(url, {
      action: 'get_latest',
      sessionId: sessionId
    });
    
    // WebSocket Broadcast für neue Runde
    websocketService.broadcastToSession(sessionId, {
      type: 'round_results_ready',
      sessionId,
      roundData: result,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Get Latest Round Error:', error);
    res.status(500).json({ 
      error: 'Runden-Ergebnisse konnten nicht geladen werden',
      details: error.message 
    });
  }
});

// GET /api/rounds/:sessionId - Alle Runden einer Session
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ 
        error: 'Session ID ist erforderlich' 
      });
    }

    const url = getN8nUrl('GET_LATEST_ROUND'); // Use same as latest round
    if (!url) {
      return res.status(500).json({ 
        error: 'N8n URL für GET_ROUNDS nicht konfiguriert' 
      });
    }
    
    const result = await getFromN8n(url, {
      action: 'get_all',
      sessionId: sessionId
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Get Rounds Error:', error);
    res.status(500).json({ 
      error: 'Runden konnten nicht geladen werden',
      details: error.message 
    });
  }
});

export default router; 