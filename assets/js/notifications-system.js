// ==============================================
// SISTEMA DE NOTIFICACIONES INTELIGENTES
// ==============================================

let currentUser = null;
let notifications = [];
let budgetAlerts = [];
let reminders = [];
let insights = [];

// ==============================================
// INICIALIZACIÓN
// ==============================================

document.addEventListener('DOMContentLoaded', async function () {
    if (!await requireAuth()) return;
    currentUser = await getCurrentUser();

    await loadAllData();
    initEventListeners();
    startPeriodicChecks();
});

async function loadAllData() {
    try {
        toggleLoader(true);

        await Promise.all([
            loadNotifications(),
            checkBudgetAlerts(),
            loadReminders(),
            generateInsights()
        ]);

        updateStats();
        renderAllTabs();

    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error cargando notificaciones', 'error');
    } finally {
        toggleLoader(false);
    }
}

function initEventListeners() {
    document.getElementById('mark-all-read').addEventListener('click', markAllAsRead);
    document.getElementById('create-reminder-btn').addEventListener('click', showCreateReminderModal);
    document.getElementById('save-reminder-btn').addEventListener('click', saveReminder);
}

// ==============================================
// LOAD NOTIFICATIONS
// ==============================================

async function loadNotifications() {
    // Load from Supabase (in a real app)
    // For now, load from localStorage
    const stored = localStorage.getItem(`notifications_${currentUser.id}`);
    notifications = stored ? JSON.parse(stored) : [];

    // Sort by date
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function saveNotifications() {
    localStorage.setItem(`notifications_${currentUser.id}`, JSON.stringify(notifications));
}

function addNotification(notification) {
    notifications.unshift({
        id: Date.now().toString(),
        ...notification,
        createdAt: new Date().toISOString(),
        read: false
    });

    saveNotifications();
    updateStats();
    renderAllTabs();

    // Show toast
    if (notification.type === 'danger') {
        showToast(notification.title, 'error');
    } else if (notification.type === 'warning') {
        showToast(notification.title, 'warning');
    }
}

// ==============================================
// BUDGET ALERTS
// ==============================================

async function checkBudgetAlerts() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Get budgets
        const { data: budgets, error: budgetsError } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', currentUser.id)
            .gte('start_date', startOfMonth.toISOString().split('T')[0])
            .lte('end_date', endOfMonth.toISOString().split('T')[0]);

        if (budgetsError) throw budgetsError;

        // Get expenses for the month
        const { data: expenses, error: expensesError } = await supabase
            .from('transactions')
            .select('*, categories(name)')
            .eq('user_id', currentUser.id)
            .eq('type', 'expense')
            .gte('date', startOfMonth.toISOString().split('T')[0])
            .lte('date', endOfMonth.toISOString().split('T')[0]);

        if (expensesError) throw expensesError;

        budgetAlerts = [];

        if (!budgets || budgets.length === 0) {
            return;
        }

        // Check each budget
        budgets.forEach(budget => {
            const categoryExpenses = expenses?.filter(e =>
                e.category_id === budget.category_id
            ) || [];

            const totalSpent = categoryExpenses.reduce((sum, e) =>
                sum + parseFloat(e.amount), 0
            );

            const percentage = (totalSpent / budget.amount) * 100;
            const categoryName = categoryExpenses[0]?.categories?.name || 'General';

            budgetAlerts.push({
                budget,
                categoryName,
                totalSpent,
                percentage,
                remaining: budget.amount - totalSpent
            });

            // Create notifications for critical thresholds
            if (percentage >= 100 && !hasRecentNotification(`budget-exceeded-${budget.id}`)) {
                addNotification({
                    type: 'danger',
                    icon: 'exclamation-triangle-fill',
                    title: '¡Presupuesto Excedido!',
                    description: `Has excedido el presupuesto de ${categoryName} en un ${(percentage - 100).toFixed(1)}%`,
                    category: 'budget',
                    referenceId: `budget-exceeded-${budget.id}`
                });
            } else if (percentage >= 90 && percentage < 100 && !hasRecentNotification(`budget-90-${budget.id}`)) {
                addNotification({
                    type: 'warning',
                    icon: 'exclamation-circle-fill',
                    title: 'Presupuesto Casi Agotado',
                    description: `Has usado el ${percentage.toFixed(1)}% de tu presupuesto de ${categoryName}`,
                    category: 'budget',
                    referenceId: `budget-90-${budget.id}`
                });
            } else if (percentage >= 80 && percentage < 90 && !hasRecentNotification(`budget-80-${budget.id}`)) {
                addNotification({
                    type: 'warning',
                    icon: 'info-circle-fill',
                    title: 'Alerta de Presupuesto',
                    description: `Has usado el ${percentage.toFixed(1)}% de tu presupuesto de ${categoryName}`,
                    category: 'budget',
                    referenceId: `budget-80-${budget.id}`
                });
            }
        });

    } catch (error) {
        console.error('Error checking budget alerts:', error);
    }
}

