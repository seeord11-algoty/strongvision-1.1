/* ================================================
   STRONGVISION — Sistema de Notificaciones
   - Respuestas del admin (soporte)
   - Recordatorio de entrenamiento
   - Sesión omitida
   - Logros desbloqueados
   ================================================ */
(function () {
    'use strict';

    // ── Mapa días semana ──────────────────────────────────────
    // "L"→1 (Lun) … "D"→0 (Dom), igual que Date.getDay()
    var DAY_MAP = { L: 1, M: 2, X: 3, J: 4, V: 5, S: 6, D: 0 };

    var isEN = (localStorage.getItem('sv_lang') || 'es-CO') === 'en-US';
    var L = function(es, en) { return isEN ? en : es; };

    var LOGRO_NOMBRES = isEN ? {
        primer_paso: { icon: '👣', nombre: 'First step',        desc: 'You completed your first session' },
        racha_3:     { icon: '🔥', nombre: '3-day streak',      desc: '3 consecutive days of training' },
        racha_7:     { icon: '⚡', nombre: '7 days in a row',   desc: 'A week of consistency' },
        racha_30:    { icon: '🏅', nombre: '30 days in a row',  desc: 'A month non-stop — incredible!' },
        sesiones_10: { icon: '💪', nombre: '10 sessions',       desc: "You're on your way" },
        sesiones_50: { icon: '🚀', nombre: '50 sessions',       desc: 'Dedicated athlete' },
        nivel_5:     { icon: '⭐', nombre: 'Level 5',           desc: 'You reached level 5' },
        nivel_10:    { icon: '🏆', nombre: 'Level 10',          desc: 'StrongVision Elite' },
    } : {
        primer_paso: { icon: '👣', nombre: 'Primer paso',      desc: 'Completaste tu primera sesión' },
        racha_3:     { icon: '🔥', nombre: 'Racha de 3 días',  desc: '3 días consecutivos de entrenamiento' },
        racha_7:     { icon: '⚡', nombre: '7 días seguidos',   desc: 'Una semana de constancia' },
        racha_30:    { icon: '🏅', nombre: '30 días seguidos',  desc: 'Un mes sin parar — ¡increíble!' },
        sesiones_10: { icon: '💪', nombre: '10 sesiones',       desc: 'Ya estás en marcha' },
        sesiones_50: { icon: '🚀', nombre: '50 sesiones',       desc: 'Atleta dedicado' },
        nivel_5:     { icon: '⭐', nombre: 'Nivel 5',           desc: 'Subiste al nivel 5' },
        nivel_10:    { icon: '🏆', nombre: 'Nivel 10',          desc: 'Élite de StrongVision' },
    };

    // ── Utilidades generales ──────────────────────────────────
    function getUser() {
        try {
            if (typeof SV_STORAGE !== 'undefined' && SV_STORAGE.obtenerUsuarioActual)
                return SV_STORAGE.obtenerUsuarioActual() || {};
        } catch (e) {}
        return {};
    }

    function getMsgsAdmin() {
        try { return JSON.parse(localStorage.getItem('sv_mensajes_admin') || '[]'); } catch { return []; }
    }

    function getAjustes(uid) {
        try { if (typeof SV_STORAGE !== 'undefined') return SV_STORAGE.obtenerAjustes(uid) || {}; } catch {}
        return {};
    }

    function getGami(uid) {
        try { if (typeof SV_STORAGE !== 'undefined') return SV_STORAGE.obtenerGami(uid) || {}; } catch {}
        return { xp: 0, nivel: 1, racha: 0, logros: [] };
    }

    function getProgreso(uid) {
        try { if (typeof SV_STORAGE !== 'undefined') return SV_STORAGE.obtenerProgreso(uid) || {}; } catch {}
        return { sesiones: [] };
    }

    // Estado de notificaciones de la app (dismiss, logros vistos)
    function getAppState(uid) {
        try { return JSON.parse(localStorage.getItem('sv_notif_app_' + uid) || '{}'); } catch { return {}; }
    }
    function saveAppState(uid, state) {
        localStorage.setItem('sv_notif_app_' + uid, JSON.stringify(state));
    }

    function todayStr() { return new Date().toISOString().slice(0, 10); }
    function yesterdayStr() {
        var d = new Date(); d.setDate(d.getDate() - 1);
        return d.toISOString().slice(0, 10);
    }

    function timeAgo(isoDate) {
        var diff = Date.now() - new Date(isoDate).getTime();
        var min  = Math.floor(diff / 60000);
        if (min < 1)  return L('ahora mismo', 'just now');
        if (min < 60) return L('hace ' + min + ' min', min + ' min ago');
        var h = Math.floor(min / 60);
        if (h < 24) return h === 1 ? L('hace 1 hora', '1 hour ago') : L('hace ' + h + ' horas', h + ' hours ago');
        var d = Math.floor(h / 24);
        return d === 1 ? L('ayer', 'yesterday') : L('hace ' + d + ' días', d + ' days ago');
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = String(str || '');
        return div.innerHTML;
    }

    function getPath(page) {
        var inPages = window.location.pathname.includes('/pages/');
        return inPages ? page : 'pages/' + page;
    }

    // ── Notificaciones admin ──────────────────────────────────
    function getAdminNotifs(uid) {
        return getMsgsAdmin().filter(function (m) {
            return m.usuarioId === uid && m.respuestaNoVista === true;
        });
    }

    // ── Notificaciones de la app ──────────────────────────────
    function getAppNotifs(uid) {
        var aj      = getAjustes(uid);
        var state   = getAppState(uid);
        var notifs  = [];
        var today   = todayStr();
        var yday    = yesterdayStr();
        var diasActivos = aj.dias_recordatorio || [];

        // 1. Recordatorio de entrenamiento
        if (aj.recordatorios !== false && diasActivos.length > 0) {
            var todayDow = new Date().getDay();
            var isTodayActive = diasActivos.some(function (d) { return DAY_MAP[d] === todayDow; });

            if (isTodayActive && state.reminder_dismiss !== today) {
                var hora = aj.hora_recordatorio || '07:00';
                var parts = hora.split(':');
                var now   = new Date();
                var pastHour = now.getHours() > parseInt(parts[0], 10) ||
                               (now.getHours() === parseInt(parts[0], 10) && now.getMinutes() >= parseInt(parts[1] || '0', 10));

                if (pastHour) {
                    var prog = getProgreso(uid);
                    var trainedToday = (prog.sesiones || []).some(function (s) {
                        return s.fecha && s.fecha.slice(0, 10) === today;
                    });
                    if (!trainedToday) {
                        notifs.push({
                            id: 'rec_' + today,
                            type: 'reminder',
                            titulo: L('¡Hoy toca entrenar!', 'Time to train today!'),
                            preview: L('Tu sesión estaba programada a las ' + hora + '. ¿Listo para empezar?', 'Your session was scheduled at ' + hora + '. Ready to start?'),
                            tiempo: L('Hoy', 'Today'),
                            icono: 'bolt',
                            link: getPath('entrenamiento.html'),
                        });
                    }
                }
            }
        }

        // 2. Sesión omitida (ayer era día activo y no entrenó)
        if (aj.notif_sesion_omitida !== false && diasActivos.length > 0) {
            var ydayDate = new Date(); ydayDate.setDate(ydayDate.getDate() - 1);
            var ydayDow  = ydayDate.getDay();
            var wasActive = diasActivos.some(function (d) { return DAY_MAP[d] === ydayDow; });

            if (wasActive && state.missed_dismiss !== yday) {
                var prog2 = getProgreso(uid);
                var trainedYday = (prog2.sesiones || []).some(function (s) {
                    return s.fecha && s.fecha.slice(0, 10) === yday;
                });
                if (!trainedYday) {
                    notifs.push({
                        id: 'missed_' + yday,
                        type: 'missed',
                        titulo: L('Sesión omitida ayer', 'Missed session yesterday'),
                        preview: L('No entrenaste ayer. ¡Retoma hoy tu rutina!', "You didn't train yesterday. Get back to your routine today!"),
                        tiempo: L('Ayer', 'Yesterday'),
                        icono: 'alert',
                        link: getPath('entrenamiento.html'),
                    });
                }
            }
        }

        // 3. Logros desbloqueados no notificados
        if (aj.notif_logros !== false) {
            var gami = getGami(uid);
            var logrosVistas = state.logros_notificados || [];
            (gami.logros || []).forEach(function (logroId) {
                if (logrosVistas.indexOf(logroId) === -1) {
                    var info = LOGRO_NOMBRES[logroId];
                    if (!info) return;
                    notifs.push({
                        id: 'logro_' + logroId,
                        type: 'logro',
                        titulo: info.icon + ' ' + L('Logro desbloqueado: ', 'Achievement unlocked: ') + info.nombre,
                        preview: info.desc,
                        tiempo: L('Reciente', 'Recent'),
                        icono: 'trophy',
                        link: getPath('logros.html'),
                        logroId: logroId,
                    });
                }
            });
        }

        return notifs;
    }

    // Marcar notificación como descartada
    function dismissAppNotif(uid, notif) {
        var state = getAppState(uid);
        if (notif.type === 'reminder') {
            state.reminder_dismiss = todayStr();
        } else if (notif.type === 'missed') {
            state.missed_dismiss = notif.id.replace('missed_', '');
        } else if (notif.type === 'logro') {
            state.logros_notificados = (state.logros_notificados || []).concat([notif.logroId]);
        }
        saveAppState(uid, state);
    }

    // ── Badge ─────────────────────────────────────────────────
    function updateBadge() {
        var dot = document.querySelector('.notif-dot');
        if (!dot) return;
        var user = getUser();
        if (!user.id) return;
        var total = getAdminNotifs(user.id).length + getAppNotifs(user.id).length;
        if (total > 0) {
            dot.textContent = total > 9 ? '9+' : String(total);
            dot.classList.add('has-notif');
        } else {
            dot.textContent = '';
            dot.classList.remove('has-notif');
        }
    }

    // ── SVG icons ─────────────────────────────────────────────
    function svgIcon(type) {
        var icons = {
            chat:   '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
            bolt:   '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
            alert:  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            trophy: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M6 3h12v7a6 6 0 0 1-12 0V3z"/><path d="M12 16v4"/><path d="M8 20h8"/></svg>',
        };
        return icons[type] || '';
    }

    // ── Dropdown HTML ─────────────────────────────────────────
    function buildDropdown(uid) {
        var adminNotifs = getAdminNotifs(uid);
        var appNotifs   = getAppNotifs(uid);
        var total       = adminNotifs.length + appNotifs.length;
        var dest        = getPath('mi-cuenta.html');

        var itemsHTML = '';
        if (total === 0) {
            itemsHTML = '<p class="notif-empty">' + L('Sin notificaciones nuevas', 'No new notifications') + '</p>';
        } else {
            // Admin replies
            itemsHTML += adminNotifs.map(function (msg) {
                var replies  = msg.respuestas || [];
                var admins   = replies.filter(function (r) { return r.admin; });
                var last     = admins.length ? admins[admins.length - 1] : replies[replies.length - 1];
                var tiempo   = last ? timeAgo(last.fecha) : timeAgo(msg.fecha);
                var preview  = last ? last.texto.slice(0, 65) + (last.texto.length > 65 ? '…' : '') : '';
                return (
                    '<div class="notif-item" data-msgid="' + msg.id + '" onclick="window.location.href=\'' + dest + '\'">' +
                        '<div class="notif-item-icon">' + svgIcon('chat') + '</div>' +
                        '<div class="notif-item-body">' +
                            '<div class="notif-item-title">' + L('Admin respondió: ', 'Admin replied: ') + '<strong>' + escapeHtml(msg.asunto) + '</strong></div>' +
                            (preview ? '<div class="notif-item-preview">' + escapeHtml(preview) + '</div>' : '') +
                            '<div class="notif-item-time">' + tiempo + '</div>' +
                        '</div>' +
                        '<svg class="notif-item-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
                    '</div>'
                );
            }).join('');

            // App notifications (reminder, missed, logro)
            itemsHTML += appNotifs.map(function (notif) {
                var iconCls = 'notif-item-icon ' + notif.type;
                return (
                    '<div class="notif-item notif-item-app" data-notifid="' + notif.id + '">' +
                        '<div class="' + iconCls + '">' + svgIcon(notif.icono) + '</div>' +
                        '<div class="notif-item-body">' +
                            '<div class="notif-item-title">' + escapeHtml(notif.titulo) + '</div>' +
                            (notif.preview ? '<div class="notif-item-preview">' + escapeHtml(notif.preview) + '</div>' : '') +
                            '<div class="notif-item-time">' + notif.tiempo + '</div>' +
                        '</div>' +
                        '<button class="notif-dismiss-btn" data-notifid="' + notif.id + '" aria-label="' + L('Descartar','Dismiss') + '" title="' + L('Descartar','Dismiss') + '" onclick="event.stopPropagation()">' +
                            '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                        '</button>' +
                    '</div>'
                );
            }).join('');
        }

        var footHTML = adminNotifs.length > 0
            ? '<div class="notif-drop-foot"><a href="' + dest + '" class="notif-go-soporte">' + L('Ir a soporte →','Go to support →') + '</a></div>'
            : '';

        return (
            '<div class="notif-dropdown" id="notifDropdown" onclick="event.stopPropagation()">' +
                '<div class="notif-drop-head">' +
                    '<span class="notif-drop-title">' + L('Notificaciones','Notifications') + '</span>' +
                    (total > 0 ? '<span class="notif-drop-count">' + total + '</span>' : '') +
                    '<button class="notif-drop-close" id="notifClose" aria-label="' + L('Cerrar','Close') + '">' +
                        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                    '</button>' +
                '</div>' +
                '<div class="notif-drop-body">' + itemsHTML + '</div>' +
                footHTML +
            '</div>'
        );
    }

    // ── Toggle dropdown ───────────────────────────────────────
    var dropdownOpen = false;
    var _uid = null;

    function openDropdown() {
        var existing = document.getElementById('notifDropdown');
        if (existing) existing.remove();

        var btn = document.querySelector('.notif-btn');
        if (!btn) return;

        btn.insertAdjacentHTML('beforeend', buildDropdown(_uid));
        dropdownOpen = true;

        // Cerrar
        var closeBtn = document.getElementById('notifClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', function (e) {
                e.stopPropagation(); closeDropdown();
            });
        }

        // Botones de descartar (app notifications)
        btn.querySelectorAll('.notif-dismiss-btn').forEach(function (dBtn) {
            dBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                var id = this.getAttribute('data-notifid');
                var notif = getAppNotifs(_uid).find(function (n) { return n.id === id; });
                if (notif) { dismissAppNotif(_uid, notif); }
                closeDropdown();
                updateBadge();
                openDropdown();
            });
        });

        // Click en item de app → navegar y descartar
        btn.querySelectorAll('.notif-item-app').forEach(function (item) {
            item.addEventListener('click', function (e) {
                if (e.target.closest('.notif-dismiss-btn')) return;
                var id = this.getAttribute('data-notifid');
                var notif = getAppNotifs(_uid).find(function (n) { return n.id === id; });
                if (notif) {
                    dismissAppNotif(_uid, notif);
                    window.location.href = notif.link;
                }
            });
        });

        setTimeout(function () {
            document.addEventListener('click', onOutsideClick);
        }, 20);
    }

    function closeDropdown() {
        var dd = document.getElementById('notifDropdown');
        if (dd) dd.remove();
        dropdownOpen = false;
        document.removeEventListener('click', onOutsideClick);
    }

    function onOutsideClick(e) {
        var dd  = document.getElementById('notifDropdown');
        var btn = document.querySelector('.notif-btn');
        if (dd && !dd.contains(e.target) && btn && !btn.contains(e.target)) closeDropdown();
    }

    // ── Init ──────────────────────────────────────────────────
    function init() {
        var btn = document.querySelector('.notif-btn');
        if (!btn) return;

        _uid = (getUser() || {}).id || null;
        updateBadge();

        btn.style.cursor = 'pointer';
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdownOpen ? closeDropdown() : openDropdown();
        });

        setInterval(updateBadge, 30000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
