// ==============================================
// ANÁLISIS AVANZADO CON GRÁFICOS INTERACTIVOS
// ==============================================

let currentUser = null;
let currentPeriod = 30; // días
let allTransactions = [];

// Charts instances
let incomeExpensesChart = null;
let categoriesChart = null;
let trendChart = null;

// Chart.js default configuration
Chart.defaults.font.family = 'Inter, sans-serif';
Chart.defaults.color = '#64748b';

// ==============================================
// INICIALIZACIÓN
// ==============================================

document.addEventListener('DOMContentLoaded', async function () {
    if (!await requireAuth()) return;
    currentUser = await getCurrentUser();

    initEventListeners();
    await loadAnalytics();
});

function initEventListeners() {
    // Period buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const period = this.getAttribute('data-period');
            currentPeriod = period === 'all' ? 'all' : parseInt(period);
            loadAnalytics();
        });
    });

    // Chart type toggle
    document.querySelectorAll('[data-chart-type]').forEach(btn => {
        btn.addEventListener('click', function () {
            const type = this.getAttribute('data-chart-type');
            this.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            createIncomeExpensesChart(type);
        });
    });

    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', loadAnalytics);
}

// ==============================================
// CARGAR DATOS DE SUPABASE
// ==============================================

async function loadAnalytics() {
    try {
        toggleLoader(true);

        // Calculate date range
        const endDate = new Date();
        let startDate;

        if (currentPeriod === 'all') {
            startDate = new Date('2020-01-01');
        } else {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - currentPeriod);
        }

        // Fetch transactions
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select(`
                *,
                categories(name, color, icon)
            `)
            .eq('user_id', currentUser.id)
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0])
            .order('date', { ascending: true });

        if (error) throw error;

        allTransactions = transactions || [];
        console.log(`📊 Loaded ${allTransactions.length} transactions`);

        // Process and render
        processAnalytics(allTransactions);
        renderAllCharts();

    } catch (error) {
        console.error('Error loading analytics:', error);
        showToast('Error cargando análisis', 'error');
    } finally {
        toggleLoader(false);
    }
}

// ==============================================
// PROCESAR DATOS
// ==============================================

function processAnalytics(transactions) {
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');

    const totalIncome = income.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const netIncome = totalIncome - totalExpenses;

    // Calculate daily average
    const days = currentPeriod === 'all' ? 365 : currentPeriod;
    const avgDaily = totalExpenses / days;

    // Update summary stats
    document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('net-income').textContent = formatCurrency(netIncome);
    document.getElementById('avg-daily').textContent = formatCurrency(avgDaily);
    document.getElementById('transaction-count').textContent = `${transactions.length} transacciones`;

    // Calculate trends (compare with previous period)
    calculateTrends(transactions);

    // Render top categories
    renderTopCategories(expenses);

    // Render category details
    renderCategoryDetails(expenses);
}

function calculateTrends(transactions) {
    const midPoint = Math.floor(transactions.length / 2);
    const firstHalf = transactions.slice(0, midPoint);
    const secondHalf = transactions.slice(midPoint);

    const firstIncome = firstHalf.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const secondIncome = secondHalf.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const firstExpense = firstHalf.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const secondExpense = secondHalf.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const incomeTrend = firstIncome > 0 ? ((secondIncome - firstIncome) / firstIncome * 100).toFixed(1) : 0;
    const expenseTrend = firstExpense > 0 ? ((secondExpense - firstExpense) / firstExpense * 100).toFixed(1) : 0;
    const netTrend = ((secondIncome - secondExpense) - (firstIncome - firstExpense)) / (firstIncome - firstExpense || 1) * 100;

    // Update trend badges
    updateTrendBadge('income-trend', incomeTrend);
    updateTrendBadge('expense-trend', expenseTrend);
    updateTrendBadge('net-trend', netTrend.toFixed(1));
}

function updateTrendBadge(id, value) {
    const badge = document.getElementById(id);
    const numValue = parseFloat(value);
    const icon = numValue >= 0 ? 'arrow-up' : 'arrow-down';
    const className = numValue >= 0 ? 'trend-up' : 'trend-down';

    badge.className = `stat-badge ${className}`;
    badge.innerHTML = `<i class="bi bi-${icon}"></i> ${Math.abs(numValue)}%`;
}

