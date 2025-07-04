// File: services/qrcode.js
const QRCode = require('qrcode');

class QRCodeService {
  constructor() {
    this.defaultOptions = {
      width: 256,
      height: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M' // L, M, Q, H
    };
  }

  /**
   * Generiert einen QR-Code als Data URL für eine Session
   * @param {string} sessionId - Die Session-ID
   * @param {Object} options - Optionale QR-Code-Optionen
   * @returns {Promise<string>} Data URL des QR-Codes
   */
  async generateSessionQR(sessionId, options = {}) {
    try {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const playerUrl = `${baseUrl}/player?session=${sessionId}`;
      
      const qrOptions = {
        ...this.defaultOptions,
        ...options
      };

      const qrCodeDataUrl = await QRCode.toDataURL(playerUrl, qrOptions);
      
      console.log(`Generated QR code for session ${sessionId}`);
      return qrCodeDataUrl;

    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error(`QR code generation failed: ${error.message}`);
    }
  }

  /**
   * Generiert einen QR-Code als SVG-String
   * @param {string} sessionId - Die Session-ID
   * @param {Object} options - Optionale QR-Code-Optionen
   * @returns {Promise<string>} SVG-String des QR-Codes
   */
  async generateSessionQRSVG(sessionId, options = {}) {
    try {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const playerUrl = `${baseUrl}/player?session=${sessionId}`;
      
      const qrOptions = {
        ...this.defaultOptions,
        ...options
      };

      const qrCodeSVG = await QRCode.toString(playerUrl, {
        type: 'svg',
        ...qrOptions
      });
      
      console.log(`Generated SVG QR code for session ${sessionId}`);
      return qrCodeSVG;

    } catch (error) {
      console.error('Error generating SVG QR code:', error);
      throw new Error(`SVG QR code generation failed: ${error.message}`);
    }
  }

  /**
   * Generiert einen QR-Code als PNG-Buffer
   * @param {string} sessionId - Die Session-ID
   * @param {Object} options - Optionale QR-Code-Optionen
   * @returns {Promise<Buffer>} PNG-Buffer des QR-Codes
   */
  async generateSessionQRBuffer(sessionId, options = {}) {
    try {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const playerUrl = `${baseUrl}/player?session=${sessionId}`;
      
      const qrOptions = {
        ...this.defaultOptions,
        ...options
      };

      const qrCodeBuffer = await QRCode.toBuffer(playerUrl, qrOptions);
      
      console.log(`Generated PNG buffer QR code for session ${sessionId}`);
      return qrCodeBuffer;

    } catch (error) {
      console.error('Error generating PNG buffer QR code:', error);
      throw new Error(`PNG buffer QR code generation failed: ${error.message}`);
    }
  }

  /**
   * Generiert einen einfachen QR-Code für beliebige URLs
   * @param {string} url - Die URL
   * @param {Object} options - Optionale QR-Code-Optionen
   * @returns {Promise<string>} Data URL des QR-Codes
   */
  async generateQR(url, options = {}) {
    try {
      const qrOptions = {
        ...this.defaultOptions,
        ...options
      };

      const qrCodeDataUrl = await QRCode.toDataURL(url, qrOptions);
      
      console.log(`Generated QR code for URL: ${url}`);
      return qrCodeDataUrl;

    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error(`QR code generation failed: ${error.message}`);
    }
  }

  /**
   * Erstellt eine Player-URL für eine Session
   * @param {string} sessionId - Die Session-ID
   * @param {string} baseUrl - Optional: Base URL (default: aus ENV oder localhost)
   * @returns {string} Die Player-URL
   */
  createPlayerUrl(sessionId, baseUrl = null) {
    const base = baseUrl || process.env.BASE_URL || 'http://localhost:3000';
    return `${base}/player?session=${sessionId}`;
  }

  /**
   * Validiert eine Session-ID
   * @param {string} sessionId - Die zu validierende Session-ID
   * @returns {boolean} True wenn gültig
   */
  isValidSessionId(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
      return false;
    }
    
    // Prüfe auf UUID-Format (grob)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(sessionId);
  }

  /**
   * Generiert QR-Code-Konfiguration für verschiedene Anwendungsfälle
   * @param {string} type - Der Typ ('mobile', 'desktop', 'print')
   * @returns {Object} Konfiguration für den QR-Code
   */
  getConfigForType(type) {
    switch (type) {
      case 'mobile':
        return {
          width: 200,
          height: 200,
          margin: 1,
          errorCorrectionLevel: 'L'
        };
      case 'desktop':
        return {
          width: 300,
          height: 300,
          margin: 2,
          errorCorrectionLevel: 'M'
        };
      case 'print':
        return {
          width: 400,
          height: 400,
          margin: 4,
          errorCorrectionLevel: 'H'
        };
      default:
        return this.defaultOptions;
    }
  }
}

module.exports = new QRCodeService(); 