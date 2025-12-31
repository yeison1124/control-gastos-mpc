// REGISTER APP - Control de Gastos
// Version: 3.0.0 CLEAN
// Sin conflictos de variables

const SUPABASE_URL = 'https://zczvobqrmucwrbrlksye.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjenZvYnFybXVjd3Jicmxrc3llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNTcyMjAsImV4cCI6MjA4MDYzMzIyMH0.AhRbPtGRUlvW5_Yj-CTKhMFp0w1BvSIUVAO2ucFKbuM';

// Namespace para evitar conflictos globales
const App = {
    client: null,

    // TEMA
    initTheme() {
        const saved = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
        this.updateThemeIcon(saved);
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    },

    updateThemeIcon(theme) {
        const icon = document.querySelector('#theme-toggle i');
        if (icon) {
            icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
        }
    },

    // TOAST
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const icons = {
            success: 'bi-check-circle-fill',
            error: 'bi-x-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            info: 'bi-info-circle-fill'
        };

        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <i class="bi ${icons[type]} toast-icon"></i>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="bi bi-x"></i>
            </button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    },

    // TOGGLE ENTRA
    togglePassword(inputId, iconId) {
        const input = document.getElementById(inputId);
        const icon = document.getElementById(iconId);
        if (!input || !icon) return;

        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'bi bi-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'bi bi-eye';
        }
    },

    // FUERZA DE CONTRASEÑA
    checkStrength(val) {
        const bar = document.getElementById('strengthBar');
        if (!bar) return;

        let strength = 0;
        if (val.length > 5) strength += 33;
        if (val.length > 8) strength += 33;
        if (/[A-Z]/.test(val) && /[0-9]/.test(val)) strength += 34;

        bar.style.width = strength + '%';
        if (strength < 40) bar.style.backgroundColor = '#ef4444';
        else if (strength < 80) bar.style.backgroundColor = '#f59e0b';
        else bar.style.backgroundColor = '#22c55e';
    },

    // INICIALIZAR SUPABASE
    async initSupabase() {
        let attempts = 0;
        const maxAttempts = 50;

        return new Promise((resolve) => {
            const check = () => {
                attempts++;

                if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
                    try {
                        this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
                        console.log('✅ Supabase inicializado');
                        resolve(true);
                    } catch (error) {
                        console.error('Error inicializando Supabase:', error);
                        resolve(false);
                    }
                } else if (attempts < maxAttempts) {
                    setTimeout(check, 100);
                } else {
                    console.error('❌ No se pudo cargar Supabase CDN');
                    resolve(false);
                }
            };

            check();
        });
    },

    // REGISTRO
    async handleRegister(email, password, fullName) {
        if (!this.client) {
            this.showToast('Sistema no inicializado. Espera un momento.', 'error');
            return;
        }

        try {
            const { data, error } = await this.client.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: { full_name: fullName },
                    emailRedirectTo: window.location.origin + '/dashboard.html'
                }
            });

            if (error) {
                if (error.message.includes('already registered') ||
                    error.message.includes('User already registered') ||
                    error.message.includes('duplicate') ||
                    error.status === 422) {
                    this.showToast('Este correo ya está registrado. Inicia sesión o usa otro correo.', 'warning');
                    return;
                }

                this.showToast('No se pudo crear la cuenta. Verifica tus datos.', 'error');
                console.error('Error de registro:', error);
                return;
            }

            if (data?.user?.identities && data.user.identities.length === 0) {
                this.showToast('Este correo ya está registrado. Por favor inicia sesión.', 'warning');
                setTimeout(() => window.location.href = 'index.html', 2000);
                return;
            }

            console.log('Usuario registrado:', data);
            this.showToast('¡Cuenta creada! Te enviamos un email de confirmación.', 'success');
            setTimeout(() => window.location.href = 'dashboard.html', 2000);

        } catch (error) {
            console.error('Error en registro:', error);
            this.showToast('No se pudo crear la cuenta. Intenta de nuevo.', 'error');
        }
    },

    // INICIALIZACIÓN
    async start() {
        this.initTheme();

        const ready = await this.initSupabase();

        if (!ready) {
            this.showToast('Error al cargar el sistema. Recarga la página.', 'error');
            return;
        }

        // Verificar si ya está autenticado
        try {
            const { data: { session } } = await this.client.auth.getSession();
            if (session) {
                window.location.href = 'dashboard.html';
                return;
            }
        } catch (error) {
            console.error('Error checking session:', error);
        }

        // Event listener para el formulario
        const form = document.getElementById('register-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const fullName = document.getElementById('fullName').value.trim();
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;

                if (!fullName || !email || !password || !confirmPassword) {
                    this.showToast('Por favor completa todos los campos', 'warning');
                    return;
                }

                if (password !== confirmPassword) {
                    this.showToast('Las contraseñas no coinciden', 'error');
                    return;
                }

                if (password.length < 6) {
                    this.showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
                    return;
                }

                await this.handleRegister(email, password, fullName);
            });
        }
    }
};

// Ejecutar cuando DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.start());
} else {
    App.start();
}
