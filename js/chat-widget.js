/**
 * StrongVision — Floating Chat Widget
 * Burbuja flotante del asistente IA.
 */
(function () {
    'use strict';

    function init() {
        // Guardia: solo en páginas del app con sesión activa
        if (!window.SV_AUTH || !window.SV_STORAGE) return;
        if (!SV_AUTH.haySesion()) return;

        const usuario = SV_STORAGE.obtenerUsuarioActual();
        if (!usuario) return;

        // Evitar doble instancia
        if (document.getElementById('chatWidget')) return;

        const _isEN = (localStorage.getItem('sv_lang') || 'es-CO') === 'en-US';
        const _L = (es, en) => _isEN ? en : es;

        const N8N_CHAT = 'https://svfitness.app.n8n.cloud/webhook/strongvision-chat';

        // ── Inyectar HTML ─────────────────────────────────────
        const wrapper = document.createElement('div');
        wrapper.id = 'chatWidget';
        wrapper.innerHTML = `
            <div id="svChatPanel" class="chat-widget-panel hidden">
                <div class="chat-widget-header">
                    <div class="chat-widget-avatar"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="14" x2="22" y2="14"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="14" x2="4" y2="14"/></svg></div>
                    <div class="chat-widget-info">
                        <div class="cw-name">${_L('Asistente IA', 'AI Assistant')}</div>
                        <div class="cw-status">
                            <span class="cw-dot"></span>
                            ${_L('En línea', 'Online')}
                        </div>
                    </div>
                    <button class="chat-widget-close" id="svChatClose" aria-label="${_L('Cerrar chat', 'Close chat')}">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="chat-widget-messages" id="svChatMsgs"></div>
                <div class="chat-widget-suggestions" id="svChatSug" style="display:none;"></div>
                <form class="chat-widget-input" id="svChatForm" autocomplete="off">
                    <input type="text" id="svChatInput" placeholder="${_L('Pregunta algo…', 'Ask something…')}" autocomplete="off" maxlength="300">
                    <button type="submit" aria-label="${_L('Enviar', 'Send')}">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                </form>
            </div>
            <div id="svChatFabRow">
                <button id="svChatBubble" aria-label="${_L('Abrir asistente IA', 'Open AI Assistant')}">
                    <svg id="svBubbleMsg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <svg id="svBubbleX" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="display:none;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <span id="svChatLabel">${_L('Asistente IA', 'AI Assistant')}</span>
            </div>
        `;
        document.body.appendChild(wrapper);

        // ── Referencias DOM ───────────────────────────────────
        const bubble   = document.getElementById('svChatBubble');
        const panel    = document.getElementById('svChatPanel');
        const closeBtn = document.getElementById('svChatClose');
        const msgs     = document.getElementById('svChatMsgs');
        const sugEl    = document.getElementById('svChatSug');
        const form     = document.getElementById('svChatForm');
        const input    = document.getElementById('svChatInput');
        const iconMsg  = document.getElementById('svBubbleMsg');
        const iconX    = document.getElementById('svBubbleX');

        // ── Mensaje de bienvenida ─────────────────────────────
        agregarMsg(_L(
            '¡Hola! Soy tu asistente de StrongVision.<br>Puedo ayudarte con técnica, descanso, nutrición y más. ¿Qué necesitas?',
            'Hello! I\'m your StrongVision AI assistant.<br>I can help you with technique, recovery, nutrition, and more. What do you need?'
        ), 'bot', false);

        // ── Historial ─────────────────────────────────────────
        try {
            const hist = SV_STORAGE.obtenerHistorialChat(usuario.id);
            if (hist && hist.length > 0) {
                msgs.innerHTML = '';
                hist.slice(-12).forEach(m => agregarMsg(m.texto, m.rol, false));
                msgs.scrollTop = msgs.scrollHeight;
            }
        } catch(_) {}

        // ── Sugerencias ───────────────────────────────────────
        try {
            const rutina = SV_STORAGE.obtenerRutina(usuario.id);
            const perfil = SV_STORAGE.obtenerPerfil(usuario.id);
            if (rutina || perfil) {
                const lista = rutina ? [
                    { t: _L('¿Cómo es la técnica del press de banca?', 'How is the bench press technique?'),                       l: _L('🏋️ Técnica', '🏋️ Technique') },
                    { t: _L(`¿Cómo progresar siendo ${perfil?.nivel || 'intermedio'}?`, `How to progress as ${perfil?.nivel || 'intermediate'}?`), l: _L('📈 Progreso', '📈 Progress') },
                    { t: _L('Consejos de descanso y recuperación', 'Rest and recovery tips'),                                       l: _L('😴 Descanso', '😴 Rest') },
                    { t: _L(`¿Qué comer para ${perfil?.objetivo || 'hipertrofia'}?`, `What to eat for ${perfil?.objetivo || 'hypertrophy'}?`), l: _L('🥗 Nutrición', '🥗 Nutrition') }
                ] : [
                    { t: _L('¿Cuántos días debo entrenar por semana?', 'How many days should I train per week?'), l: _L('📅 Frecuencia', '📅 Frequency') },
                    { t: _L('Consejos para empezar a entrenar', 'Tips for starting to train'),                    l: _L('🌱 Inicio', '🌱 Start') },
                    { t: _L('¿Qué comer antes de entrenar?', 'What to eat before training?'),                    l: _L('🥗 Nutrición', '🥗 Nutrition') }
                ];
                sugEl.style.display = 'flex';
                sugEl.innerHTML = lista.map(s =>
                    `<button type="button" class="sug-btn" data-txt="${s.t.replace(/"/g, '&quot;')}">${s.l}</button>`
                ).join('');
                sugEl.querySelectorAll('.sug-btn').forEach(btn => {
                    btn.addEventListener('click', () => usarSugerencia(btn.dataset.txt));
                });
            }
        } catch(_) {}

        // ── Toggle open/close ─────────────────────────────────
        let isOpen = false;
        function togglePanel() {
            isOpen = !isOpen;
            panel.classList.toggle('hidden', !isOpen);
            bubble.classList.toggle('active', isOpen);
            iconMsg.style.display = isOpen ? 'none' : '';
            iconX.style.display   = isOpen ? ''     : 'none';
            if (isOpen) {
                setTimeout(() => { input.focus(); msgs.scrollTop = msgs.scrollHeight; }, 60);
            }
        }

        bubble.addEventListener('click', togglePanel);
        closeBtn.addEventListener('click', togglePanel);

        // ── Envío de mensajes ─────────────────────────────────
        let sugOcultas = false;
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const pregunta = input.value.trim();
            if (!pregunta) return;

            if (!sugOcultas) { sugEl.style.display = 'none'; sugOcultas = true; }

            agregarMsg(pregunta, 'user');
            try { SV_STORAGE.agregarMensajeChat(usuario.id, { texto: pregunta, rol: 'user' }); } catch(_) {}
            input.value = '';

            mostrarTyping();

            try {
                const ctx = {
                    usuario,
                    perfil: SV_STORAGE.obtenerPerfil(usuario.id),
                    rutina: SV_STORAGE.obtenerRutina(usuario.id)
                };

                let resp;
                try {
                    const res = await fetch(N8N_CHAT, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            mensaje: pregunta,
                            idioma: localStorage.getItem('sv_lang') || 'es-CO',
                            usuario: {
                                id:     ctx.usuario?.id,
                                nombre: ctx.usuario?.nombre,
                                correo: ctx.usuario?.correo,
                            },
                            perfil: ctx.perfil || null,
                            rutina: ctx.rutina ? {
                                objetivo: ctx.rutina.objetivo,
                                nivel:    ctx.rutina.nivel,
                                dias:     ctx.rutina.sesiones?.length
                            } : null
                        })
                    });
                    if (!res.ok) throw new Error('n8n ' + res.status);
                    const data = await res.json();
                    resp = data.respuesta || data.text || data.message || data.output || data.response;
                    if (!resp) throw new Error('empty');
                } catch (_n8n) {
                    // Fallback: IA local
                    resp = await SV_IA.responderChat(pregunta, ctx);
                }

                quitarTyping();
                agregarMsg(resp, 'bot');
                try { SV_STORAGE.agregarMensajeChat(usuario.id, { texto: resp, rol: 'bot' }); } catch(_) {}
            } catch(_) {
                quitarTyping();
                agregarMsg(_L('Disculpa, tuve un problema. Inténtalo de nuevo.', 'Sorry, I had a problem. Please try again.'), 'bot');
            }
        });

        // ── Global helper ─────────────────────────────────────
        window.sugerirChat = usarSugerencia;
        function usarSugerencia(texto) {
            input.value = texto;
            form.dispatchEvent(new Event('submit'));
        }

        // ── Helpers ───────────────────────────────────────────
        function agregarMsg(texto, rol, scroll) {
            const div = document.createElement('div');
            div.className = 'chat-msg ' + rol;
            div.innerHTML = esc(texto)
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            msgs.appendChild(div);
            if (scroll !== false) msgs.scrollTop = msgs.scrollHeight;
        }

        function mostrarTyping() {
            const d = document.createElement('div');
            d.className = 'chat-typing'; d.id = 'svTyping';
            d.innerHTML = '<span></span><span></span><span></span>';
            msgs.appendChild(d);
            msgs.scrollTop = msgs.scrollHeight;
        }

        function quitarTyping() {
            document.getElementById('svTyping')?.remove();
        }

        function esc(t) {
            return String(t).replace(/[&<>"']/g, c =>
                ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c])
            );
        }

        function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
