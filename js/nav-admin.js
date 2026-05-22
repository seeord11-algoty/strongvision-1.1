document.addEventListener('DOMContentLoaded', () => {
    if (!SV_AUTH.haySesion()) return;
    const usuario = SV_STORAGE.obtenerUsuarioActual();
    if (!usuario) return;

    // Mostrar enlace admin si aplica
    if (usuario.rol === 'admin') {
        document.querySelectorAll('.admin-only-link').forEach(el => { el.style.display = ''; });
    }

    // Verificar si el perfil físico está completo
    const perfil = SV_STORAGE.obtenerPerfil(usuario.id);
    const perfilCompleto = !!(
        perfil &&
        perfil.edad &&
        perfil.genero &&
        perfil.peso &&
        perfil.altura &&
        perfil.nivel &&
        perfil.objetivo &&
        perfil.dias_por_semana
    );

    // Ocultar navegación si el perfil no está completo
    const navTabs = document.querySelector('.sb-nav') || document.querySelector('.app-nav-tabs');
    if (navTabs) {
        navTabs.style.display = perfilCompleto ? '' : 'none';
    }

    // Redirigir páginas restringidas si el perfil no está completo
    if (!perfilCompleto) {
        const paginasRestringidas = ['rutina.html', 'entrenamiento.html', 'progreso.html', 'biblioteca.html'];
        const paginaActual = window.location.pathname.split('/').pop();
        if (paginasRestringidas.includes(paginaActual)) {
            window.location.href = 'perfil.html?onboarding=1';
            return;
        }

        // Mostrar banner en dashboard y perfil indicando que deben completar el perfil
        const paginaActualNombre = window.location.pathname.split('/').pop();
        if (paginaActualNombre === 'dashboard.html' || paginaActualNombre === 'perfil.html') {
            const banner = document.createElement('div');
            banner.style.cssText = `
                position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
                background: var(--color-primary); color: #fff;
                padding: 0.65rem 1.2rem; border-radius: 999px;
                font-size: 0.82rem; font-weight: 600;
                box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                z-index: 9999; white-space: nowrap;
                animation: fadeInUp 0.3s ease;
            `;
            const _isEN = (localStorage.getItem('sv_lang') || 'es-CO') === 'en-US';
            banner.innerHTML = _isEN ? '📋 Complete your physical profile to access all features' : '📋 Completa tu perfil físico para acceder a todas las funciones';
            banner.onclick = () => window.location.href = 'perfil.html?onboarding=1';
            banner.style.cursor = 'pointer';
            document.body.appendChild(banner);

            // Ocultar automáticamente después de 5s
            setTimeout(() => {
                banner.style.opacity = '0';
                banner.style.transition = 'opacity 0.4s';
                setTimeout(() => banner.remove(), 400);
            }, 5000);
        }
    }
});
