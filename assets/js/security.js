// ============================================
// FUNCIONES DE SEGURIDAD
// ============================================
// Agregar estas funciones al inicio de utils.js

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} unsafe - Texto potencialmente inseguro
 * @returns {string} Texto seguro
 */
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';

    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Valida una contraseña con requisitos de seguridad
 * @param {string} password - Contraseña a validar
 * @returns {object} {valid: boolean, errors: string[]}
 */
function validatePasswordStrong(password) {
    const errors = [];

    if (password.length < 8) {
        errors.push('Mínimo 8 caracteres');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Al menos una mayúscula');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Al menos una minúscula');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Al menos un número');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Al menos un carácter especial (!@#$%^&*)');
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Muestra los requisitos de contraseña en tiempo real
 * @param {string} password - Contraseña actual
 * @param {string} containerId - ID del contenedor donde mostrar requisitos
 */
function showPasswordRequirements(password, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const requirements = [
        { test: password.length >= 8, text: 'Mínimo 8 caracteres' },
        { test: /[A-Z]/.test(password), text: 'Una mayúscula' },
        { test: /[a-z]/.test(password), text: 'Una minúscula' },
        { test: /[0-9]/.test(password), text: 'Un número' },
        { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), text: 'Un carácter especial' }
    ];

    container.innerHTML = requirements.map(req => `
        <div style="color: ${req.test ? '#22c55e' : '#94a3b8'}; font-size: 0.875rem;">
            <i class="bi bi-${req.test ? 'check-circle-fill' : 'circle'}"></i> ${req.text}
        </div>
    `).join('');
}

/**
 * Rate limiting para prevenir ataques de fuerza bruta
 */
const RateLimiter = {
    attempts: {},

    /**
     * Verifica si se puede hacer un intento
     * @param {string} key - Identificador (email, IP, etc.)
     * @param {number} maxAttempts - Máximo de intentos permitidos
     * @param {number} windowMs - Ventana de tiempo en milisegundos
     * @returns {object} {allowed: boolean, remaining: number, resetIn: number}
     */
    check(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
        const now = Date.now();
        const record = this.attempts[key];

        // Si no hay registro o expiró, crear nuevo
        if (!record || now - record.firstAttempt > windowMs) {
            this.attempts[key] = {
                count: 1,
                firstAttempt: now
            };
            return { allowed: true, remaining: maxAttempts - 1, resetIn: windowMs };
        }

        // Incrementar contador
        record.count++;

        // Verificar si excedió el límite
        if (record.count > maxAttempts) {
            const resetIn = windowMs - (now - record.firstAttempt);
            return {
                allowed: false,
                remaining: 0,
                resetIn: resetIn
            };
        }

        return {
            allowed: true,
            remaining: maxAttempts - record.count,
            resetIn: windowMs - (now - record.firstAttempt)
        };
    },

    /**
     * Resetea el contador para una key
     * @param {string} key - Identificador
     */
    reset(key) {
        delete this.attempts[key];
    },

    /**
     * Formatea el tiempo de espera
     * @param {number} ms - Milisegundos
     * @returns {string} Tiempo formateado
     */
    formatWaitTime(ms) {
        const minutes = Math.ceil(ms / 60000);
        return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
    }
};

/**
 * Sanitiza entrada de usuario para prevenir XSS
 * @param {string} input - Entrada del usuario
 * @returns {string} Entrada sanitizada
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';

    // Remover scripts
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remover eventos inline
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Escapar HTML
    sanitized = escapeHtml(sanitized);

    return sanitized;
}

/**
 * Valida y sanitiza un email
 * @param {string} email - Email a validar
 * @returns {object} {valid: boolean, sanitized: string}
 */
function validateAndSanitizeEmail(email) {
    const sanitized = email.trim().toLowerCase();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized);

    return { valid, sanitized };
}

/**
 * Crea un elemento DOM de forma segura
 * @param {string} tag - Tag HTML
 * @param {object} attributes - Atributos
 * @param {string} textContent - Contenido de texto
 * @returns {HTMLElement} Elemento creado
 */
function createSafeElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);

    // Agregar atributos de forma segura
    for (const [key, value] of Object.entries(attributes)) {
        if (key.startsWith('on')) {
            console.warn('Event handlers should be added via addEventListener');
            continue;
        }
        element.setAttribute(key, value);
    }

    // Usar textContent en lugar de innerHTML
    if (textContent) {
        element.textContent = textContent;
    }

    return element;
}

/**
 * Maneja errores de forma segura sin revelar información sensible
 * @param {Error} error - Error capturado
 * @param {string} userMessage - Mensaje para el usuario
 */
function handleErrorSecurely(error, userMessage = 'Ocurrió un error. Intenta de nuevo.') {
    // Log completo solo en consola (no visible para usuarios)
    console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });

    // Mensaje genérico para el usuario
    showToast(userMessage, 'error');
}

/**
 * Verifica si una URL es segura
 * @param {string} url - URL a verificar
 * @returns {boolean} True si es segura
 */
function isSafeUrl(url) {
    try {
        const parsed = new URL(url);
        // Solo permitir https y http
        if (!['https:', 'http:'].includes(parsed.protocol)) {
            return false;
        }
        // Verificar que no sea javascript:
        if (parsed.protocol === 'javascript:') {
            return false;
        }
        return true;
    } catch {
        return false;
    }
}

/**
 * Limpia datos antes de enviar a la API
 * @param {object} data - Datos a limpiar
 * @returns {object} Datos limpios
 */
function cleanApiData(data) {
    const cleaned = {};

    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            cleaned[key] = sanitizeInput(value);
        } else if (typeof value === 'number') {
            cleaned[key] = isFinite(value) ? value : 0;
        } else if (typeof value === 'boolean') {
            cleaned[key] = value;
        } else if (value === null || value === undefined) {
            cleaned[key] = null;
        } else {
            // Para objetos y arrays, recursivo
            cleaned[key] = value;
        }
    }

    return cleaned;
}

// ============================================
// EXPORTAR FUNCIONES (si usas módulos)
// ============================================
// Si usas ES6 modules, descomenta esto:
/*
export {
    escapeHtml,
    validatePasswordStrong,
    showPasswordRequirements,
    RateLimiter,
    sanitizeInput,
    validateAndSanitizeEmail,
    createSafeElement,
    handleErrorSecurely,
    isSafeUrl,
    cleanApiData
};
*/
