// ==============================================
// SISTEMA DE GASTOS RECURRENTES AUTOMÁTICOS
// ==============================================

let currentUser = null;
let recurringTransactions = [];
let categories = [];
let accounts = [];
let autoCreatedThisMonth = 0;
let calendarDate = new Date();

// ==============================================
// INICIALIZACIÓN
// ==============================================

document.addEventListener('DOMContentLoaded', async function () {
    if (!await requireAuth()) return;
    currentUser = await getCurrentUser();

    await loadInitialData();
    initEventListeners();
    processRecurringTransactions(); // Auto-create transactions
});

async function loadInitialData() {
    try {
        toggleLoader(true);

        // Load categories, accounts, and recurring rules
        const [categoriesRes, accountsRes] = await Promise.all([
            supabase.from('categories').select('*').eq('user_id', currentUser.id),
            supabase.from('accounts').select('*').eq('user_id', currentUser.id)
        ]);

        if (categoriesRes.error) throw categoriesRes.error;
        if (accountsRes.error) throw accountsRes.error;

        categories = categoriesRes.data || [];
        accounts = accountsRes.data || [];

        // Load recurring from localStorage
        loadRecurringTransactions();

        populateCategorySelect();
        populateAccountSelect();
        updateStats();
        renderAllTabs();

    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error cargando datos', 'error');
    } finally {
        toggleLoader(false);
    }
}

function loadRecurringTransactions() {
    const stored = localStorage.getItem(`recurring_${currentUser.id}`);
    recurringTransactions = stored ? JSON.parse(stored) : [];
}

function saveRecurringTransactions() {
    localStorage.setItem(`recurring_${currentUser.id}`, JSON.stringify(recurringTransactions));
}

function populateCategorySelect() {
    const select = document.getElementById('recurring-category');
    select.innerHTML = '<option value="">Seleccionar...</option>' +
        categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
}

function populateAccountSelect() {
    const select = document.getElementById('recurring-account');
    select.innerHTML = '<option value="">Seleccionar...</option>' +
        accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('');
}

// ==============================================
// EVENT LISTENERS
// ==============================================

function initEventListeners() {
    document.getElementById('create-recurring-btn').addEventListener('click', showCreateModal);
    document.getElementById('save-recurring-btn').addEventListener('click', saveRecurring);
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
}

// ==============================================
// CREATE/EDIT RECURRING
// ==============================================

function showCreateModal() {
    document.getElementById('modal-title').textContent = 'Crear Gasto Recurrente';
    document.getElementById('recurring-form').reset();

    // Set today as start date
    document.getElementById('recurring-start-date').valueAsDate = new Date();

    const modal = new bootstrap.Modal(document.getElementById('recurringModal'));
    modal.show();
}

function showEditModal(id) {
    const recurring = recurringTransactions.find(r => r.id === id);
    if (!recurring) return;

    document.getElementById('modal-title').textContent = 'Editar Gasto Recurrente';
    document.getElementById('recurring-description').value = recurring.description;
    document.getElementById('recurring-amount').value = recurring.amount;
    document.getElementById('recurring-type').value = recurring.type;
    document.getElementById('recurring-category').value = recurring.category_id;
    document.getElementById('recurring-account').value = recurring.account_id;
    document.getElementById('recurring-frequency').value = recurring.frequency;
    document.getElementById('recurring-day').value = recurring.dayOfMonth || 1;
    document.getElementById('recurring-start-date').value = recurring.startDate;
    document.getElementById('recurring-end-date').value = recurring.endDate || '';
    document.getElementById('recurring-auto-create').checked = recurring.autoCreate !== false;

    document.getElementById('save-recurring-btn').setAttribute('data-edit-id', id);

    const modal = new bootstrap.Modal(document.getElementById('recurringModal'));
    modal.show();
}

