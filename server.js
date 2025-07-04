// File: server.js
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import routes
import scenariosRouter from './routes/scenarios.js';
import gmsRouter from './routes/gms.js';
import playersRouter from './routes/players.js';
import sessionsRouter from './routes/sessions.js';
import roundsRouter from './routes/rounds.js';
import debugRouter from './routes/debug.js';

// Import services
import websocketService from './services/websocket.js';

// Configure environment variables
dotenv.config();

// ES6 module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/scenarios', scenariosRouter);
app.use('/api/gms', gmsRouter);
app.use('/api/players', playersRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/rounds', roundsRouter);
app.use('/api/debug', debugRouter);

// WebSocket Service
websocketService.init(wss);

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/gm', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'gm.html'));
});

app.get('/player', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

app.get('/debug', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'debug.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🎭 Game Master: http://localhost:${PORT}/gm`);
    console.log(`📱 Player: http://localhost:${PORT}/player`);
    console.log(`🐛 Debug: http://localhost:${PORT}/debug`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Server wird beendet...');
    server.close(() => {
        console.log('✅ Server beendet');
        process.exit(0);
    });
}); 