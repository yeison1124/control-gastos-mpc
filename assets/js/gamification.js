// ==============================================
// SISTEMA DE GAMIFICACIÓN
// ==============================================

let currentUser = null;
let gamificationData = {
    level: 1,
    xp: 0,
    points: 0,
    streak: 0,
    longestStreak: 0,
    lastActivity: null,
    achievements: [],
    challenges: [],
    stats: {}
};

// ==============================================
// DEFINICIONES
// ==============================================

const LEVELS = [
    { level: 1, name: 'Principiante', xpRequired: 0, icon: '🌱' },
    { level: 2, name: 'Aprendiz', xpRequired: 100, icon: '📚' },
    { level: 3, name: 'Intermedio', xpRequired: 300, icon: '💪' },
    { level: 4, name: 'Avanzado', xpRequired: 600, icon: '🎯' },
    { level: 5, name: 'Experto', xpRequired: 1000, icon: '⭐' },
    { level: 6, name: 'Maestro', xpRequired: 1500, icon: '👑' },
    { level: 7, name: 'Leyenda', xpRequired: 2500, icon: '🏆' }
];

const ACHIEVEMENTS = [
    // Primeros pasos
    { id: 'first_transaction', name: 'Primera Transacción', description: 'Registra tu primer gasto o ingreso', icon: '🎉', points: 10, xp: 20 },
    { id: 'first_week', name: 'Primera Semana', description: 'Usa la app durante 7 días consecutivos', icon: '📅', points: 25, xp: 50 },
    { id: 'first_budget', name: 'Primer Presupuesto', description: 'Crea tu primer presupuesto', icon: '💰', points: 15, xp: 30 },
    { id: 'first_goal', name: 'Primera Meta', description: 'Define tu primera meta de ahorro', icon: '🎯', points: 15, xp: 30 },

    // Transacciones
    { id: 'transactions_10', name: 'Organizador Inicial', description: 'Registra 10 transacciones', icon: '📊', points: 30, xp: 60 },
    { id: 'transactions_50', name: 'Contador Dedicado', description: 'Registra 50 transacciones', icon: '📈', points: 50, xp: 100 },
    { id: 'transactions_100', name: 'Maestro del Registro', description: 'Registra 100 transacciones', icon: '🏅', points: 100, xp: 200 },
    { id: 'transactions_500', name: 'Leyenda Financiera', description: 'Registra 500 transacciones', icon: '👑', points: 200, xp: 400 },

    // Racha
    { id: 'streak_3', name: 'Arrancando', description: '3 días consecutivos', icon: '🔥', points: 20, xp: 40 },
    { id: 'streak_7', name: 'Una Semana', description: '7 días consecutivos', icon: '🌟', points: 50, xp: 100 },
    { id: 'streak_30', name: 'Un Mes Completo', description: '30 días consecutivos', icon: '💎', points: 150, xp: 300 },
    { id: 'streak_90', name: 'Hábito Formado', description: '90 días consecutivos', icon: '🏆', points: 300, xp: 600 },

    // Presupuestos
    { id: 'budget_met', name: 'Presupuesto Cumplido', description: 'Cumple un presupuesto por primera vez', icon: '✅', points: 40, xp: 80 },
    { id: 'all_budgets_met', name: 'Control Total', description: 'Cumple todos tus presupuestos en un mes', icon: '🎖️', points: 100, xp: 200 },

    // Ahorro
    { id: 'saved_100', name: 'Primer Ahorro', description: 'Ahorra $100', icon: '🐷', points: 30, xp: 60 },
    { id: 'saved_1000', name: 'Ahorrador Serio', description: 'Ahorra $1,000', icon: '💵', points: 100, xp: 200 },
    { id: 'goal_reached', name: 'Meta Alcanzada', description: 'Alcanza una meta de ahorro', icon: '🎊', points: 75, xp: 150 },

    // Especiales
    { id: 'no_expenses_day', name: 'Día Sin Gastos', description: 'Pasa un día sin registrar gastos', icon: '🚫', points: 25, xp: 50 },
    { id: 'categorize_all', name: 'Organizado', description: 'Categoriza todas tus transacciones', icon: '📁', points: 50, xp: 100 },
    { id: 'recurring_setup', name: 'Automatizador', description: 'Configura 3 gastos recurrentes', icon: '🔄', points: 40, xp: 80 }
];

