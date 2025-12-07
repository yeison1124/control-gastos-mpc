// ============================================
// GESTIÓN DE TRANSACCIONES
// ============================================

let currentUser = null;
let allTransactions = [];
let filteredTransactions = [];
let categories = [];
let accounts = [];

// Paginación
let currentPage = 1;
const itemsPerPage = 8;

// Inicializar
document.addEventListener('DOMContentLoaded', async function () {
    // Verificar autenticación
    if (!await requireAuth()) return;

    // Obtener usuario actual
    currentUser = await getCurrentUser();

    // Cargar datos iniciales
    await loadInitialData();

    // Configurar event listeners
    setupEventListeners();
});

/**
 * Carga datos iniciales
 */
async function loadInitialData() {
    toggleLoader(true);
    try {
        await Promise.all([
            loadTransactions(),
            loadCategories(),
            loadAccounts()
        ]);
    } catch (error) {
        console.error('Error cargando datos:', error);
        showToast('Error cargando datos', 'error');
    } finally {
        toggleLoader(false);
    }
}

/**
 * Configura event listeners
 */
function setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Filtros
    const categoryFilter = document.getElementById('category-filter');
    const typeFilter = document.getElementById('type-filter');
    const dateFilter = document.getElementById('date-filter');

    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);
    if (dateFilter) dateFilter.addEventListener('change', applyFilters);
}

/**
 * Carga todas las transacciones
 */
async function loadTransactions() {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                categories (id, name, icon, color, type),
                accounts (id, name, type)
            `)
            .eq('user_id', currentUser.id)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;

        allTransactions = data || [];
        filteredTransactions = [...allTransactions];

        renderTransactions();
        updateSummary();

    } catch (error) {
        console.error('Error cargando transacciones:', error);
        showToast('Error cargando transacciones', 'error');
    }
}

/**
 * Carga categorías
 */
async function loadCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('name');

        if (error) throw error;

        categories = data || [];
        populateCategoryFilter();

    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

/**
 * Carga cuentas
 */
async function loadAccounts() {
    try {
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('name');

        if (error) throw error;

        accounts = data || [];

    } catch (error) {
        console.error('Error cargando cuentas:', error);
    }
}

/**
 * Renderiza las transacciones
 */
function renderTransactions() {
    const container = document.getElementById('transactions-list');
    if (!container) return;

    if (filteredTransactions.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-inbox" style="font-size: 4rem; opacity: 0.3;"></i>
                <p class="mt-3 text-muted">No se encontraron transacciones</p>
            </div>
        `;
        updatePagination();
        return;
    }

    // Calcular transacciones para la página actual
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageTransactions = filteredTransactions.slice(startIndex, endIndex);

    container.innerHTML = pageTransactions.map(t => `
        <div class="col-12">
            <div class="card transaction-item">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-auto">
                            <div style="width: 50px; height: 50px; background-color: ${t.categories?.color || '#6366f1'}20; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                <i class="bi bi-${t.categories?.icon || 'wallet'}" style="font-size: 1.5rem; color: ${t.categories?.color || '#6366f1'};"></i>
                            </div>
                        </div>
                        <div class="col">
                            <h6 class="mb-1">${t.description}</h6>
                            <div class="d-flex flex-wrap gap-2">
                                <small class="text-muted">
                                    <i class="bi bi-tag"></i> ${t.categories?.name || 'Sin categoría'}
                                </small>
                                <small class="text-muted">
                                    <i class="bi bi-calendar"></i> ${formatDate(t.date)}
                                </small>
                                ${t.accounts ? `<small class="text-muted"><i class="bi bi-wallet"></i> ${t.accounts.name}</small>` : ''}
                            </div>
                        </div>
                        <div class="col-auto text-end">
                            <h5 class="mb-0 ${t.type === 'income' ? 'text-success' : 'text-danger'}">
                                ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                            </h5>
                            <div class="btn-group btn-group-sm mt-2">
                                <button class="btn btn-outline-primary" onclick="editTransaction('${t.id}')" title="Editar">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="deleteTransaction('${t.id}')" title="Eliminar">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    updatePagination();
}

/**
 * Actualiza el resumen de transacciones
 */
function updateSummary() {
    let totalIncome = 0;
    let totalExpenses = 0;

    filteredTransactions.forEach(t => {
        if (t.type === 'income') {
            totalIncome += parseFloat(t.amount);
        } else {
            totalExpenses += parseFloat(t.amount);
        }
    });

    const netBalance = totalIncome - totalExpenses;

    document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('net-balance').textContent = formatCurrency(netBalance);
}

/**
 * Maneja la búsqueda
 */
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    applyFilters();
}

/**
 * Aplica filtros a las transacciones
 */
function applyFilters() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    const typeFilter = document.getElementById('type-filter')?.value || 'all';
    const dateFilter = document.getElementById('date-filter')?.value || 'all';

    filteredTransactions = allTransactions.filter(t => {
        // Filtro de búsqueda
        const matchesSearch = !searchTerm ||
            t.description.toLowerCase().includes(searchTerm) ||
            t.categories?.name.toLowerCase().includes(searchTerm);

        // Filtro de categoría
        const matchesCategory = categoryFilter === 'all' || t.category_id === categoryFilter;

        // Filtro de tipo
        const matchesType = typeFilter === 'all' || t.type === typeFilter;

        // Filtro de fecha
        let matchesDate = true;
        if (dateFilter !== 'all') {
            const transactionDate = new Date(t.date);
            const now = new Date();

            if (dateFilter === 'today') {
                matchesDate = transactionDate.toDateString() === now.toDateString();
            } else if (dateFilter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                matchesDate = transactionDate >= weekAgo;
            } else if (dateFilter === 'month') {
                matchesDate = transactionDate.getMonth() === now.getMonth() &&
                    transactionDate.getFullYear() === now.getFullYear();
            }
        }

        return matchesSearch && matchesCategory && matchesType && matchesDate;
    });

    currentPage = 1;
    renderTransactions();
    updateSummary();
}

/**
 * Popula el filtro de categorías
 */
function populateCategoryFilter() {
    const select = document.getElementById('category-filter');
    if (!select) return;

    select.innerHTML = '<option value="all">Todas las categorías</option>';
    categories.forEach(cat => {
        select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
}

/**
 * Actualiza la paginación
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const paginationContainer = document.getElementById('pagination');

    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    let html = `
        <button class="btn btn-sm btn-outline-primary" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            Anterior
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += '<span class="px-2">...</span>';
        }
    }

    html += `
        <button class="btn btn-sm btn-outline-primary" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Siguiente
        </button>
    `;

    paginationContainer.innerHTML = html;
}

/**
 * Cambia de página
 */
function changePage(page) {
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    renderTransactions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Edita una transacción
 */
function editTransaction(transactionId) {
    navigateTo(`new-transaction.html?edit=${transactionId}`);
}

/**
 * Elimina una transacción
 */
async function deleteTransaction(transactionId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
        return;
    }

    try {
        toggleLoader(true);

        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', transactionId)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        showToast('Transacción eliminada exitosamente', 'success');
        await loadTransactions();

    } catch (error) {
        console.error('Error eliminando transacción:', error);
        showToast('Error eliminando transacción: ' + error.message, 'error');
    } finally {
        toggleLoader(false);
    }
}
