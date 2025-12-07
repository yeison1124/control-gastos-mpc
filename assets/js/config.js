// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================

// TODO: Reemplaza estas variables con tus credenciales de Supabase
// Puedes encontrarlas en: https://app.supabase.com/project/_/settings/api
const SUPABASE_URL = 'https://zczvobqrmucwrbrlksye.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjenZvYnFybXVjd3Jicmxrc3llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNTcyMjAsImV4cCI6MjA4MDYzMzIyMH0.AhRbPtGRUlvW5_Yj-CTKhMFp0w1BvSIUVAO2ucFKbuM';

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// CONSTANTES GLOBALES
// ============================================

const APP_NAME = 'Control de Gastos';
const DEFAULT_CURRENCY = 'USD';
const CURRENCY_SYMBOLS = {
    'USD': '$',
    'EUR': '€',
    'MXN': '$',
    'COP': '$',
    'ARS': '$'
};

// Categorías predeterminadas para nuevos usuarios
const DEFAULT_CATEGORIES = [
    // Categorías de Gastos
    { name: 'Alimentación', type: 'expense', icon: 'cart', color: '#ef4444' },
    { name: 'Restaurantes', type: 'expense', icon: 'cup-straw', color: '#f97316' },
    { name: 'Transporte', type: 'expense', icon: 'car-front', color: '#3b82f6' },
    { name: 'Entretenimiento', type: 'expense', icon: 'controller', color: '#22c55e' },
    { name: 'Servicios', type: 'expense', icon: 'lightning', color: '#f59e0b' },
    { name: 'Salud', type: 'expense', icon: 'heart-pulse', color: '#ec4899' },
    { name: 'Educación', type: 'expense', icon: 'book', color: '#8b5cf6' },
    { name: 'Vivienda', type: 'expense', icon: 'house', color: '#06b6d4' },
    { name: 'Compras', type: 'expense', icon: 'bag', color: '#f97316' },
    { name: 'Ropa', type: 'expense', icon: 'bag-check', color: '#ec4899' },
    { name: 'Belleza', type: 'expense', icon: 'heart', color: '#f472b6' },
    { name: 'Gimnasio', type: 'expense', icon: 'heart-pulse', color: '#10b981' },
    { name: 'Mascotas', type: 'expense', icon: 'heart', color: '#f59e0b' },
    { name: 'Regalos', type: 'expense', icon: 'gift', color: '#ec4899' },
    { name: 'Suscripciones', type: 'expense', icon: 'arrow-repeat', color: '#6366f1' },
    { name: 'Otros Gastos', type: 'expense', icon: 'three-dots', color: '#6b7280' },

    // Categorías de Ingresos
    { name: 'Salario', type: 'income', icon: 'cash-stack', color: '#10b981' },
    { name: 'Freelance', type: 'income', icon: 'laptop', color: '#14b8a6' },
    { name: 'Ingresos Extra', type: 'income', icon: 'piggy-bank', color: '#14b8a6' },
    { name: 'Inversiones', type: 'income', icon: 'graph-up-arrow', color: '#06b6d4' },
    { name: 'Ventas', type: 'income', icon: 'shop', color: '#8b5cf6' },
    { name: 'Alquiler', type: 'income', icon: 'house-check', color: '#22c55e' },
    { name: 'Bonos', type: 'income', icon: 'gift', color: '#f59e0b' },
    { name: 'Otros Ingresos', type: 'income', icon: 'plus-circle', color: '#6366f1' }
];

// Iconos disponibles organizados por tipo
const CATEGORY_ICONS = {
    expense: [
        'cart', 'cart-fill', 'basket', 'bag', 'bag-check', 'bag-fill',
        'car-front', 'car-front-fill', 'bus-front', 'airplane',
        'house', 'house-fill', 'house-door', 'lightbulb', 'lightning',
        'heart-pulse', 'heart', 'heart-fill', 'hospital',
        'book', 'book-fill', 'journal', 'pencil',
        'controller', 'film', 'music-note', 'ticket-perforated',
        'cup-straw', 'cup-hot', 'egg-fried',
        'phone', 'wifi', 'router',
        'gift', 'balloon', 'cake',
        'scissors', 'brush', 'palette',
        'tree', 'flower1', 'gem',
        'tools', 'hammer', 'wrench',
        'arrow-repeat', 'credit-card', 'wallet2',
        'three-dots', 'question-circle'
    ],
    income: [
        'cash-stack', 'cash-coin', 'currency-dollar', 'currency-exchange',
        'piggy-bank', 'piggy-bank-fill', 'safe', 'safe-fill',
        'graph-up-arrow', 'graph-up', 'trending-up', 'bar-chart-fill',
        'trophy', 'trophy-fill', 'award', 'award-fill',
        'shop', 'shop-window', 'building',
        'house-check', 'house-fill',
        'laptop', 'briefcase', 'briefcase-fill',
        'gift', 'gift-fill',
        'star', 'star-fill', 'gem',
        'plus-circle', 'plus-circle-fill',
        'check-circle', 'check-circle-fill'
    ]
};

// ============================================
// FUNCIONES DE VERIFICACIÓN
// ============================================

/**
 * Verifica si Supabase está correctamente configurado
 */
function checkSupabaseConfig() {
    if (SUPABASE_URL === 'TU_SUPABASE_URL_AQUI' || SUPABASE_KEY === 'TU_SUPABASE_ANON_KEY_AQUI') {
        console.error('⚠️ SUPABASE NO CONFIGURADO: Por favor actualiza las credenciales en config.js');
        return false;
    }
    console.log('✅ Supabase correctamente configurado');
    return true;
}

// Verificar configuración al cargar
checkSupabaseConfig();
