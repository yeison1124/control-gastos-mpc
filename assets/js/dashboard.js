// ============================================
// DASHBOARD - LÓGICA PRINCIPAL
// ============================================

// Variables globales
let currentUser = null;
let dashboardData = {
    balance: 0,
    income: 0,
    expenses: 0,
    budget: 0,
    transactions: [],
    budgets: [],
    goals: []
};

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', async function () {
    // Verificar autenticación
    if (!await requireAuth()) return;

    // Obtener usuario actual
    currentUser = await getCurrentUser();

    // Cargar datos del dashboard
    await loadDashboardData();

    // Actualizar fecha del mes actual
    updateCurrentMonth();
});

/**
 * Actualiza el texto del mes actual
 */
function updateCurrentMonth() {
    const now = new Date();
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const monthElement = document.getElementById('current-month');
    if (monthElement) {
        monthElement.textContent = `Resumen de ${monthNames[now.getMonth()]} de ${now.getFullYear()}`;
    }
}

/**
 * Carga todos los datos del dashboard
 */
async function loadDashboardData() {
    try {
        toggleLoader(true);

        // Cargar datos en paralelo
        await Promise.all([
            loadMetrics(),
            loadRecentTransactions(),
            loadMonthlyBudgets(),
            loadSavingsGoals()
        ]);

    } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
        showToast('Error cargando datos', 'error');
    } finally {
        toggleLoader(false);
    }
}

/**
 * Carga las métricas principales
 */
async function loadMetrics() {
    try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Obtener transacciones del mes actual
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', currentUser.id)
            .gte('date', firstDayOfMonth.toISOString().split('T')[0])
            .lte('date', lastDayOfMonth.toISOString().split('T')[0]);

        if (error) throw error;

        // Calcular totales
        let totalIncome = 0;
        let totalExpenses = 0;

        transactions?.forEach(t => {
            if (t.type === 'income') {
                totalIncome += parseFloat(t.amount);
            } else {
                totalExpenses += parseFloat(t.amount);
            }
        });

        const balance = totalIncome - totalExpenses;

        // Obtener presupuesto total del mes
        const { data: budgets } = await supabase
            .from('budgets')
            .select('amount')
            .eq('user_id', currentUser.id)
            .eq('period', 'monthly')
            .gte('start_date', firstDayOfMonth.toISOString().split('T')[0])
            .lte('end_date', lastDayOfMonth.toISOString().split('T')[0]);

        let totalBudget = 0;
        budgets?.forEach(b => {
            totalBudget += parseFloat(b.amount);
        });

        const budgetRemaining = totalBudget - totalExpenses;
        const budgetPercentage = totalBudget > 0 ? Math.round((budgetRemaining / totalBudget) * 100) : 0;

        // Actualizar UI
        document.getElementById('total-balance').textContent = formatCurrency(balance);
        document.getElementById('total-income').textContent = formatCurrency(totalIncome);
        document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);
        document.getElementById('budget-remaining').textContent = formatCurrency(budgetRemaining);
        document.getElementById('budget-percentage').textContent = `${budgetPercentage}% del total`;

        // Guardar en variables globales
        dashboardData.balance = balance;
        dashboardData.income = totalIncome;
        dashboardData.expenses = totalExpenses;
        dashboardData.budget = budgetRemaining;

    } catch (error) {
        console.error('Error cargando métricas:', error);
    }
}

/**
 * Carga las transacciones recientes
 */
async function loadRecentTransactions() {
    try {
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select(`
                *,
                categories (name, icon, color)
            `)
            .eq('user_id', currentUser.id)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        const container = document.getElementById('recent-transactions');

        if (!transactions || transactions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-inbox" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p class="mt-2">No hay transacciones recientes</p>
                </div>
            `;
            return;
        }

        container.innerHTML = transactions.map(t => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-3">
                    <div style="width: 45px; height: 45px; background-color: ${t.categories?.color || '#6366f1'}20; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i class="bi bi-${t.categories?.icon || 'wallet'}" style="font-size: 1.25rem; color: ${t.categories?.color || '#6366f1'};"></i>
                    </div>
                    <div>
                        <h6 class="mb-0">${t.description}</h6>
                        <small class="text-muted">
                            <i class="bi bi-tag"></i> ${t.categories?.name || 'Sin categoría'} •
                            <i class="bi bi-calendar"></i> ${formatDate(t.date)}
                        </small>
                    </div>
                </div>
                <div class="text-end">
                    <h6 class="mb-0 ${t.type === 'income' ? 'text-success' : 'text-danger'}">
                        ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                    </h6>
                </div>
            </div>
        `).join('');

        dashboardData.transactions = transactions;

    } catch (error) {
        console.error('Error cargando transacciones recientes:', error);
    }
}

