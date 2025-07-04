// File: routes/scenarios.js
import express from 'express';
import { postToN8n, getFromN8n } from '../services/proxy.js';
import { getN8nUrl } from '../services/url-config.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// Lokaler Szenario-Speicher
let scenarios = [
    {
        id: 'demo-scenario',
        number: 1,
        title: 'Die geheimnisvolle Bibliothek',
        text: 'Ihr steht vor einer alten Bibliothek, deren Türen mysteriös knarren. Seltsame Lichter flackern durch die Fenster. Was ist euer nächster Schritt?',
        createdAt: new Date().toISOString()
    }
];

// POST /api/scenarios - Neues Scenario erstellen
router.post('/', async (req, res) => {
  try {
    const { number, title, text } = req.body;
    
    if (!number || !title || !text) {
      return res.status(400).json({ error: 'Number, Title und Text sind erforderlich' });
    }

            const newScenario = {
            id: randomUUID(),
      number: parseInt(number),
      title,
      text,
      createdAt: new Date().toISOString()
    };

    const url = getN8nUrl('CREATE_SCENARIO');
    if (!url) {
      return res.status(500).json({ 
        error: 'N8n URL für CREATE_SCENARIO nicht konfiguriert' 
      });
    }
    
    const result = await postToN8n(url, newScenario);
    
    scenarios.push(newScenario);
    
    res.json({
      success: true,
      message: 'Scenario created successfully',
      scenario: newScenario
    });
  } catch (error) {
    console.error('Error creating scenario:', error);
    res.status(500).json({ 
      error: 'Failed to create scenario',
      details: error.message
    });
  }
});

// GET /api/scenarios - Alle Scenarios auflisten (no n8n call needed)
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      scenarios: scenarios
    });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

// GET /api/scenarios/:id - Holt ein spezifisches Szenario
router.get('/:id', async (req, res) => {
  try {
    const scenario = scenarios.find(s => s.id === req.params.id);
    
    if (scenario) {
      res.json({
        success: true,
        scenario: scenario
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Szenario nicht gefunden'
      });
    }
  } catch (error) {
    console.error('Error fetching scenario:', error);
    res.status(500).json({ error: 'Failed to fetch scenario' });
  }
});

// PUT /api/scenarios/:id - Aktualisiert ein Szenario
router.put('/:id', async (req, res) => {
  try {
    const { number, title, text } = req.body;
    const scenarioIndex = scenarios.findIndex(s => s.id === req.params.id);
    
    if (scenarioIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Szenario nicht gefunden'
      });
    }
    
    scenarios[scenarioIndex] = {
      ...scenarios[scenarioIndex],
      number: parseInt(number),
      title,
      text,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      scenario: scenarios[scenarioIndex],
      message: 'Szenario erfolgreich aktualisiert'
    });
  } catch (error) {
    console.error('Error updating scenario:', error);
    res.status(500).json({ 
      error: 'Failed to update scenario',
      details: error.message
    });
  }
});

// DELETE /api/scenarios/:id - Löscht ein Szenario
router.delete('/:id', async (req, res) => {
  try {
    const scenarioIndex = scenarios.findIndex(s => s.id === req.params.id);
    
    if (scenarioIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Szenario nicht gefunden'
      });
    }
    
    scenarios.splice(scenarioIndex, 1);
    
    res.json({
      success: true,
      message: 'Szenario erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    res.status(500).json({ 
      error: 'Failed to delete scenario',
      details: error.message
    });
  }
});

// Szenarien laden aus n8n
router.post('/load', async (req, res) => {
    try {
        console.log('📥 Lade Szenarien von n8n...');
        
        const url = getN8nUrl('CREATE_SCENARIO');
        if (!url) {
            return res.json({ 
                success: true, 
                scenarios: scenarios,
                message: 'N8n URL nicht konfiguriert - lokale Szenarien verwendet' 
            });
        }
        
        const data = await postToN8n(url, {
            action: 'load',
            section: 'scenarios'
        });
        
        console.log('📦 Szenarien von n8n erhalten:', data);
        
        if (data && data.scenarios) {
            // Verarbeite die Szenarien von n8n
            scenarios = data.scenarios.map(scenario => ({
                ...scenario,
                id: scenario.id || randomUUID(),
                createdAt: scenario.createdAt || new Date().toISOString()
            }));
            
            res.json({ 
                success: true, 
                scenarios: scenarios,
                message: `${scenarios.length} Szenarien geladen` 
            });
        } else {
            res.json({ 
                success: true, 
                scenarios: scenarios,
                message: 'Keine Szenarien von n8n erhalten - lokale Szenarien verwendet' 
            });
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Szenarien:', error);
        res.json({ 
            success: true, 
            scenarios: scenarios,
            message: 'Fehler beim Laden von n8n - lokale Szenarien verwendet'
        });
    }
});

export default router; 