const CHALLENGES = [
    // Mensuales
    { id: 'monthly_budget', name: 'Presupuesto Mensual', description: 'No excedas tu presupuesto este mes', difficulty: 'medium', points: 100, xp: 200, type: 'monthly' },
    { id: 'daily_tracking', name: 'Registro Diario', description: 'Registra gastos todos los días del mes', difficulty: 'hard', points: 150, xp: 300, type: 'monthly' },
    { id: 'save_10_percent', name: 'Ahorro del 10%', description: 'Ahorra al menos 10% de tus ingresos', difficulty: 'medium', points: 100, xp: 200, type: 'monthly' },

    // Semanales
    { id: 'weekly_review', name: 'Revisión Semanal', description: 'Revisa tus gastos esta semana', difficulty: 'easy', points: 30, xp: 60, type: 'weekly' },
    { id: 'no_impulse', name: 'Compras Conscientes', description: 'No hagas compras impulsivas esta semana', difficulty: 'medium', points: 50, xp: 100, type: 'weekly' },

    // Diarios
    { id: 'morning_check', name: 'Chequeo Matutino', description: 'Revisa tu balance cada mañana', difficulty: 'easy', points: 10, xp: 20, type: 'daily' },
    { id: 'categorize_today', name: 'Todo Categorizado', description: 'Categoriza todos los gastos del día', difficulty: 'easy', points: 15, xp: 30, type: 'daily' }
];

// ==============================================
// INICIALIZACIÓN
// ==============================================

document.addEventListener('DOMContentLoaded', async function () {
    if (!await requireAuth()) return;
    currentUser = await getCurrentUser();

    await loadGamificationData();
    await checkAchievements();
    await updateStreak();
    renderAll();
});

async function loadGamificationData() {
    const stored = localStorage.getItem(`gamification_${currentUser.id}`);
    if (stored) {
        gamificationData = JSON.parse(stored);
    } else {
        gamificationData.lastActivity = new Date().toISOString().split('T')[0];
        saveGamificationData();
    }
}

function saveGamificationData() {
    localStorage.setItem(`gamification_${currentUser.id}`, JSON.stringify(gamificationData));
}

// ==============================================
// ACHIEVEMENTS
// ==============================================

async function checkAchievements() {
    try {
        // Get user data
        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', currentUser.id);

        const { data: budgets } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', currentUser.id);

        const { data: goals } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', currentUser.id);

        const transactionCount = transactions?.length || 0;
        const budgetCount = budgets?.length || 0;
        const goalCount = goals?.length || 0;

        // Check each achievement
        ACHIEVEMENTS.forEach(achievement => {
            if (gamificationData.achievements.includes(achievement.id)) return;

            let unlocked = false;

            switch (achievement.id) {
                case 'first_transaction':
                    unlocked = transactionCount >= 1;
                    break;
                case 'first_budget':
                    unlocked = budgetCount >= 1;
                    break;
                case 'first_goal':
                    unlocked = goalCount >= 1;
                    break;
                case 'transactions_10':
                    unlocked = transactionCount >= 10;
                    break;
                case 'transactions_50':
                    unlocked = transactionCount >= 50;
                    break;
                case 'transactions_100':
                    unlocked = transactionCount >= 100;
                    break;
                case 'transactions_500':
                    unlocked = transactionCount >= 500;
                    break;
                case 'streak_3':
                    unlocked = gamificationData.streak >= 3;
                    break;
                case 'streak_7':
                    unlocked = gamificationData.streak >= 7;
                    break;
                case 'streak_30':
                    unlocked = gamificationData.streak >= 30;
                    break;
                case 'streak_90':
                    unlocked = gamificationData.streak >= 90;
                    break;
                case 'first_week':
                    unlocked = gamificationData.streak >= 7;
                    break;
            }

            if (unlocked) {
                unlockAchievement(achievement);
            }
        });

    } catch (error) {
        console.error('Error checking achievements:', error);
    }
}