// ==============================================
// GRÁFICOS INTERACTIVOS
// ==============================================

function renderAllCharts() {
    createIncomeExpensesChart('bar');
    createCategoriesChart();
    createTrendChart();
}

function createIncomeExpensesChart(type = 'bar') {
    const canvas = document.getElementById('incomeExpensesChart');
    if (!canvas) return;

    //Agrupar por mes
    const monthlyData = {};
    allTransactions.forEach(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expenses: 0 };
        }

        if (t.type === 'income') {
            monthlyData[monthKey].income += parseFloat(t.amount);
        } else {
            monthlyData[monthKey].expenses += parseFloat(t.amount);
        }
    });

    const labels = Object.keys(monthlyData).sort();
    const incomeData = labels.map(l => monthlyData[l].income);
    const expensesData = labels.map(l => monthlyData[l].expenses);

    // Destroy previous chart
    if (incomeExpensesChart) {
        incomeExpensesChart.destroy();
    }

    // Create new chart
    incomeExpensesChart = new Chart(canvas, {
        type: type,
        data: {
            labels: labels.map(l => {
                const [year, month] = l.split('-');
                return new Date(year, month - 1).toLocaleDateString('es', { month: 'short', year: '2-digit' });
            }),
            datasets: [{
                label: 'Ingresos',
                data: incomeData,
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 2,
                fill: type === 'line',
                tension: 0.4
            }, {
                label: 'Gastos',
                data: expensesData,
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 2,
                fill: type === 'line',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            return ` ${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        },
                        footer: function (items) {
                            const income = items.find(i => i.dataset.label === 'Ingresos')?.parsed.y || 0;
                            const expenses = items.find(i => i.dataset.label === 'Gastos')?.parsed.y || 0;
                            const balance = income - expenses;
                            return `\nBalance: ${formatCurrency(balance)}`;
                        }
                    }
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x'
                    },
                    pan: {
                        enabled: true,
                        mode: 'x'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function createCategoriesChart() {
    const canvas = document.getElementById('categoriesChart');
    if (!canvas) return;

    const expenses = allTransactions.filter(t => t.type === 'expense');
    const categoryTotals = {};
    const categoryColors = {};

    expenses.forEach(t => {
        const catName = t.categories?.name || 'Sin categoría';
        const catColor = t.categories?.color || '#6b7280';
        categoryTotals[catName] = (categoryTotals[catName] || 0) + parseFloat(t.amount);
        categoryColors[catName] = catColor;
    });

    // Sort by amount and take top 5
    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topCategories = sorted.slice(0, 5);
    const othersTotal = sorted.slice(5).reduce((sum, [, amount]) => sum + amount, 0);

    if (othersTotal > 0) {
        topCategories.push(['Otros', othersTotal]);
        categoryColors['Otros'] = '#94a3b8';
    }

    const labels = topCategories.map(([name]) => name);
    const data = topCategories.map(([, amount]) => amount);
    const colors = labels.map(l => categoryColors[l]);

    // Destroy previous chart
    if (categoriesChart) {
        categoriesChart.destroy();
    }

    // Create new chart
    categoriesChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 3,
                borderColor: '#fff',
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        generateLabels: function (chart) {
                            const data = chart.data;
                            return data.labels.map((label, i) => ({
                                text: `${label}: ${formatCurrency(data.datasets[0].data[i])}`,
                                fillStyle: data.datasets[0].backgroundColor[i],
                                hidden: false,
                                index: i
                            }));
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return ` ${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const categoryName = labels[index];
                    drillDownCategory(categoryName);
                }
            }
        }
    });
}

function createTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;

    const expenses = allTransactions.filter(t => t.type === 'expense');

    // Group by day
    const dailyExpenses = {};
    expenses.forEach(t => {
        const dateKey = t.date;
        dailyExpenses[dateKey] = (dailyExpenses[dateKey] || 0) + parseFloat(t.amount);
    });

    const labels = Object.keys(dailyExpenses).sort();
    const data = labels.map(l => dailyExpenses[l]);

    // Calculate moving average (7 days)
    const movingAvg = [];
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - 6);
        const slice = data.slice(start, i + 1);
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
        movingAvg.push(avg);
    }

    // Simple linear regression for trend line
    const trendLine = calculateTrendLine(data);

    // Destroy previous chart
    if (trendChart) {
        trendChart.destroy();
    }

    // Create new chart
    trendChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels.map(l => new Date(l).toLocaleDateString('es', { month: 'short', day: 'numeric' })),
            datasets: [{
                label: 'Gastos Diarios',
                data: data,
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6
            }, {
                label: 'Media Móvil (7 días)',
                data: movingAvg,
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0.4,
                pointRadius: 0
            }, {
                label: 'Tendencia',
                data: trendLine,
                borderColor: 'rgba(168, 85, 247, 0.8)',
                borderWidth: 2,
                borderDash: [10, 5],
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            return ` ${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x'
                    },
                    pan: {
                        enabled: true,
                        mode: 'x'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// ==============================================
// UTILIDADES
// ==============================================

function calculateTrendLine(data) {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += data[i];
        sumXY += i * data[i];
        sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return data.map((_, i) => slope * i + intercept);
}

function renderTopCategories(expenses) {
    const container = document.getElementById('top-categories');

    const categoryTotals = {};
    const categoryColors = {};
    const categoryIcons = {};

    expenses.forEach(t => {
        const catName = t.categories?.name || 'Sin categoría';
        categoryTotals[catName] = (categoryTotals[catName] || 0) + parseFloat(t.amount);
        categoryColors[catName] = t.categories?.color || '#6b7280';
        categoryIcons[catName] = t.categories?.icon || 'wallet';
    });

    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);

    if (sorted.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No hay datos</p>';
        return;
    }

    container.innerHTML = sorted.map(([name, amount], index) => `
        <div class="category-item" onclick="drillDownCategory('${name}')">
            <div class="d-flex align-items-center gap-3">
                <div style="
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: ${categoryColors[name]};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                ">
                    <i class="bi bi-${categoryIcons[name]}"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>${name}</strong>
                        <span class="badge bg-primary">#${index + 1}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-1">
                        <small class="text-muted">${expenses.filter(e => e.categories?.name === name).length} transacciones</small>
                        <h6 class="mb-0 text-danger">${formatCurrency(amount)}</h6>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCategoryDetails(expenses) {
    const container = document.getElementById('category-details');

    const categoryData = {};
    expenses.forEach(t => {
        const catName = t.categories?.name || 'Sin categoría';
        if (!categoryData[catName]) {
            categoryData[catName] = {
                total: 0,
                count: 0,
                color: t.categories?.color || '#6b7280',
                icon: t.categories?.icon || 'wallet'
            };
        }
        categoryData[catName].total += parseFloat(t.amount);
        categoryData[catName].count++;
    });

    const sorted = Object.entries(categoryData).sort((a, b) => b[1].total - a[1].total);

    if (sorted.length === 0) {
        container.innerHTML = '<p class="text-muted text-center col-12">No hay datos</p>';
        return;
    }

    const total = sorted.reduce((sum, [, data]) => sum + data.total, 0);

    container.innerHTML = sorted.map(([name, data]) => {
        const percentage = ((data.total / total) * 100).toFixed(1);
        return `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 category-item" onclick="drillDownCategory('${name}')">
                    <div class="card-body">
                        <div class="d-flex align-items-center gap-3 mb-3">
                            <div style="
                                width: 50px;
                                height: 50px;
                                border-radius: 12px;
                                background: ${data.color};
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                font-size: 1.5rem;
                            ">
                                <i class="bi bi-${data.icon}"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="mb-0">${name}</h6>
                                <small class="text-muted">${data.count} trans.</small>
                            </div>
                        </div>
                        <h4 class="text-danger mb-2">${formatCurrency(data.total)}</h4>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar" style="width: ${percentage}%; background: ${data.color};"></div>
                        </div>
                        <div class="d-flex justify-content-between mt-2">
                            <small class="text-muted">${percentage}% del total</small>
                            <small class="text-muted">Prom: ${formatCurrency(data.total / data.count)}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function drillDownCategory(categoryName) {
    alert(`Próximamente: Análisis detallado de "${categoryName}"`);
    // TODO: Implementar modal con análisis detallado de la categoría
}
