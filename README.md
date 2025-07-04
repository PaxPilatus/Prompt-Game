# 🎮 Promt Game

Eine Party-Rollenspiel-Anwendung mit Game Master (Desktop) und Player (Smartphone) Interfaces, die n8n für KI-gestützte Datenverarbeitung und ElevenLabs für Sprachgenerierung nutzt.

## 📋 Inhaltsverzeichnis

- [Features](#-features)
- [Architektur](#-architektur)
- [Installation](#-installation)
- [Konfiguration](#-konfiguration)
- [Nutzung](#-nutzung)
- [API-Dokumentation](#-api-dokumentation)
- [n8n Integration](#-n8n-integration)
- [Entwicklung](#-entwicklung)
- [Troubleshooting](#-troubleshooting)

## 🎯 Features

### Game Master Interface (Desktop)
- **Character Creation**: Erstelle KI-gestützte Game Master mit verschiedenen Stimmen und Stilen
- **Scenario Management**: Entwickle und verwalte Spielszenarien
- **Session Control**: Starte Sessions und verwalte Spieler
- **QR-Code Generation**: Automatische QR-Code-Erstellung für Player-Beitritt
- **Real-time Monitoring**: Live-Überwachung aller verbundenen Spieler
- **WebSocket Communication**: Echtzeit-Updates und Kommunikation

### Player Interface (Smartphone)
- **Character Creation**: Personalisierte Charaktererstellung mit Stimme und Hintergrund
- **Mobile-Optimized**: Touch-freundliches Interface für Smartphones
- **Quick Actions**: Vordefinierte Aktionen (Erkunden, Angreifen, Verteidigen, etc.)
- **Custom Actions**: Freie Texteingabe für individuelle Aktionen
- **Game Log**: Chronologischer Spielverlauf
- **Real-time Updates**: Live-Updates vom Game Master

### Backend Features
- **WebSocket Server**: Echtzeit-Kommunikation zwischen GM und Spielern
- **n8n Integration**: KI-gestützte Verarbeitung über n8n Workflows
- **Session Management**: Automatische Session-Verwaltung mit QR-Codes
- **In-Memory Storage**: Schnelle Session-Daten ohne Datenbank-Abhängigkeiten
- **Debug Interface**: Umfangreiche Debug-Tools für Entwicklung

## 🏗️ Architektur

```
┌─────────────────┐    ┌─────────────────┐
│   Game Master   │    │     Players     │
│   (Desktop)     │    │  (Smartphones)  │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          │ WebSocket            │ WebSocket
          │                      │
    ┌─────┴──────────────────────┴─────┐
    │        Express Server            │
    │     + WebSocket Server           │
    └─────────────┬────────────────────┘
                  │ HTTP/POST
                  │
    ┌─────────────▼────────────────────┐
    │          n8n Server              │
    │    (AI Processing)               │
    └──────────────────────────────────┘
```

### Technologie-Stack
- **Backend**: Node.js, Express.js
- **WebSockets**: `ws` library
- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **QR-Codes**: `qrcode` library
- **AI Processing**: n8n workflows
- **Voice**: ElevenLabs Integration

## 🚀 Installation

### Voraussetzungen
- Node.js 16+ 
- npm oder yarn
- n8n Server (konfiguriert)
- ElevenLabs Account (optional)

### 1. Repository klonen
```bash
git clone <repository-url>
cd promt-game
```

### 2. Dependencies installieren
```bash
npm install
```

### 3. Environment-Variablen konfigurieren
```bash
cp .env.example .env
# Bearbeite .env mit deinen Einstellungen
```

### 4. Server starten
```bash
# Development
npm run dev

# Production
npm start
```

## ⚙️ Konfiguration

### Environment-Variablen

Erstelle eine `.env` Datei basierend auf `.env.example`:

```env
# Server
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# n8n
N8N_MODE=test
N8N_BASE_URL=https://n8n.cbdladen.ch
N8N_WEBHOOK_CREATE_PLAYER=ebb720e5-becf-4b26-88e4-c5cf557a5fd8
N8N_WEBHOOK_CREATE_SCENARIO=af32541e-114c-477c-b430-b7c9b4078b99
N8N_WEBHOOK_PROCESS_ANSWER=3c43a0ce-7fba-4ab0-b639-6100a59dd709
N8N_WEBHOOK_GET_GM=ba9b7157-afd0-42a7-afc9-f3b8975d9a8d
```

### n8n Modi

#### Test Mode (`N8N_MODE=test`)
- Nutzt `/webhook-test/` URLs
- Erfordert manuelle Aktivierung in n8n
- "Listen for test event" Button klicken
- Request innerhalb 120 Sekunden
- Nur eine Request pro Test-Session

#### Production Mode (`N8N_MODE=production`)
- Nutzt `/webhook/` URLs
- Workflow muss aktiviert sein (grüner Toggle)
- Keine manuelle Aktivierung nötig
- URLs permanent verfügbar

## 📖 Nutzung

### 1. Game Master Setup

1. **Server starten**: `npm start`
2. **GM Interface öffnen**: `http://localhost:3000/gm.html`
3. **Game Master erstellen**:
   - Name, Stimme, Stil und Erfahrung eingeben
   - "Game Master erstellen" klicken
4. **Szenario erstellen**:
   - Name, Beschreibung, Setting und Schwierigkeit
   - "Szenario erstellen" klicken

### 2. Session starten

1. **Session Tab** öffnen
2. Game Master und Szenario auswählen
3. Maximale Spieleranzahl festlegen
4. "Session erstellen" klicken
5. **QR-Code** wird generiert

### 3. Player Beitritt

1. **QR-Code scannen** oder `http://localhost:3000/player?session=SESSION_ID` öffnen
2. **Charakter erstellen**:
   - Name, Stimme, Persönlichkeit und Hintergrund
   - "Charakter erstellen und beitreten" klicken
3. **Aktionen ausführen**:
   - Vordefinierte Buttons nutzen
   - Oder eigene Aktionen beschreiben

### 4. Gameplay

- **Game Master** sieht alle Spieler im "Players" Tab
- **Aktionen** werden an n8n gesendet und verarbeitet
- **Ergebnisse** werden an alle Teilnehmer übertragen
- **Real-time Updates** über WebSocket

## 🔌 API-Dokumentation

### Game Master Routes

```
POST /api/gms
GET /api/gms
GET /api/gms/:id
PUT /api/gms/:id
DELETE /api/gms/:id
```

### Scenario Routes

```
POST /api/scenarios
GET /api/scenarios
GET /api/scenarios/:id
PUT /api/scenarios/:id
DELETE /api/scenarios/:id
```

### Player Routes

```
POST /api/players
GET /api/players
GET /api/players/:id
PUT /api/players/:id
DELETE /api/players/:id
```

### Session Routes

```
POST /api/sessions
GET /api/sessions
GET /api/sessions/:id
POST /api/sessions/:id/join
POST /api/sessions/:id/leave
PUT /api/sessions/:id
DELETE /api/sessions/:id
```

### Round Routes

```
POST /api/rounds
GET /api/rounds
GET /api/rounds/:id
GET /api/rounds/session/:sessionId/latest
GET /api/rounds/session/:sessionId/player/:playerId
PUT /api/rounds/:id
DELETE /api/rounds/:id
```

### Debug Routes

```
GET /api/debug/info
GET /api/debug/mode
POST /api/debug/mode
GET /api/debug/urls
POST /api/debug/test-connection
POST /api/debug/test-url
GET /api/debug/health
GET /api/debug/environment
```

## 🤖 n8n Integration

### Webhook URLs

#### Test URLs (erfordern manuelle Aktivierung)
```
https://n8n.cbdladen.ch/webhook-test/{webhook-id}
```

#### Production URLs (automatisch aktiv)
```
https://n8n.cbdladen.ch/webhook/{webhook-id}
```

### Payload Format

Alle n8n Requests verwenden folgendes Format:

```json
{
  "action": "CREATE_PLAYER|CREATE_SCENARIO|PROCESS_ANSWER|GET_GM",
  "section": "Player|GM",
  "data": {
    // Spezifische Daten je nach Aktion
  }
}
```

### Workflow-Konfiguration

1. **Webhook Node** als Trigger
2. **Section Detection** für Player vs GM
3. **Data Processing** für KI-Verarbeitung
4. **Response Generation** mit strukturierter Antwort

## 🛠️ Entwicklung

### Debug Interface

Öffne `http://localhost:3000/debug.html` für:

- **Mode Switching**: Test ↔ Production
- **URL Testing**: Einzelne Webhooks testen
- **Connection Tests**: n8n Verbindung prüfen
- **Environment Info**: System-Informationen
- **Console Output**: Live-Logs

### Development Server

```bash
# Mit Nodemon für Auto-Reload
npm run dev

# Debug-Logs aktivieren
DEBUG=true npm run dev
```

### Code-Struktur

```
promt-game/
├── server.js              # Haupt-Server
├── package.json           # Dependencies
├── .env.example          # Environment Template
├── README.md             # Diese Datei
├── routes/               # API Routes
│   ├── scenarios.js
│   ├── gms.js
│   ├── players.js
│   ├── sessions.js
│   ├── rounds.js
│   └── debug.js
├── services/             # Backend Services
│   ├── websocket.js      # WebSocket Management
│   ├── proxy.js          # n8n Integration
│   ├── qrcode.js         # QR-Code Generation
│   └── url-config.js     # URL Configuration
└── public/               # Frontend Files
    ├── gm.html           # Game Master Interface
    ├── player.html       # Player Interface
    ├── debug.html        # Debug Console
    ├── index.html        # Landing Page
    └── js/               # JavaScript Files
        ├── gm.js
        └── player.js
```

## 🔧 Troubleshooting

### Häufige Probleme

#### 1. 404 Errors bei n8n Calls

**Problem**: `POST 404` bei Webhook-Aufrufen

**Lösung**:
```bash
# 1. Mode auf Production umstellen
curl -X POST http://localhost:3000/api/debug/mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "production"}'

# 2. Oder n8n Test Mode aktivieren
# - n8n öffnen
# - Workflow öffnen
# - "Listen for test event" klicken
# - Innerhalb 120 Sekunden Request senden
```

#### 2. WebSocket Verbindungsfehler

**Problem**: "Connection failed" im Frontend

**Lösung**:
```bash
# Server neu starten
npm restart

# Port prüfen
netstat -tulpn | grep :3000

# Firewall-Regeln prüfen
```

#### 3. QR-Code wird nicht generiert

**Problem**: QR-Code bleibt leer

**Lösung**:
```bash
# BASE_URL in .env prüfen
echo $BASE_URL

# Session-Erstellung debuggen
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"gmId":"test","scenarioId":"test"}'
```

### Debug-Kommandos

```bash
# Server-Status prüfen
curl http://localhost:3000/api/debug/health

# Aktuelle Konfiguration anzeigen
curl http://localhost:3000/api/debug/info

# n8n Verbindung testen
curl -X POST http://localhost:3000/api/debug/test-connection

# Spezifische URL testen
curl -X POST http://localhost:3000/api/debug/test-url \
  -H "Content-Type: application/json" \
  -d '{"action":"CREATE_PLAYER","testData":{"test":true}}'
```

### Logs analysieren

```bash
# Server-Logs anzeigen (mit Debug)
DEBUG=true npm start

# Nur n8n-bezogene Logs
DEBUG=n8n npm start

# WebSocket-Logs
DEBUG=websocket npm start
```

## 📝 Lizenz

MIT License - siehe LICENSE-Datei für Details.

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📞 Support

Bei Fragen oder Problemen:

1. Prüfe die [Troubleshooting](#-troubleshooting) Sektion
2. Nutze das Debug Interface (`/debug.html`)
3. Erstelle ein Issue im Repository
4. Kontaktiere das Entwicklungsteam

---

**Viel Spaß beim Spielen! 🎮✨** 