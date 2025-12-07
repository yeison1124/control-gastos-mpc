// ============================================
// FUNCIONES AUXILIARES Y UTILIDADES
// ============================================

/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (USD, EUR, etc.)
 * @returns {string} Cantidad formateada
 */
function formatCurrency(amount, currency = DEFAULT_CURRENCY) {
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    const formatted = Math.abs(amount).toFixed(2);
    return `${symbol}${formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Formatea una fecha al formato local
 * @param {string|Date} date - Fecha a formatear
 * @param {string} format - Formato ('short', 'long', 'relative')
 * @returns {string} Fecha formateada
 */
function formatDate(date, format = 'short') {
    const d = new Date(date);

    if (format === 'short') {
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } else if (format === 'long') {
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    } else if (format === 'relative') {
        return getRelativeTime(d);
    }

    return d.toLocaleDateString();
}

/**
 * Obtiene el tiempo relativo (hace 2 días, etc.)
 * @param {Date} date - Fecha
 * @returns {string} Tiempo relativo
 */
function getRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) return formatDate(date, 'short');
    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'Hace un momento';
}

/**
 * Muestra un toast notification
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo ('success', 'error', 'warning', 'info')
 * @param {number} duration - Duración en ms (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    // Crear contenedor de toasts si no existe
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(container);
    }

    // Colores según tipo
    const colors = {
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };

    // Iconos según tipo
    const icons = {
        success: 'check-circle-fill',
        error: 'x-circle-fill',
        warning: 'exclamation-triangle-fill',
        info: 'info-circle-fill'
    };

    // Crear toast
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center border-0 show';
    toast.style.cssText = `
        background-color: ${colors[type]};
        color: white;
        min-width: 250px;
        margin-bottom: 10px;
    `;

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="bi bi-${icons[type]} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    container.appendChild(toast);

    // Auto-cerrar después de duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Valida una contraseña (mínimo 6 caracteres)
 * @param {string} password - Contraseña a validar
 * @returns {boolean} True si es válida
 */
function validatePassword(password) {
    return password.length >= 6;
}

/**
 * Muestra u oculta un loader
 * @param {boolean} show - True para mostrar, false para ocultar
 */
function toggleLoader(show) {
    let loader = document.getElementById('global-loader');

    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
        `;
        loader.innerHTML = `
            <div class="spinner-border text-light" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Cargando...</span>
            </div>
        `;
        document.body.appendChild(loader);
    }

    loader.style.display = show ? 'flex' : 'none';
}

/**
 * Obtiene un parámetro de la URL
 * @param {string} name - Nombre del parámetro
 * @returns {string|null} Valor del parámetro
 */
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * Redirige a una página
 * @param {string} page - Nombre de la página
 */
function navigateTo(page) {
    window.location.href = page;
}

/**
 * Genera un color aleatorio
 * @returns {string} Color en formato hex
 */
function randomColor() {
    const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Trunca un texto a un número máximo de caracteres
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
function truncateText(text, maxLength = 50) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Calcula el porcentaje
 * @param {number} current - Valor actual
 * @param {number} total - Valor total
 * @returns {number} Porcentaje
 */
function calculatePercentage(current, total) {
    if (total === 0) return 0;
    return Math.min(Math.round((current / total) * 100), 100);
}

/**
 * Debounce function
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función debounced
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Verifica si el usuario está autenticado
 * @returns {Promise<object|null>} Usuario o null
 */
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Protege una página requiriendo autenticación
 */
async function requireAuth() {
    const user = await checkAuth();
    if (!user) {
        navigateTo('index.html');
        return false;
    }
    return true;
}

/**
 * Redirige al dashboard si ya está autenticado
 */
async function redirectIfAuthenticated() {
    const user = await checkAuth();
    if (user) {
        navigateTo('dashboard.html');
    }
}
