// URL Configuration Service für n8n Integration

class UrlConfigService {
    constructor() {
        this.mode = process.env.N8N_MODE || 'test'; // 'test' oder 'production'
        this.baseUrl = process.env.N8N_BASE_URL || 'https://n8n.cbdladen.ch';
        
        // Webhook IDs für verschiedene Aktionen
        this.webhookIds = {
            CREATE_PLAYER: 'ebb720e5-becf-4b26-88e4-c5cf557a5fd8',
            CREATE_SCENARIO: 'af32541e-114c-477c-b430-b7c9b4078b99',
            PROCESS_ANSWER: '3c43a0ce-7fba-4ab0-b639-6100a59dd709',
            GET_GM: 'ba9b7157-afd0-42a7-afc9-f3b8975d9a8d'
        };
    }

    /**
     * Gibt die URL für eine spezifische Aktion zurück
     * @param {string} action - Die Aktion (CREATE_PLAYER, CREATE_SCENARIO, etc.)
     * @returns {string} Die vollständige URL
     */
    getUrl(action) {
        const webhookId = this.webhookIds[action];
        if (!webhookId) {
            console.warn(`Unknown action: ${action}`);
            return null;
        }

        const pathSegment = this.mode === 'production' ? 'webhook' : 'webhook-test';
        const url = `${this.baseUrl}/${pathSegment}/${webhookId}`;
        
        console.log(`Using ${this.mode.toUpperCase()} URL for ${action}: ${url}`);
        return url;
    }

    /**
     * Gibt alle verfügbaren URLs für den aktuellen Modus zurück
     * @returns {Object} Objekt mit allen URLs
     */
    getAllUrls() {
        const urls = {};
        Object.keys(this.webhookIds).forEach(action => {
            urls[action] = this.getUrl(action);
        });
        return urls;
    }

    /**
     * Wechselt zwischen Test- und Production-Modus
     * @param {string} mode - 'test' oder 'production'
     */
    setMode(mode) {
        if (mode !== 'test' && mode !== 'production') {
            throw new Error('Mode must be either "test" or "production"');
        }
        this.mode = mode;
        console.log(`Switched to ${mode.toUpperCase()} mode`);
    }

    /**
     * Gibt den aktuellen Modus zurück
     * @returns {string} Der aktuelle Modus
     */
    getMode() {
        return this.mode;
    }

    /**
     * Gibt Informationen über Test vs Production URLs zurück
     * @returns {Object} Informationen über die verschiedenen Modi
     */
    getInfo() {
        return {
            currentMode: this.mode,
            baseUrl: this.baseUrl,
            testInfo: {
                description: 'Test URLs require manual activation in n8n',
                requirements: [
                    'Click "Listen for test event" in n8n workflow',
                    'Request must be sent within 120 seconds',
                    'Only one request per test session'
                ]
            },
            productionInfo: {
                description: 'Production URLs are always available',
                requirements: [
                    'Workflow must be activated (green toggle in n8n)',
                    'URLs are permanently available',
                    'No manual activation needed'
                ]
            },
            urls: this.getAllUrls()
        };
    }
}

// Exportiere eine Instanz der Klasse
const urlConfigService = new UrlConfigService();

export function getN8nUrl(action) {
    return urlConfigService.getUrl(action);
}

export function getAllN8nUrls() {
    return urlConfigService.getAllUrls();
}

export function setN8nMode(mode) {
    return urlConfigService.setMode(mode);
}

export function getN8nMode() {
    return urlConfigService.getMode();
}

export function getN8nInfo() {
    return urlConfigService.getInfo();
}

export default urlConfigService; 