// ==============================================
// BÚSQUEDA AVANZADA Y FILTROS
// ==============================================

let currentUser = null;
let allTransactions = [];
let filteredTransactions = [];
let categories = [];
let accounts = [];
let currentFilters = {};
let savedFilters = [];
let datePicker = null;

const ITEMS_PER_PAGE = 20;
let currentPage = 1;

// ==============================================
// INICIALIZACIÓN
// ==============================================

document.addEventListener('DOMContentLoaded', async function () {
    if (!await requireAuth()) return;
    currentUser = await getCurrentUser();

    await loadInitialData();
    initializeEventListeners();
    initializeDatePicker();
    loadSavedFilters();
});

async function loadInitialData() {
    try {
        toggleLoader(true);

        // Load categories, accounts, and all transactions
        const [categoriesRes, accountsRes, transactionsRes] = await Promise.all([
            supabase.from('categories').select('*').eq('user_id', currentUser.id),
            supabase.from('accounts').select('*').eq('user_id', currentUser.id),
            supabase.from('transactions')
                .select(`*, categories(name, color, icon), accounts(name)`)
                .eq('user_id', currentUser.id)
                .order('date', { ascending: false })
        ]);

        if (categoriesRes.error) throw categoriesRes.error;
        if (accountsRes.error) throw accountsRes.error;
        if (transactionsRes.error) throw transactionsRes.error;

        categories = categoriesRes.data || [];
        accounts = accountsRes.data || [];
        allTransactions = transactionsRes.data || [];

        console.log(`📊 Loaded ${allTransactions.length} transactions`);

        populateCategoryFilter();
        populateAccountFilter();

    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error cargando datos', 'error');
    } finally {
        toggleLoader(false);
    }
}

function populateCategoryFilter() {
    const select = document.getElementById('filter-category');
    select.innerHTML = categories.map(cat =>
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('');
}

function populateAccountFilter() {
    const select = document.getElementById('filter-account');
    select.innerHTML = '<option value="">Todas</option>' +
        accounts.map(acc =>
            `<option value="${acc.id}">${acc.name}</option>`
        ).join('');
}

// ==============================================
// EVENT LISTENERS
// ==============================================

function initializeEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', debounce(handleSearch, 300));

    // Clear search
    document.getElementById('clear-search').addEventListener('click', clearSearch);

    // Quick filters
    document.querySelectorAll('.quick-filter').forEach(btn => {
        btn.addEventListener('click', function () {
            const filter = this.getAttribute('data-quick');
            applyQuickFilter(filter);
        });
    });

    // Filter inputs
    document.getElementById('filter-type').addEventListener('change', buildFilters);
    document.getElementById('amount-min').addEventListener('input', debounce(buildFilters, 500));
    document.getElementById('amount-max').addEventListener('input', debounce(buildFilters, 500));
    document.getElementById('filter-category').addEventListener('change', buildFilters);
    document.getElementById('filter-account').addEventListener('change', buildFilters);

    // Actions
    document.getElementById('clear-filters').addEventListener('click', clearAllFilters);
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    document.getElementById('save-filter').addEventListener('click', showSaveFilterModal);
    document.getElementById('confirm-save-filter').addEventListener('click', saveCurrentFilter);
    document.getElementById('sort-by').addEventListener('change', sortResults);
    document.getElementById('export-results').addEventListener('click', exportResults);
}

function initializeDatePicker() {
    datePicker = flatpickr("#date-range", {
        mode: "range",
        dateFormat: "Y-m-d",
        locale: "es",
        onChange: function (selectedDates) {
            if (selectedDates.length === 2) {
                currentFilters.dateStart = selectedDates[0];
                currentFilters.dateEnd = selectedDates[1];
                buildFilters();
            }
        }
    });
}

// ==============================================
// SEARCH
// ==============================================

function handleSearch(e) {
    const query = e.target.value.trim();
    const clearBtn = document.getElementById('clear-search');

    if (query) {
        clearBtn.classList.add('show');
        currentFilters.search = query;
    } else {
        clearBtn.classList.remove('show');
        delete currentFilters.search;
    }

    applyFilters();
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('clear-search').classList.remove('show');
    delete currentFilters.search;
    applyFilters();
}

// ==============================================
// QUICK FILTERS
// ==============================================