function unlockAchievement(achievement) {
    gamificationData.achievements.push(achievement.id);
    gamificationData.points += achievement.points;
    gamificationData.xp += achievement.xp;

    checkLevelUp();
    saveGamificationData();

    showToast(`🎉 ¡Logro desbloqueado! ${achievement.name} (+${achievement.points} pts)`, 'success');
}

function checkLevelUp() {
    const currentLevelData = LEVELS.find(l => l.level === gamificationData.level);
    const nextLevel = LEVELS.find(l => l.level === gamificationData.level + 1);

    if (nextLevel && gamificationData.xp >= nextLevel.xpRequired) {
        gamificationData.level = nextLevel.level;
        showToast(`🎊 ¡Subiste a nivel ${nextLevel.level}: ${nextLevel.name}!`, 'success');
    }
}

// ==============================================
// STREAK
// ==============================================

async function updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = gamificationData.lastActivity;

    if (!lastActivity) {
        gamificationData.streak = 1;
        gamificationData.lastActivity = today;
    } else {
        const lastDate = new Date(lastActivity);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Same day, no change
        } else if (diffDays === 1) {
            // Consecutive day
            gamificationData.streak++;
            gamificationData.lastActivity = today;

            if (gamificationData.streak > gamificationData.longestStreak) {
                gamificationData.longestStreak = gamificationData.streak;
            }
        } else {
            // Streak broken
            gamificationData.streak = 1;
            gamificationData.lastActivity = today;
        }
    }

    saveGamificationData();
}

// ==============================================
// RENDER
// ==============================================

function renderAll() {
    updateStats();
    renderAchievements();
    renderChallenges();
    renderStreak();
    renderLeaderboard();
}

function updateStats() {
    const currentLevelData = LEVELS.find(l => l.level === gamificationData.level) || LEVELS[0];
    const nextLevel = LEVELS.find(l => l.level === gamificationData.level + 1);

    document.getElementById('current-level').textContent = `${currentLevelData.icon} ${currentLevelData.name}`;
    document.getElementById('total-points').textContent = gamificationData.points;
    document.getElementById('total-points-display').textContent = gamificationData.points;
    document.getElementById('unlocked-count').textContent = gamificationData.achievements.length;
    document.getElementById('current-streak').textContent = gamificationData.streak;
    document.getElementById('challenges-completed').textContent = gamificationData.challenges.length;

    // Progress bar
    if (nextLevel) {
        const xpForCurrentLevel = currentLevelData.xpRequired;
        const xpForNextLevel = nextLevel.xpRequired;
        const xpProgress = gamificationData.xp - xpForCurrentLevel;
        const xpNeeded = xpForNextLevel - xpForCurrentLevel;
        const percentage = Math.min(100, (xpProgress / xpNeeded) * 100);

        document.getElementById('current-xp').textContent = gamificationData.xp;
        document.getElementById('next-level-xp').textContent = nextLevel.xpRequired;
        document.getElementById('level-progress-bar').style.width = percentage + '%';
        document.getElementById('progress-percentage').textContent = percentage.toFixed(0) + '%';
    } else {
        document.getElementById('current-xp').textContent = gamificationData.xp;
        document.getElementById('next-level-xp').textContent = 'MAX';
        document.getElementById('level-progress-bar').style.width = '100%';
        document.getElementById('progress-percentage').textContent = '100%';
    }

    document.getElementById('streak-display').textContent = gamificationData.streak;
}

