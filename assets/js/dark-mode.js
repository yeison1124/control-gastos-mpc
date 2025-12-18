// ============================================
// DARK MODE MANAGER
// ============================================

/**
 * Gestiona el modo oscuro de la aplicación
 */
const DarkModeManager = {
    // Clave para localStorage
    STORAGE_KEY: 'theme-preference',

    // Tema actual
    currentTheme: 'light',

    /**
     * Inicializa el gestor de modo oscuro
     */
    init() {
        // Cargar preferencia guardada o detectar preferencia del sistema
        this.currentTheme = this.getSavedTheme() || this.getSystemTheme();

        // Aplicar tema inicial
        this.applyTheme(this.currentTheme);

        // Escuchar cambios en la preferencia del sistema
        this.watchSystemTheme();

        console.log('✅ Dark Mode Manager initialized:', this.currentTheme);
    },

    /**
     * Obtiene el tema guardado en localStorage
     * @returns {string|null} 'light', 'dark' o null
     */
    getSavedTheme() {
        return localStorage.getItem(this.STORAGE_KEY);
    },

    /**
     * Detecta la preferencia del sistema
     * @returns {string} 'light' o 'dark'
     */
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    },

    /**
     * Aplica un tema
     * @param {string} theme - 'light' o 'dark'
     */
    applyTheme(theme) {
        // Actualizar atributo data-theme en el HTML
        document.documentElement.setAttribute('data-theme', theme);

        // Guardar preferencia
        localStorage.setItem(this.STORAGE_KEY, theme);

        // Actualizar tema actual
        this.currentTheme = theme;

        // Actualizar UI del toggle
        this.updateToggleUI();

        // Actualizar meta theme-color para móviles
        this.updateMetaThemeColor(theme);

        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));

        console.log('🎨 Theme applied:', theme);
    },

    /**
     * Alterna entre modo claro y oscuro
     */
    toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);

        // Mostrar notificación
        const message = newTheme === 'dark' ?
            '🌙 Modo oscuro activado' :
            '☀️ Modo claro activado';

        if (typeof showToast === 'function') {
            showToast(message, 'info', 2000);
        }
    },

    /**
     * Actualiza la UI del toggle button
     */
    updateToggleUI() {
        const toggles = document.querySelectorAll('.theme-toggle');
        const icons = document.querySelectorAll('.theme-toggle-icon');

        toggles.forEach(toggle => {
            if (this.currentTheme === 'dark') {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        });

        icons.forEach(icon => {
            if (this.currentTheme === 'dark') {
                icon.className = 'bi bi-moon-fill theme-toggle-icon';
            } else {
                icon.className = 'bi bi-sun-fill theme-toggle-icon';
            }
        });
    },

    /**
     * Actualiza el meta theme-color para navegadores móviles
     * @param {string} theme - 'light' o 'dark'
     */
    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');

        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }

        // Colores para la barra de navegación móvil
        const colors = {
            light: '#ffffff',
            dark: '#0f172a'
        };

        metaThemeColor.content = colors[theme];
    },

    /**
     * Escucha cambios en la preferencia del sistema
     */
    watchSystemTheme() {
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

            darkModeQuery.addEventListener('change', (e) => {
                // Solo aplicar si no hay preferencia guardada
                if (!this.getSavedTheme()) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme(newTheme);
                    console.log('🔄 System theme changed:', newTheme);
                }
            });
        }
    },

    /**
     * Crea un toggle button
     * @param {string} containerId - ID del contenedor donde insertar el toggle
     * @returns {HTMLElement} El elemento toggle creado
     */
    createToggle(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('Container not found:', containerId);
            return null;
        }

        const toggle = document.createElement('div');
        toggle.className = 'theme-toggle';
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('aria-label', 'Cambiar tema');
        toggle.setAttribute('title', 'Cambiar entre modo claro y oscuro');

        toggle.innerHTML = `
            <div class="theme-toggle-slider">
                <i class="bi bi-${this.currentTheme === 'dark' ? 'moon-fill' : 'sun-fill'} theme-toggle-icon"></i>
            </div>
        `;

        toggle.addEventListener('click', () => this.toggle());

        container.appendChild(toggle);
        return toggle;
    },

    /**
     * Obtiene el tema actual
     * @returns {string} 'light' o 'dark'
     */
    getTheme() {
        return this.currentTheme;
    },

    /**
     * Verifica si está en modo oscuro
     * @returns {boolean}
     */
    isDark() {
        return this.currentTheme === 'dark';
    },

    /**
     * Fuerza un tema específico
     * @param {string} theme - 'light' o 'dark'
     */
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme);
        } else {
            console.error('Invalid theme:', theme);
        }
    }
};

// ============================================
// AUTO-INICIALIZACIÓN
// ============================================

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        DarkModeManager.init();
    });
} else {
    DarkModeManager.init();
}

// ============================================
// FUNCIONES GLOBALES (para compatibilidad)
// ============================================

/**
 * Alterna el modo oscuro (función global)
 */
function toggleDarkMode() {
    DarkModeManager.toggle();
}

/**
 * Obtiene el tema actual (función global)
 * @returns {string} 'light' o 'dark'
 */
function getCurrentTheme() {
    return DarkModeManager.getTheme();
}

/**
 * Establece un tema específico (función global)
 * @param {string} theme - 'light' o 'dark'
 */
function setTheme(theme) {
    DarkModeManager.setTheme(theme);
}

// ============================================
// EXPORTAR (si usas módulos)
// ============================================
// Si usas ES6 modules, descomenta esto:
/*
export default DarkModeManager;
export { toggleDarkMode, getCurrentTheme, setTheme };
*/