function applyQuickFilter(type) {
    // Reset active states
    document.querySelectorAll('.quick-filter').forEach(btn => btn.classList.remove('active'));

    const now = new Date();

    switch (type) {
        case 'today':
            currentFilters.dateStart = new Date(now.setHours(0, 0, 0, 0));
            currentFilters.dateEnd = new Date(now.setHours(23, 59, 59, 999));
            event.target.closest('.quick-filter').classList.add('active');
            break;

        case 'week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            currentFilters.dateStart = weekStart;
            currentFilters.dateEnd = new Date();
            event.target.closest('.quick-filter').classList.add('active');
            break;

        case 'month':
            currentFilters.dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
            currentFilters.dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            event.target.closest('.quick-filter').classList.add('active');
            break;

        case 'expenses':
            currentFilters.type = 'expense';
            event.target.closest('.quick-filter').classList.add('active');
            document.getElementById('filter-type').value = 'expense';
            break;
    }

    applyFilters();
}

// ==============================================
// BUILD FILTERS
// ==============================================

function buildFilters() {
    const type = document.getElementById('filter-type').value;
    const amountMin = document.getElementById('amount-min').value;
    const amountMax = document.getElementById('amount-max').value;
    const categorySelect = document.getElementById('filter-category');
    const selectedCategories = Array.from(categorySelect.selectedOptions).map(opt => opt.value);
    const account = document.getElementById('filter-account').value;

    // Update currentFilters
    if (type) currentFilters.type = type;
    else delete currentFilters.type;

    if (amountMin) currentFilters.amountMin = parseFloat(amountMin);
    else delete currentFilters.amountMin;

    if (amountMax) currentFilters.amountMax = parseFloat(amountMax);
    else delete currentFilters.amountMax;

    if (selectedCategories.length > 0) currentFilters.categories = selectedCategories;
    else delete currentFilters.categories;

    if (account) currentFilters.account = account;
    else delete currentFilters.account;

    // Don't auto-apply, wait for user to click Apply
    updateActiveFiltersDisplay();
}

// ==============================================
// APPLY FILTERS
// ==============================================

function applyFilters() {
    filteredTransactions = allTransactions.filter(transaction => {
        // Search filter
        if (currentFilters.search) {
            const query = currentFilters.search.toLowerCase();
            const matchesDescription = transaction.description?.toLowerCase().includes(query);
            const matchesCategory = transaction.categories?.name?.toLowerCase().includes(query);
            const matchesAmount = transaction.amount.toString().includes(query);

            if (!matchesDescription && !matchesCategory && !matchesAmount) {
                return false;
            }
        }

        // Type filter
        if (currentFilters.type && transaction.type !== currentFilters.type) {
            return false;
        }

        // Date range filter
        if (currentFilters.dateStart || currentFilters.dateEnd) {
            const transactionDate = new Date(transaction.date);

            if (currentFilters.dateStart && transactionDate < currentFilters.dateStart) {
                return false;
            }

            if (currentFilters.dateEnd && transactionDate > currentFilters.dateEnd) {
                return false;
            }
        }

        // Amount range filter
        const amount = parseFloat(transaction.amount);

        if (currentFilters.amountMin && amount < currentFilters.amountMin) {
            return false;
        }

        if (currentFilters.amountMax && amount > currentFilters.amountMax) {
            return false;
        }

        // Category filter
        if (currentFilters.categories && currentFilters.categories.length > 0) {
            if (!currentFilters.categories.includes(transaction.category_id.toString())) {
                return false;
            }
        }

        // Account filter
        if (currentFilters.account && transaction.account_id.toString() !== currentFilters.account) {
            return false;
        }

        return true;
    });

    currentPage = 1;
    sortResults();
    updateActiveFiltersDisplay();
    renderResults();
}

// ==============================================
// DISPLAY RESULTS
// ==============================================