function hasRecentNotification(referenceId) {
    // Check if notification was created in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    return notifications.some(n =>
        n.referenceId === referenceId &&
        new Date(n.createdAt) > oneDayAgo
    );
}

// ==============================================
// REMINDERS
// ==============================================

async function loadReminders() {
    const stored = localStorage.getItem(`reminders_${currentUser.id}`);
    reminders = stored ? JSON.parse(stored) : [];

    // Check for due reminders
    const today = new Date().toISOString().split('T')[0];

    reminders.forEach(reminder => {
        if (reminder.date === today && !reminder.notified) {
            addNotification({
                type: 'info',
                icon: 'clock-fill',
                title: 'Recordatorio: ' + reminder.title,
                description: reminder.description || 'Revisa tus pendientes',
                category: 'reminder',
                referenceId: `reminder-${reminder.id}`
            });

            reminder.notified = true;
        }

        // Check overdue
        if (reminder.date < today && !reminder.completed) {
            reminder.overdue = true;
        }

        // Handle recurring reminders
        if (reminder.recurring && reminder.notified && reminder.date < today) {
            // Create next month's reminder
            const nextDate = new Date(reminder.date);
            nextDate.setMonth(nextDate.getMonth() + 1);
            reminder.date = nextDate.toISOString().split('T')[0];
            reminder.notified = false;
        }
    });

    saveReminders();
}

function saveReminders() {
    localStorage.setItem(`reminders_${currentUser.id}`, JSON.stringify(reminders));
}

function showCreateReminderModal() {
    const modal = new bootstrap.Modal(document.getElementById('createReminderModal'));
    modal.show();
}

async function saveReminder() {
    const title = document.getElementById('reminder-title').value.trim();
    const description = document.getElementById('reminder-description').value.trim();
    const date = document.getElementById('reminder-date').value;
    const type = document.getElementById('reminder-type').value;
    const recurring = document.getElementById('reminder-recurring').checked;

    if (!title || !date) {
        showToast('Completa los campos obligatorios', 'warning');
        return;
    }

    const reminder = {
        id: Date.now().toString(),
        title,
        description,
        date,
        type,
        recurring,
        completed: false,
        notified: false,
        createdAt: new Date().toISOString()
    };

    reminders.push(reminder);
    saveReminders();

    showToast('Recordatorio creado exitosamente', 'success');

    const modal = bootstrap.Modal.getInstance(document.getElementById('createReminderModal'));
    modal.hide();

    document.getElementById('reminder-form').reset();
    renderReminders();
    updateStats();
}

function completeReminder(id) {
    const reminder = reminders.find(r => r.id === id);
    if (reminder) {
        reminder.completed = true;
        saveReminders();
        renderReminders();
        updateStats();
        showToast('Recordatorio completado', 'success');
    }
}

function deleteReminder(id) {
    if (confirm('¿Eliminar este recordatorio?')) {
        reminders = reminders.filter(r => r.id !== id);
        saveReminders();
        renderReminders();
        updateStats();
        showToast('Recordatorio eliminado', 'success');
    }
}

// ==============================================
// INSIGHTS (Gastos Inusuales, Patrones)
// ==============================================

async function generateInsights() {
    try {
        insights = [];

        // Get last 60 days of transactions
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*, categories(name)')
            .eq('user_id', currentUser.id)
            .eq('type', 'expense')
            .gte('date', sixtyDaysAgo.toISOString().split('T')[0])
            .order('date', { ascending: false });

        if (error) throw error;

        if (!transactions || transactions.length === 0) {
            return;
        }

        // 1. Detect unusual spending
        detectUnusualSpending(transactions);

        // 2. Spending patterns
        detectSpendingPatterns(transactions);

        // 3. Category trends
        analyzeCategoryTrends(transactions);

        // 4. Savings opportunities
        findSavingsOpportunities(transactions);

    } catch (error) {
        console.error('Error generating insights:', error);
    }
}