async function saveRecurring() {
    const description = document.getElementById('recurring-description').value.trim();
    const amount = document.getElementById('recurring-amount').value;
    const type = document.getElementById('recurring-type').value;
    const category_id = document.getElementById('recurring-category').value;
    const account_id = document.getElementById('recurring-account').value;
    const frequency = document.getElementById('recurring-frequency').value;
    const dayOfMonth = parseInt(document.getElementById('recurring-day').value);
    const startDate = document.getElementById('recurring-start-date').value;
    const endDate = document.getElementById('recurring-end-date').value;
    const autoCreate = document.getElementById('recurring-auto-create').checked;

    if (!description || !amount || !category_id || !account_id || !startDate) {
        showToast('Completa todos los campos obligatorios', 'warning');
        return;
    }

    const editId = document.getElementById('save-recurring-btn').getAttribute('data-edit-id');

    const recurringData = {
        id: editId || Date.now().toString(),
        description,
        amount: parseFloat(amount),
        type,
        category_id,
        account_id,
        frequency,
        dayOfMonth,
        startDate,
        endDate: endDate || null,
        autoCreate,
        active: true,
        lastCreated: null,
        createdAt: new Date().toISOString()
    };

    if (editId) {
        const index = recurringTransactions.findIndex(r => r.id === editId);
        recurringTransactions[index] = { ...recurringTransactions[index], ...recurringData };
        showToast('Gasto recurrente actualizado', 'success');
    } else {
        recurringTransactions.push(recurringData);
        showToast('Gasto recurrente creado', 'success');
    }

    saveRecurringTransactions();
    updateStats();
    renderAllTabs();

    const modal = bootstrap.Modal.getInstance(document.getElementById('recurringModal'));
    modal.hide();
    document.getElementById('save-recurring-btn').removeAttribute('data-edit-id');
}

// ==============================================
// AUTO-CREATE TRANSACTIONS
// ==============================================

async function processRecurringTransactions() {
    console.log('🔄 Procesando transacciones recurrentes...');

    const today = new Date();
    let created = 0;

    for (const recurring of recurringTransactions) {
        if (!recurring.active || !recurring.autoCreate) continue;

        try {
            const shouldCreate = shouldCreateTransaction(recurring, today);

            if (shouldCreate) {
                await createTransactionFromRecurring(recurring, today);
                recurring.lastCreated = today.toISOString().split('T')[0];
                created++;
                console.log(`✅ Creada: ${recurring.description}`);
            }
        } catch (error) {
            console.error(`Error procesando ${recurring.description}:`, error);
        }
    }

    if (created > 0) {
        saveRecurringTransactions();
        autoCreatedThisMonth = countAutoCreatedThisMonth();
        showToast(`${created} transacción(es) creadas automáticamente`, 'success');
        updateStats();
    }

    console.log(`✅ Procesamiento completo: ${created} creadas`);
}

function shouldCreateTransaction(recurring, today) {
    const startDate = new Date(recurring.startDate);

    // No ha empezado aún
    if (today < startDate) return false;

    // Ya terminó
    if (recurring.endDate) {
        const endDate = new Date(recurring.endDate);
        if (today > endDate) return false;
    }

    // Ya se creó hoy
    if (recurring.lastCreated === today.toISOString().split('T')[0]) {
        return false;
    }

    // Check según frecuencia
    switch (recurring.frequency) {
        case 'daily':
            return true;

        case 'weekly':
            // Cada 7 días desde start date
            const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
            return daysSinceStart % 7 === 0;

        case 'biweekly':
            // Cada 14 días
            const daysSinceStart14 = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
            return daysSinceStart14 % 14 === 0;

        case 'monthly':
            // Día específico del mes
            return today.getDate() === recurring.dayOfMonth;

        case 'quarterly':
            // Cada 3 meses en el día específico
            return today.getDate() === recurring.dayOfMonth && today.getMonth() % 3 === startDate.getMonth() % 3;

        case 'yearly':
            // Misma fecha cada año
            return today.getDate() === recurring.dayOfMonth && today.getMonth() === startDate.getMonth();

        default:
            return false;
    }
}

