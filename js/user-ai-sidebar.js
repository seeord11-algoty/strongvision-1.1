/**
 * StrongVision — Asistente IA en sidebar de usuario
 * Se inyecta entre el nav y el footer del sidebar.
 */
(function () {
    'use strict';

    function init() {
        if (typeof SV_AUTH === 'undefined' || typeof SV_STORAGE === 'undefined') return;
        if (!SV_AUTH.haySesion()) return;
        if (document.getElementById('userAiSidebar')) return;

        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        const footer  = sidebar.querySelector('.sb-footer');
        const nav     = sidebar.querySelector('.sb-nav');
        const usuario = SV_STORAGE.obtenerUsuarioActual();
        if (!usuario) return;

        // Hacer que el nav no expanda — la IA toma el espacio sobrante
        if (nav) nav.classList.add('sb-nav-compact');

        let perfil = null, rutina = null;
        try { perfil = SV_STORAGE.obtenerPerfil(usuario.id); } catch(_) {}
        try { rutina = SV_STORAGE.obtenerRutina(usuario.id); } catch(_) {}

        const nombre = (usuario.nombre || 'Usuario').split(' ')[0];
        const isEN = (localStorage.getItem('sv_lang') || 'es-CO') === 'en-US';

        // Chips contextuales según perfil y objetivo
        const obj = perfil?.objetivo || '';
        const chips = rutina ? (isEN ? [
            { l: 'My routine',  q: 'Tell me about my current training plan' },
            { l: 'Technique',   q: 'Explain the universal principles of correct technique' },
            { l: 'Protein',     q: 'How much protein do I need per day' },
            { l: 'Creatine',    q: 'Is it worth taking creatine?' },
            { l: 'Rest',        q: 'Tips for muscle recovery and sleep' },
            { l: 'Progress',    q: 'How do I apply progressive overload in my routine?' },
            { l: 'Injuries',    q: 'What should I do if I feel pain during an exercise?' },
            { l: 'Cardio',      q: 'When and how to do cardio if my goal is hypertrophy' },
        ] : [
            { l: 'Mi rutina',   q: 'Cuéntame sobre mi plan de entrenamiento actual' },
            { l: 'Técnica',     q: 'Explícame los principios universales de técnica correcta' },
            { l: 'Proteína',    q: 'Cuánta proteína necesito consumir al día' },
            { l: 'Creatina',    q: '¿Vale la pena tomar creatina?' },
            { l: 'Descanso',    q: 'Consejos de recuperación muscular y sueño' },
            { l: 'Progresar',   q: '¿Cómo aplico la sobrecarga progresiva en mi rutina?' },
            { l: 'Lesiones',    q: '¿Qué hago si siento dolor o molestia durante un ejercicio?' },
            { l: 'Cardio',      q: 'Cuándo y cómo hacer cardio si mi objetivo es hipertrofia' },
        ]) : (isEN ? [
            { l: 'Get started', q: 'How do I start training safely for the first time?' },
            { l: 'Frequency',   q: 'How many days per week should I train as a beginner?' },
            { l: 'Protein',     q: 'How much protein do I need and what are the best sources' },
            { l: 'Nutrition',   q: 'Nutrition basics for someone who is starting to train' },
            { l: 'Injuries',    q: 'What precautions should I take to avoid injuries when training?' },
            { l: 'Cardio',      q: 'What type of cardio suits me best to start?' },
        ] : [
            { l: 'Empezar',     q: '¿Cómo empezar a entrenar de forma segura por primera vez?' },
            { l: 'Frecuencia',  q: '¿Cuántos días debo entrenar por semana como principiante?' },
            { l: 'Proteína',    q: 'Cuánta proteína necesito y cuáles son las mejores fuentes' },
            { l: 'Nutrición',   q: 'Bases de nutrición para alguien que empieza a entrenar' },
            { l: 'Lesiones',    q: '¿Qué precauciones tomar para evitar lesiones al entrenar?' },
            { l: 'Cardio',      q: '¿Qué tipo de cardio me conviene más para empezar?' },
        ]);

        // ── Inyectar estilos del modal ───────────────────────
        if (!document.getElementById('uasModalStyles')) {
            const st = document.createElement('style');
            st.id = 'uasModalStyles';
            st.textContent = `
                .uas-expand-btn{background:none;border:none;cursor:pointer;padding:2px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.45);border-radius:4px;transition:color .15s,background .15s;}
                .uas-expand-btn:hover{color:rgba(255,255,255,.85);background:rgba(255,255,255,.08);}
                /* ── Widget racha ── */
                .uas-streak-widget{padding:.7rem .75rem .6rem;display:flex;flex-direction:column;gap:.5rem;}
                .usw-top{display:flex;align-items:center;gap:.6rem;}
                .usw-fire-wrap{position:relative;width:46px;height:46px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
                .usw-fire-ring{position:absolute;inset:0;border-radius:50%;border:2px solid rgba(255,214,10,.18);transition:border-color .4s,box-shadow .4s;}
                .usw-fire-ring.active{border-color:rgba(255,107,43,.7);box-shadow:0 0 14px rgba(255,107,43,.45),0 0 4px rgba(255,214,10,.3);animation:uswRingPulse 2.5s ease-in-out infinite;}
                @keyframes uswRingPulse{0%,100%{box-shadow:0 0 10px rgba(255,107,43,.4),0 0 3px rgba(255,214,10,.25)}50%{box-shadow:0 0 22px rgba(255,107,43,.65),0 0 8px rgba(255,214,10,.4)}}
                .usw-fire-num{font-size:1.15rem;font-weight:800;color:#fff;line-height:1;z-index:1;}
                .usw-fire-icon{position:absolute;bottom:-3px;right:-3px;font-size:.75rem;line-height:1;}
                .usw-info{flex:1;min-width:0;}
                .usw-label{font-size:.6rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:1px;}
                .usw-status{font-size:.78rem;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
                .usw-sub{font-size:.65rem;color:rgba(255,255,255,.35);margin-top:1px;}
                .usw-chat-btn{width:30px;height:30px;border-radius:8px;background:rgba(255,214,10,.12);border:1px solid rgba(255,214,10,.25);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--y,#FFD60A);flex-shrink:0;transition:background .15s,transform .15s;}
                .usw-chat-btn:hover{background:rgba(255,214,10,.22);transform:scale(1.08);}
                .usw-tip{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-left:2px solid var(--y,#FFD60A);border-radius:0 8px 8px 0;padding:.45rem .6rem;display:flex;align-items:flex-start;gap:.4rem;}
                .usw-tip-tag{font-size:.58rem;font-weight:800;color:var(--y,#FFD60A);letter-spacing:.06em;text-transform:uppercase;flex-shrink:0;margin-top:1px;}
                #uswTipText{font-size:.7rem;line-height:1.45;color:rgba(255,255,255,.65);transition:opacity .3s,transform .3s;}
                .usw-dots{display:flex;gap:4px;align-items:center;padding:.1rem 0 .05rem;}
                .usw-dot-day{width:100%;height:3px;border-radius:2px;background:rgba(255,255,255,.1);flex:1;transition:background .3s;}
                .usw-dot-day.done{background:linear-gradient(90deg,#FFD60A,#ff6b2b);box-shadow:0 0 5px rgba(255,214,10,.4);}
                /* FAB flotante */
                .uas-fab{position:fixed;bottom:1.6rem;right:1.6rem;z-index:1000;width:54px;height:54px;border-radius:50%;background:var(--y,#FFD60A);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 22px rgba(255,214,10,.45),0 2px 8px rgba(0,0,0,.4);transition:transform .22s cubic-bezier(.4,0,.2,1),box-shadow .22s,opacity .22s;}
                .uas-fab:hover{transform:scale(1.1);box-shadow:0 6px 30px rgba(255,214,10,.6),0 2px 12px rgba(0,0,0,.5);}
                .uas-fab.panel-open{transform:scale(0);opacity:0;pointer-events:none;}
                .uas-fab.pulsing{animation:uasFabPulse 1.8s ease-in-out 3;}
                @keyframes uasFabPulse{0%,100%{transform:scale(1);box-shadow:0 4px 22px rgba(255,214,10,.45)}40%{transform:scale(1.13);box-shadow:0 0 0 10px rgba(255,214,10,.18),0 4px 28px rgba(255,214,10,.65)}70%{transform:scale(1.06);box-shadow:0 0 0 6px rgba(255,214,10,.1),0 4px 22px rgba(255,214,10,.5)}}
                .uas-fab svg{color:#111;flex-shrink:0;}
                /* Burbuja sugerencia */
                .uas-bubble{position:fixed;bottom:5.4rem;right:1.6rem;z-index:1000;max-width:220px;background:#1e1e2e;border:1px solid rgba(255,214,10,.35);border-radius:14px 14px 4px 14px;padding:.65rem .85rem;font-size:.76rem;line-height:1.45;color:rgba(255,255,255,.88);box-shadow:0 6px 24px rgba(0,0,0,.45);cursor:pointer;opacity:0;transform:translateY(8px) scale(.95);transition:opacity .28s ease,transform .28s ease;pointer-events:none;}
                .uas-bubble.show{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}
                .uas-bubble::after{content:'';position:absolute;bottom:-7px;right:18px;width:12px;height:7px;background:#1e1e2e;clip-path:polygon(0 0,100% 0,50% 100%);border-left:1px solid rgba(255,214,10,.35);border-right:1px solid rgba(255,214,10,.35);}
                .uas-bubble-tag{display:inline-block;font-size:.65rem;font-weight:700;color:var(--y,#FFD60A);letter-spacing:.04em;margin-bottom:3px;text-transform:uppercase;}
                .uas-bubble-x{position:absolute;top:5px;right:7px;background:none;border:none;color:rgba(255,255,255,.3);cursor:pointer;font-size:.85rem;line-height:1;padding:2px 4px;}
                .uas-bubble-x:hover{color:rgba(255,255,255,.7);}
                .uas-fab-close{position:fixed;bottom:1.6rem;right:calc(min(400px,100vw) + 1rem);z-index:1002;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.7);transition:all .22s cubic-bezier(.4,0,.2,1),opacity .22s;opacity:0;pointer-events:none;backdrop-filter:blur(6px);}
                .uas-fab-close.panel-open{opacity:1;pointer-events:auto;}
                .uas-fab-close:hover{background:rgba(255,255,255,.18);color:#fff;}
                /* Panel lateral */
                .uas-modal-overlay{display:none;}
                .uas-modal{position:fixed;top:0;right:0;bottom:0;z-index:1001;display:none;pointer-events:none;}
                .uas-modal.open{display:block;pointer-events:auto;}
                .uas-modal-box{position:fixed;top:0;right:0;height:100vh;width:min(400px,100vw);background:var(--surface,#16161e);border-left:1px solid rgba(255,255,255,.12);display:flex;flex-direction:column;overflow:hidden;box-shadow:-8px 0 32px rgba(0,0,0,.45);transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);}
                .uas-modal.open .uas-modal-box{transform:translateX(0);}
                .uas-modal-head{display:flex;align-items:center;justify-content:space-between;padding:.9rem 1.1rem;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025);flex-shrink:0;}
                .uas-modal-head .uas-title{display:flex;align-items:center;gap:.45rem;font-size:.8rem;font-weight:700;letter-spacing:.02em;color:rgba(255,255,255,.9);}
                .uas-modal-close{background:none;border:none;cursor:pointer;color:rgba(255,255,255,.4);padding:5px;border-radius:6px;display:flex;align-items:center;transition:color .15s,background .15s;}
                .uas-modal-close:hover{color:#fff;background:rgba(255,255,255,.1);}
                .uas-modal-msgs{flex:1;overflow-y:auto;padding:.8rem 1rem;display:flex;flex-direction:column;gap:.6rem;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.12) transparent;}
                .uas-modal-msgs .uas-msg{max-width:88%;font-size:.84rem;line-height:1.55;padding:.6rem .85rem;border-radius:14px;word-break:break-word;animation:uasMsgIn .18s ease;}
                @keyframes uasMsgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                .uas-modal-msgs .uas-bot{align-self:flex-start;background:rgba(255,255,255,.07);color:rgba(255,255,255,.88);border-bottom-left-radius:4px;}
                .uas-modal-msgs .uas-user{align-self:flex-end;background:var(--y,#FFD60A);color:#111;border-bottom-right-radius:4px;font-weight:500;}
                .uas-modal-msgs .uas-typing{align-self:flex-start;display:flex;gap:4px;padding:.5rem .75rem;background:rgba(255,255,255,.07);border-radius:14px;}
                .uas-modal-msgs .uas-typing span{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.4);animation:uasBounce 1s infinite;}
                .uas-modal-msgs .uas-typing span:nth-child(2){animation-delay:.15s;}
                .uas-modal-msgs .uas-typing span:nth-child(3){animation-delay:.3s;}
                .uas-modal-chips{display:flex;flex-wrap:wrap;gap:.32rem;padding:.55rem 1rem;border-top:1px solid rgba(255,255,255,.05);}
                .uas-modal-chip{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.65);font-size:.71rem;padding:.28rem .72rem;border-radius:20px;cursor:pointer;transition:all .15s;white-space:nowrap;}
                .uas-modal-chip:hover{background:rgba(255,214,10,.14);border-color:rgba(255,214,10,.4);color:#FFD60A;}
                .uas-modal-form{display:flex;gap:.5rem;padding:.75rem 1rem;border-top:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.018);flex-shrink:0;}
                .uas-modal-form input{flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:.58rem .95rem;color:#fff;font-size:.85rem;outline:none;transition:border-color .15s;}
                .uas-modal-form input::placeholder{color:rgba(255,255,255,.3);}
                .uas-modal-form input:focus{border-color:rgba(255,214,10,.5);}
                .uas-modal-form button{background:var(--y,#FFD60A);border:none;border-radius:10px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:opacity .15s;}
                .uas-modal-form button:hover{opacity:.85;}
                .uas-modal-form button svg{color:#111;}
                @keyframes uasBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
            `;
            document.head.appendChild(st);
        }

        // ── Datos de racha ───────────────────────────────────
        const gami   = SV_STORAGE.obtenerGami(usuario.id);
        const racha  = gami?.racha || 0;
        const progreso = SV_STORAGE.obtenerProgreso(usuario.id);
        const sesiones = progreso?.sesiones?.length || 0;

        const TIPS_RACHA = isEN ? [
            'Every day counts! Consistency is what separates champions.',
            "Don't break the chain. One training day today is worth ten tomorrow.",
            'Your future self thanks you for what you do today. Keep going! 🔥',
            "The streak isn't a number, it's a habit you're building.",
            "Results come to those who don't give up. You got this! 💪",
            'Each session is a brick in your best self. Keep laying bricks.',
            'Motivation starts the engine, but habit keeps it running.',
            "You don't need to be perfect, just consistent. Keep the streak!",
            "Those who achieve their goals aren't the most talented, they're the most consistent.",
            "A workout you don't want to do is the most important one of your week.",
        ] : [
            '¡Cada día cuenta! La constancia es lo que separa a los campeones.',
            'No rompas la cadena. Un día de entrenamiento hoy vale más que diez mañana.',
            'Tu versión de mañana agradece lo que haces hoy. ¡Sigue! 🔥',
            'La racha no es un número, es un hábito que estás construyendo.',
            'Los resultados llegan a quienes no se rinden. ¡Tú puedes! 💪',
            'Cada sesión es un ladrillo de tu mejor versión. Sigue poniendo ladrillos.',
            'La motivación arranca el motor, pero el hábito es lo que lo mantiene.',
            'No necesitas ser perfecto, solo consistente. ¡Mantén la racha!',
            'Los que logran sus metas no son los más talentosos, son los más constantes.',
            'Un entrenamiento que no quieres hacer es el más importante de tu semana.',
        ];
        const tipRacha = TIPS_RACHA[Math.floor(Math.random() * TIPS_RACHA.length)];

        const flamas = racha === 0 ? '–' : racha >= 30 ? '🔥🔥🔥' : racha >= 14 ? '🔥🔥' : '🔥';
        const rachaColor = racha === 0 ? 'rgba(255,255,255,.25)' : racha >= 14 ? '#ff6b2b' : '#FFD60A';
        const rachaMsg = isEN
            ? (racha === 0 ? 'Start your streak today'
                : racha === 1 ? 'Day one! Keep it up'
                : racha < 7  ? `${racha} days in a row!`
                : racha < 14 ? `Full week! 🎯`
                : racha < 30 ? `${racha} days unstoppable!`
                : `Legend! ${racha} days 🏆`)
            : (racha === 0 ? 'Inicia tu racha hoy'
                : racha === 1 ? '¡Primer día! Sigue así'
                : racha < 7  ? `¡Vas ${racha} días seguidos!`
                : racha < 14 ? `¡Semana completa! 🎯`
                : racha < 30 ? `¡${racha} días imparable!`
                : `¡Leyenda! ${racha} días 🏆`);

        // ── Crear widget ─────────────────────────────────────
        const panel = document.createElement('div');
        panel.id = 'userAiSidebar';
        panel.className = 'uas-panel';
        panel.innerHTML = `
            <div class="uas-streak-widget" id="uasStreakWidget">
                <div class="usw-top">
                    <div class="usw-fire-wrap">
                        <div class="usw-fire-ring" id="uswRing"></div>
                        <div class="usw-fire-num" id="uswNum">${racha}</div>
                        <div class="usw-fire-icon">${racha > 0 ? '🔥' : '💤'}</div>
                    </div>
                    <div class="usw-info">
                        <div class="usw-label">${isEN ? 'Current streak' : 'Racha actual'}</div>
                        <div class="usw-status" id="uswStatus">${rachaMsg}</div>
                        <div class="usw-sub">${isEN ? `${sesiones} session${sesiones !== 1 ? 's' : ''} logged` : `${sesiones} sesión${sesiones !== 1 ? 'es' : ''} registrada${sesiones !== 1 ? 's' : ''}`}</div>
                    </div>
                    <button class="usw-chat-btn" id="uasExpandBtn" title="${isEN ? 'Open AI assistant' : 'Abrir asistente IA'}" aria-label="${isEN ? 'Open AI assistant' : 'Abrir asistente IA'}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </button>
                </div>
                <div class="usw-tip" id="uswTip">
                    <span class="usw-tip-tag">IA</span>
                    <span id="uswTipText">${esc(tipRacha)}</span>
                </div>
                <div class="usw-dots" id="uswDots">
                    ${Array.from({length:7},(_,i)=>`<div class="usw-dot-day ${i < Math.min(racha,7) ? 'done' : ''}" title="Día ${i+1}"></div>`).join('')}
                </div>
            </div>
        `;

        sidebar.insertBefore(panel, footer);

        // Animar número de racha al entrar
        if (racha > 0) {
            setTimeout(() => {
                const ring = document.getElementById('uswRing');
                if (ring) ring.classList.add('active');
            }, 400);
        }

        // Rotar tip cada 12 s
        let tipIdx = 0;
        setInterval(() => {
            const el = document.getElementById('uswTipText');
            if (!el) return;
            tipIdx = (tipIdx + 1) % TIPS_RACHA.length;
            el.style.opacity = '0';
            el.style.transform = 'translateY(4px)';
            setTimeout(() => {
                el.textContent = TIPS_RACHA[tipIdx];
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 300);
        }, 12000);

        // ── Helpers sidebar (no-op, chat solo en modal) ──────
        function uasBotMsg()  {}
        function uasUserMsg() {}

        // ── Modal pantalla completa ───────────────────────────
        const modal = document.createElement('div');
        modal.id = 'uasModal';
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = `
            <div class="uas-modal-overlay" id="uasModalOverlay"></div>
            <div class="uas-modal-box" role="dialog" aria-label="Asistente IA">
                <div class="uas-modal-head">
                    <div class="uas-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="14" x2="22" y2="14"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="14" x2="4" y2="14"/></svg>
                        ${isEN ? 'AI Assistant' : 'Asistente IA'}
                        <span class="uas-dot" title="${isEN ? 'Online' : 'En línea'}"></span>
                    </div>
                    <button class="uas-modal-close" id="uasModalClose" aria-label="${isEN ? 'Close' : 'Cerrar'}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="uas-modal-msgs" id="uasModalMsgs" aria-live="polite"></div>
                <div class="uas-modal-chips" id="uasModalChips">
                    ${chips.map(c => `<button class="uas-modal-chip" type="button" data-q="${c.q.replace(/"/g, '&quot;')}">${c.l}</button>`).join('')}
                </div>
                <form class="uas-modal-form" id="uasModalForm" autocomplete="off">
                    <input type="text" id="uasModalInput" placeholder="${isEN ? 'Type your question…' : 'Escribe tu pregunta…'}" autocomplete="off" maxlength="300" aria-label="${isEN ? 'Ask the assistant' : 'Pregunta al asistente'}">
                    <button type="submit" aria-label="Enviar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                </form>
            </div>
        `;
        modal.className = 'uas-modal';
        document.body.appendChild(modal);

        // ── FAB flotante ─────────────────────────────────────
        const fab = document.createElement('button');
        fab.id = 'uasFab';
        fab.className = 'uas-fab';
        fab.setAttribute('aria-label', isEN ? 'Open AI assistant' : 'Abrir asistente IA');
        fab.title = isEN ? 'AI Assistant' : 'Asistente IA';
        fab.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="14" x2="22" y2="14"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="14" x2="4" y2="14"/></svg>`;
        document.body.appendChild(fab);

        const fabClose = document.createElement('button');
        fabClose.id = 'uasFabClose';
        fabClose.className = 'uas-fab-close';
        fabClose.setAttribute('aria-label', 'Cerrar asistente');
        fabClose.title = 'Cerrar';
        fabClose.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        document.body.appendChild(fabClose);

        // ── Burbujas periódicas ───────────────────────────────
        const SUGERENCIAS = isEN ? [
            // Nutrition
            { tag: 'Nutrition', txt: 'Do you know how much protein you need based on your weight? Ask me 💪' },
            { tag: 'Nutrition', txt: 'Are you eating enough to recover well? I can explain.' },
            { tag: 'Nutrition', txt: "Carbohydrates aren't the enemy. When and how much to eat? I'll tell you." },
            { tag: 'Nutrition', txt: 'Eat before or after training? I have the answer. 🍳' },
            { tag: 'Nutrition', txt: 'Hydration affects your performance. How much water do you need per day?' },
            { tag: 'Nutrition', txt: 'Bulk, cut, or recomposition? Tell me your goal and I\'ll explain how to eat.' },
            { tag: 'Nutrition', txt: 'Eating enough before training? Pre-workout nutrition makes a difference.' },
            { tag: 'Nutrition', txt: 'Do you know what to eat after training to maximize recovery? 🥩' },
            // Supplements
            { tag: 'Supplements', txt: 'Is creatine worth taking? I have the evidence-based answer.' },
            { tag: 'Supplements', txt: 'Protein powder: necessary or unnecessary expense? I\'ll clarify.' },
            { tag: 'Supplements', txt: 'Does caffeine improve performance? Yes, and I\'ll explain how to use it well. ☕' },
            { tag: 'Supplements', txt: 'Beta-alanine, BCAA, or nothing? I\'ll help you understand what has real evidence.' },
            { tag: 'Supplements', txt: 'Collagen for joints? I\'ll tell you the truth without marketing.' },
            // Recovery
            { tag: 'Recovery', txt: 'Good sleep = more muscle and less fat. Want rest tips?' },
            { tag: 'Recovery', txt: 'How many rest hours between sessions do you really need? Ask me.' },
            { tag: 'Recovery', txt: 'Feeling accumulated fatigue? Could be a sign of overtraining. 😴' },
            { tag: 'Recovery', txt: 'Ice or heat to recover muscles? I\'ll explain when to use each one.' },
            { tag: 'Recovery', txt: 'Post-workout stretching: does it really help? I\'ll tell you the truth.' },
            { tag: 'Recovery', txt: 'Active rest days or total rest? Depends, and I\'ll explain.' },
            // Technique
            { tag: 'Technique', txt: 'Good technique prevents injuries. Want me to explain a movement?' },
            { tag: 'Technique', txt: 'Feeling knee pain during squats? It could be technique. Ask me.' },
            { tag: 'Technique', txt: 'How to properly activate your core in every exercise? Simpler than you think.' },
            { tag: 'Technique', txt: 'Breathing during lifting is key. Are you doing it right? 🫁' },
            { tag: 'Technique', txt: 'How much range of motion do you really need in each exercise?' },
            { tag: 'Technique', txt: 'Supinated vs pronated grip pull-ups: which is better for your goal?' },
            // Training
            { tag: 'Training', txt: 'Progressive overload is the key to progress. How to apply it correctly?' },
            { tag: 'Training', txt: 'When should you do cardio if your goal is muscle gain? 🔥' },
            { tag: 'Training', txt: 'How many sets and reps are ideal for hypertrophy? I\'ll explain.' },
            { tag: 'Training', txt: 'Training with little time? HIIT training could be your ally. ⚡' },
            { tag: 'Training', txt: 'What\'s better: free weights or machines? Depends on your goal. I\'ll tell you.' },
            { tag: 'Training', txt: 'How many days a week to train to see real results?' },
            { tag: 'Training', txt: 'Do you know your optimal training volume this week?' },
            { tag: 'Training', txt: 'Been a while without progress? Plateaus have a solution. 📈' },
            { tag: 'Training', txt: 'Full body or split routine? I\'ll help you choose based on your availability.' },
            { tag: 'Training', txt: 'Warm-up is not optional. Do you know what\'s best for you?' },
            // Motivation
            { tag: 'Motivation', txt: 'Consistency beats talent. How\'s your streak this week? 🏆' },
            { tag: 'Motivation', txt: "A bad day doesn't ruin your progress. Need a push today? 💬" },
            { tag: 'Motivation', txt: 'Results aren\'t immediate, but they\'re certain if you\'re consistent. 🌟' },
            { tag: 'Motivation', txt: 'Struggling to stick to your routine? I have strategies that work. Ask me.' },
            { tag: 'Motivation', txt: 'Every rep counts. Do you know your goals for this week?' },
            // Your routine
            { tag: 'Your routine', txt: 'Have questions about an exercise in your current plan? Ask me.' },
            { tag: 'Your routine', txt: 'Want to know why your routine has those specific exercises? I\'ll explain.' },
            { tag: 'Your routine', txt: 'Feel like your routine is too easy or too hard? I can guide you. 🎯' },
            { tag: 'Your routine', txt: 'Want to substitute an exercise in your plan? Tell me which and why.' },
            { tag: 'Your routine', txt: 'Your routine was generated with AI. Want to understand how each part works?' },
        ] : [
            // Nutrición
            { tag: 'Nutrición', txt: '¿Sabes cuánta proteína necesitas según tu peso? Pregúntame 💪' },
            { tag: 'Nutrición', txt: '¿Estás comiendo suficiente para recuperarte bien? Te explico.' },
            { tag: 'Nutrición', txt: 'Los carbohidratos no son el enemigo. ¿Cuándo y cuánto comer? Te cuento.' },
            { tag: 'Nutrición', txt: '¿Desayunar antes o después de entrenar? Tengo la respuesta. 🍳' },
            { tag: 'Nutrición', txt: 'La hidratación afecta tu rendimiento. ¿Cuánta agua necesitas al día?' },
            { tag: 'Nutrición', txt: '¿Bulk, cut o recomposición? Dime tu objetivo y te explico cómo comer.' },
            { tag: 'Nutrición', txt: '¿Comes suficiente antes de entrenar? El pre-entreno natural marca la diferencia.' },
            { tag: 'Nutrición', txt: '¿Sabes qué comer después de entrenar para maximizar tu recuperación? 🥩' },
            // Suplementos
            { tag: 'Suplementos', txt: '¿Vale la pena tomar creatina? Tengo la respuesta basada en evidencia.' },
            { tag: 'Suplementos', txt: 'Proteína en polvo: ¿necesaria o un gasto innecesario? Te lo aclaro.' },
            { tag: 'Suplementos', txt: '¿La cafeína mejora el rendimiento? Sí, y te explico cómo usarla bien. ☕' },
            { tag: 'Suplementos', txt: '¿Beta-alanina, BCAA, o nada? Te ayudo a entender qué tiene evidencia real.' },
            { tag: 'Suplementos', txt: '¿Colágeno para las articulaciones? Te digo la verdad sin marketing.' },
            // Recuperación
            { tag: 'Recuperación', txt: 'Dormir bien = más músculo y menos grasa. ¿Quieres tips de descanso?' },
            { tag: 'Recuperación', txt: '¿Cuántas horas de descanso entre sesiones necesitas realmente? Pregúntame.' },
            { tag: 'Recuperación', txt: '¿Sientes fatiga acumulada? Podría ser señal de sobreentrenamiento. 😴' },
            { tag: 'Recuperación', txt: '¿El hielo o el calor para recuperar músculos? Te explico cuándo usar cada uno.' },
            { tag: 'Recuperación', txt: 'El estiramiento post-entrenamiento: ¿realmente ayuda? Te digo la verdad.' },
            { tag: 'Recuperación', txt: '¿Días de descanso activo o descanso total? Depende, y te lo explico.' },
            // Técnica
            { tag: 'Técnica', txt: 'Una buena técnica previene lesiones. ¿Quieres que te explique algún movimiento?' },
            { tag: 'Técnica', txt: '¿Sientes dolor en la rodilla al hacer sentadilla? Puede ser técnica. Pregúntame.' },
            { tag: 'Técnica', txt: '¿Cómo activar bien el core en cada ejercicio? Es más simple de lo que crees.' },
            { tag: 'Técnica', txt: 'La respiración en el levantamiento es clave. ¿La estás haciendo bien? 🫁' },
            { tag: 'Técnica', txt: '¿Cuánto rango de movimiento necesitas realmente en cada ejercicio?' },
            { tag: 'Técnica', txt: 'Dominadas con agarre supino vs prono: ¿cuál te conviene más según tu objetivo?' },
            // Entrenamiento
            { tag: 'Entrenamiento', txt: 'La sobrecarga progresiva es la clave del progreso. ¿Cómo aplicarla bien?' },
            { tag: 'Entrenamiento', txt: '¿Cuándo conviene hacer cardio si tu meta es ganar músculo? 🔥' },
            { tag: 'Entrenamiento', txt: '¿Cuántas series y repeticiones son ideales para hipertrofia? Te explico.' },
            { tag: 'Entrenamiento', txt: '¿Entrenas con poco tiempo? El entrenamiento HIIT puede ser tu aliado. ⚡' },
            { tag: 'Entrenamiento', txt: '¿Qué es mejor: pesas libres o máquinas? Depende de tu objetivo. Te cuento.' },
            { tag: 'Entrenamiento', txt: '¿Cuántos días a la semana entrenar para ver resultados reales?' },
            { tag: 'Entrenamiento', txt: '¿Sabes cuál es tu volumen de entrenamiento óptimo esta semana?' },
            { tag: 'Entrenamiento', txt: '¿Llevas un tiempo sin progresar? El estancamiento tiene solución. 📈' },
            { tag: 'Entrenamiento', txt: '¿Full body o rutina dividida? Te ayudo a elegir según tu disponibilidad.' },
            { tag: 'Entrenamiento', txt: 'El calentamiento no es opcional. ¿Sabes cuál es el mejor para ti?' },
            // Motivación
            { tag: 'Motivación', txt: 'La constancia supera al talento. ¿Cómo va tu racha esta semana? 🏆' },
            { tag: 'Motivación', txt: 'Un mal día no arruina tu progreso. ¿Necesitas un empujón hoy? 💬' },
            { tag: 'Motivación', txt: 'Los resultados no son inmediatos, pero son seguros si eres consistente. 🌟' },
            { tag: 'Motivación', txt: '¿Te cuesta mantener la rutina? Tengo estrategias que funcionan. Pregúntame.' },
            { tag: 'Motivación', txt: 'Cada repetición cuenta. ¿Sabes cuáles son tus metas de esta semana?' },
            // Tu rutina
            { tag: 'Tu rutina', txt: '¿Tienes dudas sobre algún ejercicio de tu plan actual? Pregúntame.' },
            { tag: 'Tu rutina', txt: '¿Quieres saber por qué tu rutina tiene esos ejercicios específicos? Te explico.' },
            { tag: 'Tu rutina', txt: '¿Sientes que tu rutina es muy fácil o muy difícil? Puedo orientarte. 🎯' },
            { tag: 'Tu rutina', txt: '¿Quieres sustituir algún ejercicio de tu plan? Dime cuál y por qué.' },
            { tag: 'Tu rutina', txt: 'Tu rutina fue generada con IA. ¿Quieres entender cómo funciona cada parte?' },
        ];

        let bubbleIdx = Math.floor(Math.random() * SUGERENCIAS.length);
        let bubbleTimer = null;
        let bubbleVisible = false;

        const bubble = document.createElement('div');
        bubble.id = 'uasBubble';
        bubble.className = 'uas-bubble';
        document.body.appendChild(bubble);

        function mostrarBurbuja() {
            if (modal.classList.contains('open')) return;
            const s = SUGERENCIAS[bubbleIdx % SUGERENCIAS.length];
            bubbleIdx++;
            bubble.innerHTML = `<button class="uas-bubble-x" id="uasBubbleX">✕</button><div class="uas-bubble-tag">${s.tag}</div><div>${s.txt}</div>`;
            document.getElementById('uasBubbleX').addEventListener('click', e => { e.stopPropagation(); ocultarBurbuja(); });
            bubble.classList.add('show');
            bubbleVisible = true;
            // Pulsar el FAB
            fab.classList.remove('pulsing');
            void fab.offsetWidth;
            fab.classList.add('pulsing');
            fab.addEventListener('animationend', () => fab.classList.remove('pulsing'), { once: true });
            // Auto-ocultar después de 7 s
            clearTimeout(bubbleTimer);
            bubbleTimer = setTimeout(ocultarBurbuja, 7000);
        }

        function ocultarBurbuja() {
            bubble.classList.remove('show');
            bubbleVisible = false;
        }

        bubble.addEventListener('click', () => { ocultarBurbuja(); abrirModal(); });

        // Primera burbuja a los 10 s, luego cada 30 s
        setTimeout(() => {
            mostrarBurbuja();
            setInterval(mostrarBurbuja, 30000);
        }, 10000);

        function abrirModal() {
            ocultarBurbuja();
            const modalMsgs = document.getElementById('uasModalMsgs');
            if (modalMsgs && modalMsgs.children.length === 0) {
                const bienvenida = isEN
                    ? `Hello, <strong>${nombre}</strong>! 👋 I'm your personal AI assistant. Ask me about technique, nutrition, recovery or your training plan.`
                    : `¡Hola, <strong>${nombre}</strong>! 👋 Soy tu asistente IA personal. Pregúntame sobre técnica, nutrición, recuperación o tu plan de entrenamiento.`;
                uasAddModalMsg('uas-bot', bienvenida);
            }
            if (modalMsgs) modalMsgs.scrollTop = modalMsgs.scrollHeight;
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
            fab.classList.add('panel-open');
            fabClose.classList.add('panel-open');
            document.getElementById('uasModalInput')?.focus();
        }

        function cerrarModal() {
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
            fab.classList.remove('panel-open');
            fabClose.classList.remove('panel-open');
        }

        fab.addEventListener('click', abrirModal);
        fabClose.addEventListener('click', cerrarModal);
        document.getElementById('uasExpandBtn')?.addEventListener('click', abrirModal);
        document.getElementById('uasModalClose')?.addEventListener('click', cerrarModal);
        document.getElementById('uasModalOverlay')?.addEventListener('click', cerrarModal);

        modal.querySelectorAll('.uas-modal-chip').forEach(chip => {
            chip.addEventListener('click', () => uasEnviarModal(chip.dataset.q, chip.textContent.trim()));
        });

        document.getElementById('uasModalForm')?.addEventListener('submit', e => {
            e.preventDefault();
            const input = document.getElementById('uasModalInput');
            const q = input.value.trim();
            if (!q) return;
            input.value = '';
            uasEnviarModal(q, null);
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && modal.classList.contains('open')) cerrarModal();
        });

        function uasAddModalMsg(cls, html) {
            const msgs = document.getElementById('uasModalMsgs');
            if (!msgs) return;
            const div = document.createElement('div');
            div.className = 'uas-msg ' + cls;
            div.innerHTML = html;
            msgs.appendChild(div);
            msgs.scrollTop = msgs.scrollHeight;
        }

        async function uasEnviarModal(q, label) {
            uasAddModalMsg('uas-user', esc(label || q));
            // typing indicator
            const msgs = document.getElementById('uasModalMsgs');
            const typing = document.createElement('div');
            typing.className = 'uas-typing'; typing.id = 'uasModalTyping';
            typing.innerHTML = '<span></span><span></span><span></span>';
            msgs?.appendChild(typing);
            msgs && (msgs.scrollTop = msgs.scrollHeight);

            await new Promise(r => setTimeout(r, 500 + Math.random() * 700));
            document.getElementById('uasModalTyping')?.remove();
            try {
                const ctx = { usuario, rutina, perfil };
                const resp = window.SV_IA ? await SV_IA.responderChat(q, ctx) : fallback(q);
                uasAddModalMsg('uas-bot', formatResp(resp));
                // También actualizar sidebar y guardar en historial
                uasBotMsg(formatResp(resp));
                try { SV_STORAGE.agregarMensajeChat(usuario.id, { texto: q, rol: 'user' }); } catch(_) {}
                try { SV_STORAGE.agregarMensajeChat(usuario.id, { texto: resp, rol: 'bot' }); } catch(_) {}
            } catch(_) {
                uasAddModalMsg('uas-bot', isEN ? 'There was a problem processing your query. Please try again.' : 'Hubo un problema al procesar tu consulta. Intenta de nuevo.');
            }
        }

        function fallback(q) {
            const ql = q.toLowerCase();
            if (/técnica|forma|ejercicio|technique|form|exercise/.test(ql)) return isEN ? 'Keep your back straight, core activated and movements controlled. Prioritize technique over weight.' : 'Mantén la espalda recta, core activado y movimientos controlados. Prioriza la técnica antes del peso.';
            if (/nutri|comer|dieta|eat|diet/.test(ql))       return isEN ? 'Eat enough protein (1.6-2g/kg), carbohydrates around training, and healthy fats.' : 'Come proteína suficiente (1.6-2g/kg), carbohidratos en torno al entrenamiento y grasas saludables.';
            if (/descanso|recuper|dormir|rest|sleep|recover/.test(ql)) return isEN ? 'Sleep 7-9 hours. Between sessions of the same muscle group, allow 48h of recovery.' : 'Duerme 7-9 horas. Entre sesiones del mismo grupo muscular, deja 48h de recuperación.';
            return isEN ? 'Check your training panel for more personalized details.' : 'Consulta tu panel de entrenamiento para más detalles personalizados.';
        }

        function esc(t) {
            return String(t).replace(/[&<>"']/g, c =>
                ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c])
            );
        }

        function formatResp(text) {
            return esc(text)
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