function detectUnusualSpending(transactions) {
    // Calculate average and standard deviation
    const amounts = transactions.map(t => parseFloat(t.amount));
    const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // Find transactions > 2 standard deviations above average
    const recentUnusual = transactions.filter(t => {
        const amount = parseFloat(t.amount);
        return amount > (avg + 2 * stdDev);
    }).slice(0, 3); // Top 3

    recentUnusual.forEach(t => {
        const percentAboveAvg = ((parseFloat(t.amount) - avg) / avg * 100).toFixed(0);

        insights.push({
            type: 'warning',
            icon: 'graph-up-arrow',
            title: 'Gasto Inusual Detectado',
            description: `Gastaste ${formatCurrency(t.amount)} en ${t.categories?.name || 'Sin categoría'} el ${formatDate(t.date)}, ${percentAboveAvg}% más que tu promedio`,
            category: 'unusual'
        });
    });
}

function detectSpendingPatterns(transactions) {
    // Group by day of week
    const byDayOfWeek = {};
    transactions.forEach(t => {
        const day = new Date(t.date).getDay();
        byDayOfWeek[day] = (byDayOfWeek[day] || 0) + parseFloat(t.amount);
    });

    // Find highest spending day
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    let maxDay = 0;
    let maxAmount = 0;

    Object.entries(byDayOfWeek).forEach(([day, amount]) => {
        if (amount > maxAmount) {
            maxAmount = amount;
            maxDay = parseInt(day);
        }
    });

    if (maxAmount > 0) {
        insights.push({
            type: 'info',
            icon: 'calendar-week',
            title: 'Patrón de Gastos Identificado',
            description: `Tiendes a gastar más los ${days[maxDay]}s (${formatCurrency(maxAmount)} en total)`,
            category: 'pattern'
        });
    }
}

function analyzeCategoryTrends(transactions) {
    // Get last 30 days vs previous 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recent = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    const previous = transactions.filter(t => new Date(t.date) < thirtyDaysAgo);

    // Group by category
    const recentByCategory = {};
    const previousByCategory = {};

    recent.forEach(t => {
        const cat = t.categories?.name || 'Sin categoría';
        recentByCategory[cat] = (recentByCategory[cat] || 0) + parseFloat(t.amount);
    });

    previous.forEach(t => {
        const cat = t.categories?.name || 'Sin categoría';
        previousByCategory[cat] = (previousByCategory[cat] || 0) + parseFloat(t.amount);
    });

    // Find categories with significant increase
    Object.entries(recentByCategory).forEach(([category, amount]) => {
        const previousAmount = previousByCategory[category] || 0;

        if (previousAmount > 0) {
            const increase = ((amount - previousAmount) / previousAmount) * 100;

            if (increase > 50) { // 50% increase
                insights.push({
                    type: 'warning',
                    icon: 'trending-up',
                    title: 'Aumento en Categoría',
                    description: `Tus gastos en ${category} aumentaron ${increase.toFixed(0)}% este mes`,
                    category: 'trend'
                });
            } else if (increase < -30) { // 30% decrease
                insights.push({
                    type: 'success',
                    icon: 'trending-down',
                    title: 'Reducción en Categoría',
                    description: `¡Bien hecho! Redujiste gastos en ${category} en un ${Math.abs(increase).toFixed(0)}%`,
                    category: 'trend'
                });
            }
        }
    });
}

function findSavingsOpportunities(transactions) {
    // Find recurring small expenses that add up
    const descriptionCounts = {};

    transactions.forEach(t => {
        const desc = t.description?.toLowerCase() || '';
        if (desc) {
            if (!descriptionCounts[desc]) {
                descriptionCounts[desc] = { count: 0, total: 0 };
            }
            descriptionCounts[desc].count++;
            descriptionCounts[desc].total += parseFloat(t.amount);
        }
    });

    // Find patterns that occur 4+ times
    Object.entries(descriptionCounts).forEach(([desc, data]) => {
        if (data.count >= 4 && data.total > 100) {
            insights.push({
                type: 'info',
                icon: 'piggy-bank',
                title: 'Oportunidad de Ahorro',
                description: `Gastas frecuentemente en "${desc}" (${data.count} veces, ${formatCurrency(data.total)} total). ¿Podrías reducirlo?`,
                category: 'savings'
            });
        }
    });
}

