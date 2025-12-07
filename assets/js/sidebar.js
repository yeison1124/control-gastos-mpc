// ============================================
// GESTIÓN DEL SIDEBAR
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const currentPage = window.location.pathname.split('/').pop();

    // Destacar página activa
    highlightActivePage(currentPage);

    // Toggle sidebar en móvil
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            sidebar?.classList.toggle('active');
            sidebarOverlay?.classList.toggle('active');
        });
    }

    // Cerrar sidebar al hacer click en overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function () {
            sidebar?.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    // Cerrar sidebar al navegar (en móvil)
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function () {
            if (window.innerWidth <= 768) {
                sidebar?.classList.remove('active');
                sidebarOverlay?.classList.remove('active');
            }
        });
    });

    // Cargar información del usuario
    loadUserInfo();

    // Evento de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

/**
 * Resalta la página activa en el sidebar
 */
function highlightActivePage(currentPage) {
    const navLinks = document.querySelectorAll('.sidebar-nav a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');

        // Remover clase active de todos
        link.classList.remove('active');

        // Agregar clase active al link correspondiente
        if (href === currentPage) {
            link.classList.add('active');
        }

        // Caso especial para dashboard (index o sin página)
        if ((currentPage === 'dashboard.html' || currentPage === '') && href === 'dashboard.html') {
            link.classList.add('active');
        }
    });
}

/**
 * Carga la información del usuario en el sidebar
 */
async function loadUserInfo() {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        // Si no hay usuario (modo demo), usar datos por defecto
        if (!user) {
            // Actualizar nombre de usuario
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = 'Usuario Demo';
            }

            // Actualizar email
            const userEmailElement = document.getElementById('user-email');
            if (userEmailElement) {
                userEmailElement.textContent = 'demo@preview.com';
            }

            // Actualizar avatar (iniciales)
            const userAvatarElement = document.getElementById('user-avatar');
            if (userAvatarElement) {
                userAvatarElement.textContent = 'UD';
            }
            return;
        }

        // Cargar perfil del usuario (solo si hay usuario autenticado)
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .single();

        // Actualizar nombre de usuario
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = profile?.full_name || user.email.split('@')[0];
        }

        // Actualizar email
        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement) {
            userEmailElement.textContent = user.email;
        }

        // Actualizar avatar (iniciales)
        const userAvatarElement = document.getElementById('user-avatar');
        if (userAvatarElement) {
            const name = profile?.full_name || user.email;
            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            userAvatarElement.textContent = initials;
        }

    } catch (error) {
        console.error('Error cargando información del usuario:', error);
        // En caso de error, mostrar datos demo
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) userNameElement.textContent = 'Usuario Demo';

        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement) userEmailElement.textContent = 'demo@preview.com';

        const userAvatarElement = document.getElementById('user-avatar');
        if (userAvatarElement) userAvatarElement.textContent = 'UD';
    }
}

/**
 * Maneja el cierre de sesión
 */
async function handleLogout() {
    try {
        toggleLoader(true);

        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        showToast('Sesión cerrada exitosamente', 'success');

        // Redirigir al login
        setTimeout(() => {
            navigateTo('index.html');
        }, 500);

    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showToast('Error al cerrar sesión: ' + error.message, 'error');
    } finally {
        toggleLoader(false);
    }
}