async function createTransactionFromRecurring(recurring, date) {
    const transaction = {
        user_id: currentUser.id,
        description: recurring.description + ' (Recurrente)',
        amount: recurring.amount,
        type: recurring.type,
        category_id: recurring.category_id,
        account_id: recurring.account_id,
        date: date.toISOString().split('T')[0],
        notes: `Creado automáticamente desde gasto recurrente`,
        recurring_id: recurring.id
    };

    const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select();

    if (error) throw error;

    return data[0];
}

function countAutoCreatedThisMonth() {
    // This would query Supabase for transactions created this month with recurring_id
    // For now, approximate from lastCreated dates
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    return recurringTransactions.filter(r => {
        if (!r.lastCreated) return false;
        const lastDate = new Date(r.lastCreated);
        return lastDate.getMonth() === thisMonth && lastDate.getFullYear() === thisYear;
    }).length;
}

// ==============================================
// TOGGLE ACTIVE/PAUSE
// ==============================================

function toggleRecurring(id) {
    const recurring = recurringTransactions.find(r => r.id === id);
    if (recurring) {
        recurring.active = !recurring.active;
        saveRecurringTransactions();
        renderAllTabs();
        updateStats();
        showToast(recurring.active ? 'Reactivado' : 'Pausado', 'success');
    }
}

function deleteRecurring(id) {
    if (confirm('¿Eliminar este gasto recurrente? Las transacciones ya creadas no se eliminarán.')) {
        recurringTransactions = recurringTransactions.filter(r => r.id !== id);
        saveRecurringTransactions();
        renderAllTabs();
        updateStats();
        showToast('Gasto recurrente eliminado', 'success');
    }
}

// ==============================================
// UPDATE STATS
// ==============================================

function updateStats() {
    const activeCount = recurringTransactions.filter(r => r.active).length;
    const monthlyTotal = calculateMonthlyTotal();
    const nextCount = countNext7Days();
    autoCreatedThisMonth = countAutoCreatedThisMonth();

    document.getElementById('total-recurring').textContent = activeCount;
    document.getElementById('monthly-total').textContent = formatCurrency(monthlyTotal);
    document.getElementById('next-count').textContent = nextCount;
    document.getElementById('auto-created').textContent = autoCreatedThisMonth;
}

function calculateMonthlyTotal() {
    return recurringTransactions
        .filter(r => r.active && r.type === 'expense')
        .reduce((sum, r) => {
            // Convert to monthly equivalent
            let monthly = 0;
            switch (r.frequency) {
                case 'daily': monthly = r.amount * 30; break;
                case 'weekly': monthly = r.amount * 4; break;
                case 'biweekly': monthly = r.amount * 2; break;
                case 'monthly': monthly = r.amount; break;
                case 'quarterly': monthly = r.amount / 3; break;
                case 'yearly': monthly = r.amount / 12; break;
            }
            return sum + monthly;
        }, 0);
}

function countNext7Days() {
    const today = new Date();
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);

    return getUpcomingPayments(30).filter(p => {
        const paymentDate = new Date(p.date);
        return paymentDate >= today && paymentDate <= next7Days;
    }).length;
}

// ==============================================
// RENDER TABS
// ==============================================

function renderAllTabs() {
    renderActiveRecurring();
    renderUpcomingPayments();
    renderCalendar();
    renderHistory();
}