// ==============================================
// UPDATE STATS
// ==============================================

function updateStats() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const activeAlerts = budgetAlerts.filter(b => b.percentage >= 80).length;
    const overdueReminders = reminders.filter(r => r.overdue && !r.completed).length;
    const upcomingReminders = reminders.filter(r => {
        const reminderDate = new Date(r.date);
        const today = new Date();
        const diff = (reminderDate - today) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff <= 7 && !r.completed;
    }).length;

    document.getElementById('total-notifications').textContent = notifications.length;
    document.getElementById('active-alerts').textContent = activeAlerts;
    document.getElementById('overdue-reminders').textContent = overdueReminders;
    document.getElementById('upcoming-reminders').textContent = upcomingReminders;

    // Update tab counts
    document.getElementById('all-count').textContent = notifications.length;
    document.getElementById('budget-count').textContent = budgetAlerts.length;
    document.getElementById('reminder-count').textContent = reminders.length;
    document.getElementById('insight-count').textContent = insights.length;
}

// ==============================================
// RENDER TABS
// ==============================================

function renderAllTabs() {
    renderAllNotifications();
    renderBudgetAlerts();
    renderReminders();
    renderInsights();
}

function renderAllNotifications() {
    const container = document.getElementById('all-notifications-list');

    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-bell-slash"></i>
                <h5 class="mt-3">No hay notificaciones</h5>
                <p class="text-muted">Cuando tengas alertas o recordatorios aparecerán aquí</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notifications.map(n => `
        <div class="notification-item ${n.type} ${n.read ? '' : 'unread'}" onclick="markAsRead('${n.id}')">
            <div class="row align-items-center">
                <div class="col-auto">
                    <div class="notification-icon ${n.type}">
                        <i class="bi bi-${n.icon || 'bell-fill'}"></i>
                    </div>
                </div>
                <div class="col">
                    <h6 class="mb-1">${n.title}</h6>
                    <p class="mb-1 small text-muted">${n.description}</p>
                    <small class="text-muted">
                        <i class="bi bi-clock me-1"></i>${formatRelativeTime(n.createdAt)}
                    </small>
                </div>
                ${!n.read ? '<div class="col-auto"><span class="badge bg-primary">Nueva</span></div>' : ''}
            </div>
        </div>
    `).join('');
}

