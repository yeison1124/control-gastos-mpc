// ============================================
// AUTENTICACIÓN CON SUPABASE
// ============================================

/**
 * Maneja el login de usuarios
 */
async function handleLogin(email, password) {
    try {
        toggleLoader(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        showToast('¡Bienvenido de nuevo!', 'success');

        // Redirigir al dashboard
        setTimeout(() => {
            navigateTo('dashboard.html');
        }, 500);

        return data;

    } catch (error) {
        console.error('Error en login:', error);
        // Mensaje genérico para el usuario
        showToast('Email o contraseña incorrectos. Por favor intenta de nuevo.', 'error');
        throw error;
    } finally {
        toggleLoader(false);
    }
}

/**
 * Maneja el registro de nuevos usuarios
 */
async function handleRegister(email, password, fullName) {
    try {
        toggleLoader(true);

        // Crear usuario en Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (error) throw error;

        // El perfil se crea automáticamente con el trigger
        // Esperar un momento para que se cree
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Crear categorías predeterminadas para el nuevo usuario
        await createDefaultCategories(data.user.id);

        showToast('Cuenta creada exitosamente. ¡Bienvenido!', 'success');

        // Redirigir al dashboard
        setTimeout(() => {
            navigateTo('dashboard.html');
        }, 1000);

        return data;

    } catch (error) {
        console.error('Error en registro:', error);
        // Mensaje genérico para el usuario
        showToast('No se pudo crear la cuenta. Por favor verifica tus datos e intenta de nuevo.', 'error');
        throw error;
    } finally {
        toggleLoader(false);
    }
}

/**
 * Crea categorías predeterminadas para un nuevo usuario
 */
async function createDefaultCategories(userId) {
    try {
        const categories = DEFAULT_CATEGORIES.map(cat => ({
            ...cat,
            user_id: userId
        }));

        const { error } = await supabase
            .from('categories')
            .insert(categories);

        if (error) throw error;

        console.log('Categorías predeterminadas creadas');

    } catch (error) {
        console.error('Error creando categorías predeterminadas:', error);
        // No lanzar error, las categorías se pueden crear después
    }
}

/**
 * Maneja el inicio de sesión con Google
 */
async function handleGoogleLogin() {
    try {
        toggleLoader(true);

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dashboard.html',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        });

        if (error) throw error;

        // La redirección se maneja automáticamente por Supabase
        showToast('Redirigiendo a Google...', 'info');

    } catch (error) {
        console.error('Error en login con Google:', error);
        showToast('No se pudo iniciar sesión con Google. Intenta de nuevo.', 'error');
        toggleLoader(false);
        throw error;
    }
}

/**
 * Maneja el inicio de sesión con Facebook
 */
async function handleFacebookLogin() {
    try {
        toggleLoader(true);

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
                redirectTo: window.location.origin + '/dashboard.html',
                scopes: 'email'
            }
        });

        if (error) throw error;

        // La redirección se maneja automáticamente por Supabase
        showToast('Redirigiendo a Facebook...', 'info');

    } catch (error) {
        console.error('Error en login con Facebook:', error);
        showToast('No se pudo iniciar sesión con Facebook. Intenta de nuevo.', 'error');
        toggleLoader(false);
        throw error;
    }
}

/**
 * Maneja el callback de OAuth después de la autenticación
 * Llama a esta función en las páginas donde se redirige después del OAuth
 */
async function handleOAuthCallback() {
    try {
        // Obtener el usuario actual
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) throw error;

        if (user) {
            // Verificar si es un nuevo usuario (primera vez que inicia sesión)
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            // Si el perfil no existe o no tiene categorías, crear categorías predeterminadas
            if (profile) {
                const { data: categories } = await supabase
                    .from('categories')
                    .select('id')
                    .eq('user_id', user.id)
                    .limit(1);

                if (!categories || categories.length === 0) {
                    await createDefaultCategories(user.id);
                }
            }

            showToast('¡Bienvenido!', 'success');
        }
    } catch (error) {
        console.error('Error en callback de OAuth:', error);
    }
}

/**
 * Maneja la recuperación de contraseña
 */
async function handlePasswordReset(email) {
    try {
        toggleLoader(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });

        if (error) throw error;

        showToast('Se ha enviado un correo para restablecer tu contraseña', 'success');

        return true;

    } catch (error) {
        console.error('Error en recuperación de contraseña:', error);
        showToast('No se pudo enviar el correo de recuperación. Verifica tu email e intenta de nuevo.', 'error');
        throw error;
    } finally {
        toggleLoader(false);
    }
}

/**
 * Verifica si el usuario está autenticado y redirige si no lo está
 */
async function requireAuthentication() {
    const user = await checkAuth();

    if (!user) {
        // Guardar la página actual para redirigir después del login (opcional)
        // localStorage.setItem('redirectAfterLogin', window.location.pathname);
        showToast('Debes iniciar sesión para acceder', 'warning');
        navigateTo('index.html');
        return false;
    }

    return true;
}

/**
 * Obtiene el usuario actual
 */
async function getCurrentUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        return null;
    }
}

/**
 * Obtiene el perfil completo del usuario
 */
async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        return data;

    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        return null;
    }
}

/**
 * Actualiza el perfil del usuario
 */
async function updateUserProfile(userId, updates) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;

        showToast('Perfil actualizado exitosamente', 'success');
        return data;

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        showToast('No se pudo actualizar el perfil. Intenta de nuevo.', 'error');
        throw error;
    }
}

// ============================================
// LISTENERS DE CAMBIOS DE AUTENTICACIÓN
// ============================================

// Escuchar cambios en el estado de autenticación
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);

    if (event === 'SIGNED_IN') {
        console.log('Usuario autenticado:', session.user.email);
    } else if (event === 'SIGNED_OUT') {
        console.log('Usuario cerró sesión');
    } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refrescado');
    }
});
