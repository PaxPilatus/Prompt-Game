import express from 'express';
import { getN8nUrl, getAllN8nUrls, getN8nMode, setN8nMode, getN8nInfo } from '../services/url-config.js';
import { postToN8n, getFromN8n } from '../services/proxy.js';
import websocketService from '../services/websocket.js';

const router = express.Router();

// GET /api/debug/info - Zeigt alle Debug-Informationen
router.get('/info', async (req, res) => {
  try {
    const info = {
      mode: getN8nMode(),
      urls: getAllN8nUrls(),
      urlInfo: getN8nInfo(),
      websocketInfo: websocketService.getDebugInfo(),
      timestamp: new Date().toISOString()
    };
    
    res.json(info);
  } catch (error) {
    console.error('Error getting debug info:', error);
    res.status(500).json({ error: 'Failed to get debug info' });
  }
});

// GET /api/debug/mode - Zeigt den aktuellen Modus
router.get('/mode', async (req, res) => {
  try {
    res.json({
      mode: getN8nMode(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting mode:', error);
    res.status(500).json({ error: 'Failed to get mode' });
  }
});

// POST /api/debug/mode - Wechselt den Modus
router.post('/mode', async (req, res) => {
  try {
    const { mode } = req.body;
    
    if (!mode || (mode !== 'test' && mode !== 'production')) {
      return res.status(400).json({ error: 'Mode must be either "test" or "production"' });
    }
    
    setN8nMode(mode);
    
    res.json({
      success: true,
      message: `Mode switched to ${mode}`,
      newMode: getN8nMode(),
      urls: getAllN8nUrls(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error switching mode:', error);
    res.status(500).json({ error: 'Failed to switch mode' });
  }
});

// GET /api/debug/urls - Zeigt alle URLs für den aktuellen Modus
router.get('/urls', async (req, res) => {
  try {
    res.json({
      mode: getN8nMode(),
      urls: getAllN8nUrls(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting URLs:', error);
    res.status(500).json({ error: 'Failed to get URLs' });
  }
});

// POST /api/debug/test-connection - Testet die Verbindung zu n8n
router.post('/test-connection', async (req, res) => {
  try {
    const testUrl = getN8nUrl('CREATE_PLAYER');
    if (!testUrl) {
      return res.status(500).json({ 
        error: 'N8n URL nicht konfiguriert' 
      });
    }
    
    const testData = {
      test: true,
      timestamp: new Date().toISOString()
    };
    
    const result = await postToN8n(testUrl, testData);
    
    res.json({
      success: true,
      message: 'Connection to n8n successful',
      mode: getN8nMode(),
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to test connection',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/debug/test-url - Testet eine spezifische URL
router.post('/test-url', async (req, res) => {
  try {
    const { action, testData } = req.body;
    
    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }
    
    const url = getN8nUrl(action);
    if (!url) {
      return res.status(400).json({ error: `No URL configured for action: ${action}` });
    }
    
    const data = testData || { test: true, timestamp: new Date().toISOString() };
    
    const result = await postToN8n(url, data);
    
    res.json({
      success: true,
      action: action,
      url: url,
      testData: data,
      result: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error testing URL:', error);
    res.status(500).json({ 
      error: 'Failed to test URL',
      action: req.body.action,
      details: error.message
    });
  }
});

// GET /api/debug/health - Health Check
router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      mode: getN8nMode(),
      nodeVersion: process.version,
      websocket: {
        connections: websocketService.getConnectionCount(),
        sessions: websocketService.getSessionCount()
      }
    });
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(500).json({ error: 'Failed to get health status' });
  }
});

// GET /api/debug/environment - Zeigt relevante Umgebungsvariablen
router.get('/environment', async (req, res) => {
  try {
    res.json({
      NODE_ENV: process.env.NODE_ENV || 'development',
      N8N_MODE: process.env.N8N_MODE || 'test',
      N8N_BASE_URL: process.env.N8N_BASE_URL || 'https://n8n.cbdladen.ch',
      BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
      PORT: process.env.PORT || 3000,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting environment:', error);
    res.status(500).json({ error: 'Failed to get environment' });
  }
});

// GET /api/debug/websocket - WebSocket Status
router.get('/websocket', async (req, res) => {
  try {
    res.json({
      success: true,
      data: websocketService.getDebugInfo(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting WebSocket info:', error);
    res.status(500).json({ error: 'Failed to get WebSocket info' });
  }
});

export default router; 