/**
 * Carga los presupuestos mensuales
 */
async function loadMonthlyBudgets() {
    try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const { data: budgets, error } = await supabase
            .from('budgets')
            .select(`
                *,
                categories (name, color)
            `)
            .eq('user_id', currentUser.id)
            .gte('start_date', firstDayOfMonth.toISOString().split('T')[0])
            .lte('end_date', lastDayOfMonth.toISOString().split('T')[0])
            .limit(4);

        if (error) throw error;

        const container = document.getElementById('monthly-budgets');

        if (!budgets || budgets.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-pie-chart" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p class="mt-2">No hay presupuestos configurados</p>
                </div>
            `;
            return;
        }

        // Obtener gastos por categoría del mes
        const { data: expenses } = await supabase
            .from('transactions')
            .select('category_id, amount')
            .eq('user_id', currentUser.id)
            .eq('type', 'expense')
            .gte('date', firstDayOfMonth.toISOString().split('T')[0])
            .lte('date', lastDayOfMonth.toISOString().split('T')[0]);

        // Calcular gastos por categoría
        const expensesByCategory = {};
        expenses?.forEach(e => {
            if (!expensesByCategory[e.category_id]) {
                expensesByCategory[e.category_id] = 0;
            }
            expensesByCategory[e.category_id] += parseFloat(e.amount);
        });

        container.innerHTML = budgets.map(budget => {
            const spent = expensesByCategory[budget.category_id] || 0;
            const percentage = calculatePercentage(spent, budget.amount);
            const isOverBudget = percentage >= 100;
            const isWarning = percentage >= 80 && percentage < 100;

            return `
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <h6 class="mb-0">${budget.categories?.name || 'Sin categoría'}</h6>
                            <small class="text-muted">${formatCurrency(spent)} / ${formatCurrency(budget.amount)}</small>
                        </div>
                        <span class="badge ${isOverBudget ? 'badge-danger' : isWarning ? 'badge-warning' : 'badge-success'}">
                            ${percentage}%
                        </span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar ${isOverBudget ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-success'}" 
                             style="--bar-color: ${budget.categories?.color || '#6366f1'}; width: ${Math.min(percentage, 100)}%">
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        dashboardData.budgets = budgets;

    } catch (error) {
        console.error('Error cargando presupuestos:', error);
    }
}

/**
 * Carga las metas de ahorro
 */
async function loadSavingsGoals() {
    try {
        const { data: goals, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('status', 'active')
            .order('priority', { ascending: true })
            .limit(3);

        if (error) throw error;

        const container = document.getElementById('savings-goals');

        if (!goals || goals.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-4 text-muted">
                    <i class="bi bi-trophy" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p class="mt-2">No hay metas de ahorro configuradas</p>
                </div>
            `;
            return;
        }

        container.innerHTML = goals.map(goal => {
            const percentage = calculatePercentage(goal.current_amount, goal.target_amount);
            const remaining = goal.target_amount - goal.current_amount;
            const priorityColors = {
                'high': '#ef4444',
                'medium': '#f59e0b',
                'low': '#22c55e'
            };
            const priorityLabels = {
                'high': 'Alta',
                'medium': 'Media',
                'low': 'Baja'
            };

            return `
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h6 class="mb-1">${goal.name}</h6>
                                    <small class="text-muted">
                                        <i class="bi bi-calendar"></i> ${goal.deadline ? formatDate(goal.deadline, 'short') : 'Sin fecha límite'}
                                    </small>
                                </div>
                                <span class="badge" style="background-color: ${priorityColors[goal.priority]};">
                                    ${priorityLabels[goal.priority]}
                                </span>
                            </div>
                            <div class="mb-2">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <small class="text-muted">${formatCurrency(goal.current_amount)} de ${formatCurrency(goal.target_amount)}</small>
                                    <small class="fw-bold">${percentage}%</small>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar" style="--bar-color: ${priorityColors[goal.priority]}; width: ${percentage}%"></div>
                                </div>
                            </div>
                            <small class="text-muted">Faltan ${formatCurrency(remaining)}</small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        dashboardData.goals = goals;

    } catch (error) {
        console.error('Error cargando metas de ahorro:', error);
    }
}

/**
 * Recarga los datos del dashboard
 */
async function refreshDashboard() {
    await loadDashboardData();
    showToast('Dashboard actualizado', 'success');
}