function renderAchievements() {
    const container = document.getElementById('achievements-grid');

    container.innerHTML = ACHIEVEMENTS.map(achievement => {
        const unlocked = gamificationData.achievements.includes(achievement.id);

        return `
            <div class="col-md-4 col-lg-3">
                <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                    ${unlocked ? '<div class="position-absolute top-0 end-0 m-2"><i class="bi bi-check-circle-fill text-success fs-4 badge-shimmer"></i></div>' : ''}
                    <div class="achievement-icon ${unlocked ? '' : 'locked'}">
                        ${achievement.icon}
                    </div>
                    <h6 class="text-center mb-2">${achievement.name}</h6>
                    <p class="text-center text-muted small mb-2">${achievement.description}</p>
                    <div class="text-center">
                        <span class="badge bg-primary me-1">${achievement.points} pts</span>
                        <span class="badge bg-success">${achievement.xp} XP</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderChallenges() {
    const container = document.getElementById('challenges-list');

    container.innerHTML = CHALLENGES.map(challenge => {
        const completed = gamificationData.challenges.includes(challenge.id);
        const difficultyColors = {
            easy: 'success',
            medium: 'warning',
            hard: 'danger'
        };

        return `
            <div class="card challenge-card ${challenge.difficulty} mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col">
                            <h5 class="mb-1">
                                ${challenge.name}
                                ${completed ? '<i class="bi bi-check-circle-fill text-success ms-2"></i>' : ''}
                            </h5>
                            <p class="mb-2 text-muted">${challenge.description}</p>
                            <div>
                                <span class="badge bg-${difficultyColors[challenge.difficulty]}">${challenge.difficulty}</span>
                                <span class="badge bg-secondary">${challenge.type}</span>
                                <span class="badge bg-primary">${challenge.points} pts</span>
                                <span class="badge bg-success">${challenge.xp} XP</span>
                            </div>
                        </div>
                        <div class="col-auto">
                            ${!completed ? `<button class="btn btn-primary" onclick="completeChallenge('${challenge.id}')">Completar</button>` : '<span class="text-success fs-3"><i class="bi bi-trophy-fill"></i></span>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderStreak() {
    // Simple calendar showing streak
    const container = document.getElementById('streak-calendar');
    const today = new Date();

    let calendarHTML = '<div class="row g-2">';

    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        const hasActivity = i <= gamificationData.streak;

        calendarHTML += `
            <div class="col-auto">
                <div style="
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    background: ${hasActivity ? '#22c55e' : '#e2e8f0'};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                    font-size: 0.75rem;
                ">
                    ${date.getDate()}
                </div>
            </div>
        `;
    }

    calendarHTML += '</div>';
    calendarHTML += '<p class="text-muted text-center mt-3">Últimos 30 días - Verde = Activo</p>';

    container.innerHTML = calendarHTML;
}

function renderLeaderboard() {
    const container = document.getElementById('stats-grid');

    const stats = [
        { label: 'Racha Más Larga', value: `${gamificationData.longestStreak} días`, icon: 'fire', color: 'danger' },
        { label: 'Logros Desbloqueados', value: `${gamificationData.achievements.length}/${ACHIEVEMENTS.length}`, icon: 'trophy', color: 'warning' },
        { label: 'Nivel Actual', value: LEVELS.find(l => l.level === gamificationData.level)?.name || 'Principiante', icon: 'star', color: 'primary' },
        { label: 'Experiencia Total', value: `${gamificationData.xp} XP`, icon: 'lightning', color: 'success' },
        { label: 'Puntos Totales', value: gamificationData.points, icon: 'gem', color: 'info' },
        { label: 'Desafíos Completados', value: gamificationData.challenges.length, icon: 'check-circle', color: 'success' }
    ];

    container.innerHTML = stats.map(stat => `
        <div class="col-md-4">
            <div class="card">
                <div class="card-body text-center">
                    <i class="bi bi-${stat.icon} text-${stat.color} fs-1"></i>
                    <h3 class="mt-2 mb-0">${stat.value}</h3>
                    <small class="text-muted">${stat.label}</small>
                </div>
            </div>
        </div>
    `).join('');
}

// ==============================================
// CHALLENGES
// ==============================================

function completeChallenge(challengeId) {
    if (gamificationData.challenges.includes(challengeId)) {
        showToast('Ya completaste este desafío', 'info');
        return;
    }

    const challenge = CHALLENGES.find(c => c.id === challengeId);
    if (!challenge) return;

    gamificationData.challenges.push(challengeId);
    gamificationData.points += challenge.points;
    gamificationData.xp += challenge.xp;

    checkLevelUp();
    saveGamificationData();
    renderAll();

    showToast(`🎯 ¡Desafío completado! ${challenge.name} (+${challenge.points} pts)`, 'success');
}

// ==============================================
// PUBLIC FUNCTIONS
// ==============================================

window.completeChallenge = completeChallenge;