function renderBudgetAlerts() {
    const progressContainer = document.getElementById('budget-progress');
    const alertsContainer = document.getElementById('budget-alerts-list');

    if (budgetAlerts.length === 0) {
        progressContainer.innerHTML = '';
        alertsContainer.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-pie-chart"></i>
                <h5 class="mt-3">No hay presupuestos configurados</h5>
                <p class="text-muted">Crea presupuestos para recibir alertas</p>
                <button class="btn btn-primary mt-2" onclick="navigateTo('budgets.html')">Ir a Presupuestos</button>
            </div>
        `;
        return;
    }

    // Render progress circles
    progressContainer.innerHTML = budgetAlerts.map(alert => {
        const color = alert.percentage >= 100 ? '#ef4444' :
            alert.percentage >= 80 ? '#f59e0b' : '#22c55e';

        return `
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body text-center">
                        <h6>${alert.categoryName}</h6>
                        ${createProgressRing(alert.percentage, color)}
                        <p class="mt-3 mb-1"><strong>${formatCurrency(alert.totalSpent)}</strong> de ${formatCurrency(alert.budget.amount)}</p>
                        <small class="text-muted">Restante: ${formatCurrency(Math.max(0, alert.remaining))}</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Render alert list
    const criticalAlerts = budgetAlerts.filter(a => a.percentage >= 80);

    if (criticalAlerts.length === 0) {
        alertsContainer.innerHTML = '<p class="text-success text-center"><i class="bi bi-check-circle me-2"></i>Todos los presupuestos están dentro del límite</p>';
    } else {
        alertsContainer.innerHTML = criticalAlerts.map(alert => `
            <div class="notification-item ${alert.percentage >= 100 ? 'danger' : 'warning'}">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <div class="notification-icon ${alert.percentage >= 100 ? 'danger' : 'warning'}">
                            <i class="bi bi-exclamation-triangle-fill"></i>
                        </div>
                    </div>
                    <div class="col">
                        <h6 class="mb-1">${alert.categoryName}</h6>
                        <p class="mb-1 small">Has usado el ${alert.percentage.toFixed(1)}% de tu presupuesto</p>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar ${alert.percentage >= 100 ? 'bg-danger' : 'bg-warning'}" style="width: ${Math.min(100, alert.percentage)}%"></div>
                        </div>
                    </div>
                    <div class="col-auto">
                        <h5 class="mb-0 ${alert.percentage >= 100 ? 'text-danger' : 'text-warning'}">${alert.percentage.toFixed(0)}%</h5>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function createProgressRing(percentage, color) {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

    return `
        <div class="progress-ring mx-auto" style="width: 120px; height: 120px;">
            <svg width="120" height="120">
                <circle class="progress-ring-bg" cx="60" cy="60" r="${radius}"></circle>
                <circle 
                    class="progress-ring-fill" 
                    cx="60" 
                    cy="60" 
                    r="${radius}"
                    stroke="${color}"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${offset}"
                ></circle>
                <text x="60" y="65" text-anchor="middle" font-size="24" font-weight="bold" fill="${color}">
                    ${percentage.toFixed(0)}%
                </text>
            </svg>
        </div>
    `;
}

function renderReminders() {
    const container = document.getElementById('reminders-list');

    const activeReminders = reminders.filter(r => !r.completed);

    if (activeReminders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-calendar-check"></i>
                <h5 class="mt-3">No hay recordatorios</h5>
                <p class="text-muted">Crea recordatorios para mantenerte organizado</p>
            </div>
        `;
        return;
    }

    container.innerHTML = activeReminders.map(r => `
        <div class="reminder-item ${r.overdue ? 'overdue' : ''}">
            <div class="row align-items-center">
                <div class="col-auto">
                    <i class="bi bi-${getReminderIcon(r.type)} fs-3 ${r.overdue ? 'text-danger' : 'text-primary'}"></i>
                </div>
                <div class="col">
                    <h6 class="mb-1">
                        ${r.title}
                        ${r.recurring ? '<i class="bi bi-arrow-repeat ms-2 small text-muted"></i>' : ''}
                    </h6>
                    ${r.description ? `<p class="mb-1 small text-muted">${r.description}</p>` : ''}
                    <small class="${r.overdue ? 'text-danger' : 'text-muted'}">
                        <i class="bi bi-calendar me-1"></i>${formatDate(r.date)}
                        ${r.overdue ? ' - Vencido' : ''}
                    </small>
                </div>
                <div class="col-auto">
                    <button class="btn btn-sm btn-success me-2" onclick="completeReminder('${r.id}')">
                        <i class="bi bi-check"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteReminder('${r.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function getReminderIcon(type) {
    const icons = {
        payment: 'credit-card',
        bill: 'receipt',
        goal: 'trophy',
        other: 'clock'
    };
    return icons[type] || 'clock';
}

function renderInsights() {
    const container = document.getElementById('insights-list');

    if (insights.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-lightbulb"></i>
                <h5 class="mt-3">No hay insights disponibles</h5>
                <p class="text-muted">Necesitas más transacciones para generar insights</p>
            </div>
        `;
        return;
    }

    container.innerHTML = insights.map(insight => `
        <div class="notification-item ${insight.type}">
            <div class="row align-items-center">
                <div class="col-auto">
                    <div class="notification-icon ${insight.type}">
                        <i class="bi bi-${insight.icon}"></i>
                    </div>
                </div>
                <div class="col">
                    <h6 class="mb-1">${insight.title}</h6>
                    <p class="mb-0 small">${insight.description}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// ==============================================
// ACTIONS
// ==============================================

function markAsRead(id) {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
        notification.read = true;
        saveNotifications();
        renderAllNotifications();
        updateStats();
    }
}

function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    saveNotifications();
    renderAllNotifications();
    updateStats();
    showToast('Todas las notificaciones marcadas como leídas', 'success');
}

// ==============================================
// PERIODIC CHECKS
// ==============================================

function startPeriodicChecks() {
    // Check every 5 minutes
    setInterval(async () => {
        await checkBudgetAlerts();
        await loadReminders();
        await generateInsights();
        updateStats();
        renderAllTabs();
    }, 5 * 60 * 1000);
}

// ==============================================
// UTILITIES
// ==============================================

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return formatDate(dateString);
}
