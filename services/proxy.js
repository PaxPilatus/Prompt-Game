// File: services/proxy.js
// fetch ist nativ in Node.js 18+ verfügbar

/**
 * Sendet eine POST-Request an n8n
 * @param {string} url - Die n8n URL
 * @param {Object} data - Die zu sendenden Daten
 * @returns {Promise<Object>} Die Antwort von n8n
 */
export async function postToN8n(url, data = {}) {
    try {
        console.log(`🔄 POST Request zu n8n:`, { url, data });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Promt-Game/1.0'
            },
            body: JSON.stringify(data),
            timeout: 30000
        });

        if (!response.ok) {
            throw new Error(`n8n Request fehlgeschlagen: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`✅ n8n Response:`, result);
        return result;

    } catch (error) {
        console.error(`❌ n8n Request Error:`, error);
        throw error;
    }
}

/**
 * Sendet eine GET-Request an n8n (falls benötigt)
 * @param {string} url - Die n8n URL
 * @param {Object} params - Query-Parameter
 * @returns {Promise<Object>} Die Antwort von n8n
 */
export async function getFromN8n(url, params = {}) {
    try {
        const urlWithParams = new URL(url);
        Object.keys(params).forEach(key => {
            urlWithParams.searchParams.append(key, params[key]);
        });

        console.log(`🔄 GET Request zu n8n:`, urlWithParams.toString());

        const response = await fetch(urlWithParams, {
            method: 'GET',
            headers: {
                'User-Agent': 'Promt-Game/1.0'
            },
            timeout: 30000
        });

        if (!response.ok) {
            throw new Error(`n8n Request fehlgeschlagen: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`✅ n8n Response:`, result);
        return result;

    } catch (error) {
        console.error(`❌ n8n Request Error:`, error);
        throw error;
    }
} 