function renderResults() {
    const container = document.getElementById('results-container');
    const countElement = document.getElementById('results-count');

    countElement.textContent = `${filteredTransactions.length} resultado${filteredTransactions.length !== 1 ? 's' : ''}`;

    if (filteredTransactions.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="bi bi-inbox"></i>
                <h5 class="mt-3">No se encontraron resultados</h5>
                <p class="text-muted">Intenta ajustar los filtros de búsqueda</p>
            </div>
        `;
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    // Pagination
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginatedTransactions = filteredTransactions.slice(start, end);

    // Render transactions
    container.innerHTML = paginatedTransactions.map(t => `
        <div class="card transaction-card ${t.type} mb-3" onclick="viewTransaction('${t.id}')">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <div style="
                            width: 50px;
                            height: 50px;
                            border-radius: 12px;
                            background: ${t.categories?.color || '#6b7280'};
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-size: 1.5rem;
                        ">
                            <i class="bi bi-${t.categories?.icon || 'wallet'}"></i>
                        </div>
                    </div>
                    <div class="col">
                        <h6 class="mb-1">${t.description || 'Sin descripción'}</h6>
                        <div class="d-flex gap-2 flex-wrap">
                            <span class="badge bg-light text-dark">
                                <i class="bi bi-tag me-1"></i>${t.categories?.name || 'Sin categoría'}
                            </span>
                            ${t.accounts ? `
                                <span class="badge bg-light text-dark">
                                    <i class="bi bi-credit-card me-1"></i>${t.accounts.name}
                                </span>
                            ` : ''}
                            <span class="badge bg-light text-dark">
                                <i class="bi bi-calendar me-1"></i>${formatDate(t.date)}
                            </span>
                        </div>
                    </div>
                    <div class="col-auto text-end">
                        <span class="badge badge-amount ${t.type === 'income' ? 'bg-success' : 'bg-danger'}">
                            ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
    const paginationContainer = document.getElementById('pagination');

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '<nav><ul class="pagination">';

    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">Anterior</a>
        </li>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">Siguiente</a>
        </li>
    `;

    paginationHTML += '</ul></nav>';
    paginationContainer.innerHTML = paginationHTML;
}

function changePage(page) {
    currentPage = page;
    renderResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==============================================
// ACTIVE FILTERS DISPLAY
// ==============================================

function updateActiveFiltersDisplay() {
    const container = document.getElementById('active-filters');
    const chips = [];

    if (currentFilters.search) {
        chips.push(`
            <span class="filter-chip">
                Búsqueda: "${currentFilters.search}"
                <span class="remove" onclick="removeFilter('search')">×</span>
            </span>
        `);
    }

    if (currentFilters.type) {
        chips.push(`
            <span class="filter-chip">
                Tipo: ${currentFilters.type === 'income' ? 'Ingresos' : 'Gastos'}
                <span class="remove" onclick="removeFilter('type')">×</span>
            </span>
        `);
    }

    if (currentFilters.dateStart || currentFilters.dateEnd) {
        const start = currentFilters.dateStart ? formatDate(currentFilters.dateStart) : '...';
        const end = currentFilters.dateEnd ? formatDate(currentFilters.dateEnd) : '...';
        chips.push(`
            <span class="filter-chip">
                Fecha: ${start} - ${end}
                <span class="remove" onclick="removeFilter('date')">×</span>
            </span>
        `);
    }

    if (currentFilters.amountMin || currentFilters.amountMax) {
        const min = currentFilters.amountMin ? formatCurrency(currentFilters.amountMin) : '0';
        const max = currentFilters.amountMax ? formatCurrency(currentFilters.amountMax) : '∞';
        chips.push(`
            <span class="filter-chip">
                Monto: ${min} - ${max}
                <span class="remove" onclick="removeFilter('amount')">×</span>
            </span>
        `);
    }

    if (currentFilters.categories && currentFilters.categories.length > 0) {
        const categoryNames = currentFilters.categories.map(id => {
            const cat = categories.find(c => c.id.toString() === id);
            return cat ? cat.name : id;
        }).join(', ');

        chips.push(`
            <span class="filter-chip">
                Categorías: ${categoryNames}
                <span class="remove" onclick="removeFilter('categories')">×</span>
            </span>
        `);
    }

    if (currentFilters.account) {
        const accountName = accounts.find(a => a.id.toString() === currentFilters.account)?.name || '';
        chips.push(`
            <span class="filter-chip">
                Cuenta: ${accountName}
                <span class="remove" onclick="removeFilter('account')">×</span>
            </span>
        `);
    }

    container.innerHTML = chips.length > 0 ? chips.join('') : '';
}

function removeFilter(filterType) {
    switch (filterType) {
        case 'search':
            delete currentFilters.search;
            document.getElementById('search-input').value = '';
            document.getElementById('clear-search').classList.remove('show');
            break;
        case 'type':
            delete currentFilters.type;
            document.getElementById('filter-type').value = '';
            break;
        case 'date':
            delete currentFilters.dateStart;
            delete currentFilters.dateEnd;
            if (datePicker) datePicker.clear();
            break;
        case 'amount':
            delete currentFilters.amountMin;
            delete currentFilters.amountMax;
            document.getElementById('amount-min').value = '';
            document.getElementById('amount-max').value = '';
            break;
        case 'categories':
            delete currentFilters.categories;
            document.getElementById('filter-category').selectedIndex = -1;
            break;
        case 'account':
            delete currentFilters.account;
            document.getElementById('filter-account').value = '';
            break;
    }

    applyFilters();
}

function clearAllFilters() {
    currentFilters = {};

    // Reset all inputs
    document.getElementById('search-input').value = '';
    document.getElementById('clear-search').classList.remove('show');
    document.getElementById('filter-type').value = '';
    document.getElementById('amount-min').value = '';
    document.getElementById('amount-max').value = '';
    document.getElementById('filter-category').selectedIndex = -1;
    document.getElementById('filter-account').value = '';

    if (datePicker) datePicker.clear();

    document.querySelectorAll('.quick-filter').forEach(btn => btn.classList.remove('active'));

    applyFilters();
}

// ==============================================
// SORTING
// ==============================================

function sortResults() {
    const sortBy = document.getElementById('sort-by').value;

    filteredTransactions.sort((a, b) => {
        switch (sortBy) {
            case 'date-desc':
                return new Date(b.date) - new Date(a.date);
            case 'date-asc':
                return new Date(a.date) - new Date(b.date);
            case 'amount-desc':
                return parseFloat(b.amount) - parseFloat(a.amount);
            case 'amount-asc':
                return parseFloat(a.amount) - parseFloat(b.amount);
            default:
                return 0;
        }
    });

    renderResults();
}

// ==============================================
// SAVED FILTERS
// ==============================================

function loadSavedFilters() {
    const saved = localStorage.getItem('savedFilters');
    savedFilters = saved ? JSON.parse(saved) : [];
    renderSavedFilters();
}

function renderSavedFilters() {
    const container = document.getElementById('saved-filters');

    if (savedFilters.length === 0) {
        container.innerHTML = '<p class="text-muted small text-center">No hay filtros guardados</p>';
        return;
    }

    container.innerHTML = savedFilters.map((filter, index) => `
        <div class="saved-filter mb-2" onclick="applySavedFilter(${index})">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong class="d-block small">${filter.name}</strong>
                    <small class="text-muted">${Object.keys(filter.filters).length} filtros</small>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deleteSavedFilter(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function showSaveFilterModal() {
    if (Object.keys(currentFilters).length === 0) {
        showToast('No hay filtros activos para guardar', 'warning');
        return;
    }

    const modal = new bootstrap.Modal(document.getElementById('saveFilterModal'));
    modal.show();
}

function saveCurrentFilter() {
    const name = document.getElementById('filter-name').value.trim();

    if (!name) {
        showToast('Ingresa un nombre para el filtro', 'warning');
        return;
    }

    savedFilters.push({
        name: name,
        filters: { ...currentFilters }
    });

    localStorage.setItem('savedFilters', JSON.stringify(savedFilters));

    renderSavedFilters();
    showToast('Filtro guardado exitosamente', 'success');

    const modal = bootstrap.Modal.getInstance(document.getElementById('saveFilterModal'));
    modal.hide();

    document.getElementById('filter-name').value = '';
}

function applySavedFilter(index) {
    currentFilters = { ...savedFilters[index].filters };

    // Update UI to reflect loaded filters
    if (currentFilters.type) document.getElementById('filter-type').value = currentFilters.type;
    if (currentFilters.amountMin) document.getElementById('amount-min').value = currentFilters.amountMin;
    if (currentFilters.amountMax) document.getElementById('amount-max').value = currentFilters.amountMax;
    if (currentFilters.account) document.getElementById('filter-account').value = currentFilters.account;
    // ... more UI updates as needed

    applyFilters();
    showToast(`Filtro "${savedFilters[index].name}" aplicado`, 'success');
}

function deleteSavedFilter(index) {
    if (confirm('¿Eliminar este filtro guardado?')) {
        savedFilters.splice(index, 1);
        localStorage.setItem('savedFilters', JSON.stringify(savedFilters));
        renderSavedFilters();
        showToast('Filtro eliminado', 'success');
    }
}

// ==============================================
// EXPORT
// ==============================================

function exportResults() {
    if (filteredTransactions.length === 0) {
        showToast('No hay resultados para exportar', 'warning');
        return;
    }

    // Create CSV
    const headers = ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Cuenta'];
    const rows = filteredTransactions.map(t => [
        t.date,
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        t.categories?.name || 'Sin categoría',
        t.description || '',
        t.amount,
        t.accounts?.name || ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacciones_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showToast('Resultados exportados exitosamente', 'success');
}

// ==============================================
// UTILITIES
// ==============================================

function viewTransaction(id) {
    // TODO: Open transaction detail modal
    alert(`Ver detalles de transacción: ${id}`);
}

// Debounce function
function debounce(func, wait) {
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