function renderActiveRecurring() {
    const container = document.getElementById('recurring-list');

    const active = recurringTransactions.filter(r => r.active);

    if (active.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-arrow-repeat" style="font-size: 4rem; opacity: 0.3;"></i>
                <h5 class="mt-3">No hay gastos recurrentes</h5>
                <p class="text-muted">Crea tu primer gasto recurrente para automatizar pagos</p>
                <button class="btn btn-primary mt-2" onclick="showCreateModal()">
                    Crear Gasto Recurrente
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = active.map(r => {
        const category = categories.find(c => c.id === r.category_id);
        const account = accounts.find(a => a.id === r.account_id);
        const nextPayment = calculateNextPayment(r);

        return `
            <div class="card recurring-card ${r.active ? 'active' : 'paused'} ${r.type} mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-auto">
                            <div style="
                                width: 50px;
                                height: 50px;
                                border-radius: 50%;
                                background: ${category?.color || '#6b7280'};
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                font-size: 1.5rem;
                            ">
                                <i class="bi bi-${category?.icon || 'wallet'}"></i>
                            </div>
                        </div>
                        <div class="col">
                            <h6 class="mb-1">${r.description}</h6>
                            <div class="d-flex gap-2 flex-wrap align-items-center">
                                <span class="frequency-badge ${r.frequency}">
                                    <i class="bi bi-arrow-repeat"></i>${getFrequencyLabel(r.frequency)}
                                </span>
                                <span class="badge bg-light text-dark">
                                    <i class="bi bi-tag me-1"></i>${category?.name || 'Sin categoría'}
                                </span>
                                ${account ? `<span class="badge bg-light text-dark">
                                    <i class="bi bi-credit-card me-1"></i>${account.name}
                                </span>` : ''}
                                ${r.autoCreate ? '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Auto</span>' : ''}
                            </div>
                            ${nextPayment ? `<small class="text-muted mt-1 d-block">
                                <i class="bi bi-calendar-event me-1"></i>Próximo: ${formatDate(nextPayment)}
                            </small>` : ''}
                        </div>
                        <div class="col-auto text-end">
                            <h5 class="mb-1 ${r.type === 'income' ? 'text-success' : 'text-danger'}">
                                ${r.type === 'income' ? '+' : ''}${formatCurrency(r.amount)}
                            </h5>
                            <div class="btn-group btn-group-sm">
                                <label class="toggle-switch" title="${r.active ? 'Pausar' : 'Activar'}">
                                    <input type="checkbox" ${r.active ? 'checked' : ''} onchange="toggleRecurring('${r.id}')">
                                    <span class="toggle-slider"></span>
                                </label>
                                <button class="btn btn-outline-primary" onclick="showEditModal('${r.id}')" title="Editar">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="deleteRecurring('${r.id}')" title="Eliminar">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderUpcomingPayments() {
    const container = document.getElementById('upcoming-list');
    const upcoming = getUpcomingPayments(30);

    if (upcoming.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No hay pagos próximos</p>';
        return;
    }

    container.innerHTML = upcoming.map(payment => {
        const category = categories.find(c => c.id === payment.recurring.category_id);
        const daysUntil = Math.ceil((new Date(payment.date) - new Date()) / (1000 * 60 * 60 * 24));

        return `
            <div class="next-payment">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <div style="
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            background: ${category?.color || '#6b7280'};
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                        ">
                            <i class="bi bi-${category?.icon || 'wallet'}"></i>
                        </div>
                    </div>
                    <div class="col">
                        <h6 class="mb-0">${payment.recurring.description}</h6>
                        <small class="text-muted">
                            ${formatDate(payment.date)} 
                            ${daysUntil === 0 ? '(Hoy)' : daysUntil === 1 ? '(Mañana)' : `(en ${daysUntil} días)`}
                        </small>
                    </div>
                    <div class="col-auto">
                        <h5 class="mb-0 text-danger">${formatCurrency(payment.recurring.amount)}</h5>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getUpcomingPayments(days) {
    const upcoming = [];
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    recurringTransactions
        .filter(r => r.active)
        .forEach(recurring => {
            let currentDate = new Date(Math.max(today, new Date(recurring.startDate)));

            while (currentDate <= endDate) {
                if (shouldCreateTransaction(recurring, currentDate)) {
                    upcoming.push({
                        date: currentDate.toISOString().split('T')[0],
                        recurring: recurring
                    });
                }

                // Move to next potential date
                currentDate = getNextOccurrence(currentDate, recurring.frequency);

                if (recurring.endDate && currentDate > new Date(recurring.endDate)) {
                    break;
                }
            }
        });

    return upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getNextOccurrence(date, frequency) {
    const next = new Date(date);

    switch (frequency) {
        case 'daily': next.setDate(next.getDate() + 1); break;
        case 'weekly': next.setDate(next.getDate() + 7); break;
        case 'biweekly': next.setDate(next.getDate() + 14); break;
        case 'monthly': next.setMonth(next.getMonth() + 1); break;
        case 'quarterly': next.setMonth(next.getMonth() + 3); break;
        case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
    }

    return next;
}

function calculateNextPayment(recurring) {
    const upcoming = getUpcomingPayments(365);
    const next = upcoming.find(p => p.recurring.id === recurring.id);
    return next ? next.date : null;
}

// ==============================================
// CALENDAR
// ==============================================

function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    // Update header
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;

    // Get payments for this month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const payments = getUpcomingPayments(365).filter(p => {
        const paymentDate = new Date(p.date);
        return paymentDate >= firstDay && paymentDate <= lastDay;
    });

    // Create calendar grid
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();

    let calendarHTML = '<div class="row g-2 mb-2"><div class="col text-center fw-bold small">Dom</div><div class="col text-center fw-bold small">Lun</div><div class="col text-center fw-bold small">Mar</div><div class="col text-center fw-bold small">Mié</div><div class="col text-center fw-bold small">Jue</div><div class="col text-center fw-bold small">Vie</div><div class="col text-center fw-bold small">Sáb</div></div>';

    calendarHTML += '<div class="row g-2">';

    // Empty cells before first day
    for (let i = 0; i < firstDayOfWeek; i++) {
        calendarHTML += '<div class="col"></div>';
    }

    // Days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dateString = currentDate.toISOString().split('T')[0];
        const hasPayment = payments.some(p => p.date === dateString);
        const isToday = currentDate.toDateString() === today.toDateString();

        calendarHTML += `
            <div class="col">
                <div class="calendar-day ${hasPayment ? 'has-payment' : ''} ${isToday ? 'today' : ''}">
                    <div class="small">${day}</div>
                    ${hasPayment ? '<div class="payment-indicator"></div>' : ''}
                </div>
            </div>
        `;

        // New row every 7 days
        if ((firstDayOfWeek + day) % 7 === 0) {
            calendarHTML += '</div><div class="row g-2">';
        }
    }

    calendarHTML += '</div>';
    document.getElementById('calendar-grid').innerHTML = calendarHTML;
}

function changeMonth(delta) {
    calendarDate.setMonth(calendarDate.getMonth() + delta);
    renderCalendar();
}

// ==============================================
// HISTORY
// ==============================================

async function renderHistory() {
    const container = document.getElementById('history-list');

    try {
        // Get all transactions created from recurring
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*, categories(name, color, icon)')
            .eq('user_id', currentUser.id)
            .not('recurring_id', 'is', null)
            .order('date', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!transactions || transactions.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No hay transacciones creadas automáticamente</p>';
            return;
        }

        container.innerHTML = transactions.map(t => `
            <div class="card mb-2">
                <div class="card-body py-2">
                    <div class="row align-items-center">
                        <div class="col-auto">
                            <i class="bi bi-${t.categories?.icon || 'wallet'}" style="color: ${t.categories?.color || '#6b7280'};"></i>
                        </div>
                        <div class="col">
                            <small class="d-block">${t.description}</small>
                            <small class="text-muted">${formatDate(t.date)}</small>
                        </div>
                        <div class="col-auto">
                            <strong class="${t.type === 'income' ? 'text-success' : 'text-danger'}">
                                ${formatCurrency(t.amount)}
                            </strong>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading history:', error);
        container.innerHTML = '<p class="text-danger text-center">Error cargando historial</p>';
    }
}

// ==============================================
// UTILITIES
// ==============================================

function getFrequencyLabel(frequency) {
    const labels = {
        daily: 'Diario',
        weekly: 'Semanal',
        biweekly: 'Quincenal',
        monthly: 'Mensual',
        quarterly: 'Trimestral',
        yearly: 'Anual'
    };
    return labels[frequency] || frequency;
}

// Auto-process on page load and every hour
setInterval(processRecurringTransactions, 60 * 60 * 1000); // Every hour
