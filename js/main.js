/**
 * StrongVision - Main JS (Landing)
 * =================================
 * Maneja: modales, formularios de auth, toasts, navegación.
 */

// ===== Registrar Service Worker (offline support) =====
if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('[SW] Registrado:', reg.scope))
            .catch(err => console.warn('[SW] No se pudo registrar:', err.message));
    });
}

document.addEventListener('DOMContentLoaded', () => {

    // ===== Auto-open política modal via URL hash =====
    if (window.location.hash === '#politica') {
        setTimeout(() => abrirPolitica('terminos'), 300);
    }

    // ===== Banner de consentimiento localStorage =====
    if (!localStorage.getItem('sv_consent')) {
        const banner = document.getElementById('cookieBanner');
        if (banner) banner.style.display = 'flex';
    }
    const btnConsentir = document.getElementById('btnConsentir');
    if (btnConsentir) {
        btnConsentir.addEventListener('click', () => {
            localStorage.setItem('sv_consent', 'true');
            const banner = document.getElementById('cookieBanner');
            if (banner) {
                banner.classList.add('cookie-fadeout');
                setTimeout(() => { banner.style.display = 'none'; }, 420);
            }
        });
    }

    // ===== Si ya hay sesión activa, ofrecer ir al dashboard =====
    if (SV_AUTH.haySesion()) {
        const usuario = SV_STORAGE.obtenerUsuarioActual();
        // Cambiar botones del nav
        const nav = document.querySelector('.nav-links');
        if (nav) {
            nav.innerHTML = `
                <a href="#features">Características</a>
                <a href="#how-it-works">Cómo funciona</a>
                <span style="color: var(--color-text-muted); font-size: 0.875rem;">Hola, ${escapeHtml(usuario.nombre.split(' ')[0])}</span>
                <a href="pages/dashboard.html" class="btn btn-primary">Ir al Dashboard</a>
                <button class="btn btn-secondary" onclick="logout()">Cerrar sesión</button>
            `;
        }
        // Cambiar CTA del hero
        const heroCta = document.querySelector('.hero-cta');
        if (heroCta) {
            heroCta.innerHTML = `
                <a href="pages/dashboard.html" class="btn btn-primary btn-lg">
                    Ir a mi Dashboard →
                </a>
                <button class="btn btn-ghost btn-lg" onclick="document.getElementById('how-it-works').scrollIntoView({behavior:'smooth'})">
                    Ver cómo funciona
                </button>
            `;
        }
    }

    // ===== Validación inline (debounce, ISO 25010 Usabilidad) =====
    function debounce(fn, ms) {
        let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    }
    function setInlineValidity(input, errorEl, validatorFn) {
        input.addEventListener('input', debounce(() => {
            const err = validatorFn(input.value);
            if (err) {
                input.classList.add('invalid'); input.classList.remove('valid');
                if (errorEl) errorEl.textContent = err;
            } else {
                input.classList.add('valid'); input.classList.remove('invalid');
                if (errorEl) errorEl.textContent = '';
            }
        }, 400));
    }

    // ===== Autocomplete ciudad/dirección con OpenStreetMap Nominatim =====
    function svAutocomplete(inputEl, type) {
        const wrap = document.createElement('div');
        wrap.className = 'sv-ac-wrap';
        inputEl.parentNode.insertBefore(wrap, inputEl);
        wrap.appendChild(inputEl);

        const list = document.createElement('ul');
        list.className = 'sv-ac-list';
        list.setAttribute('role', 'listbox');
        wrap.appendChild(list);

        let abortCtrl = null;
        let focusedIdx = -1;

        function buildUrl(q) {
            const cityVal = type === 'address'
                ? (document.getElementById('reg-ciudad')?.value.trim() || '')
                : '';
            const query = cityVal ? `${q}, ${cityVal}, Colombia` : `${q}, Colombia`;
            return 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({
                q: query,
                format: 'json',
                countrycodes: 'co',
                addressdetails: '1',
                limit: '7',
                'accept-language': 'es'
            });
        }

        function labelOf(item) {
            if (type === 'city') {
                return (item.address?.city || item.address?.town ||
                        item.address?.village || item.address?.municipality ||
                        item.display_name.split(',')[0]).trim();
            }
            return item.display_name.split(',').slice(0, 2).join(',').trim();
        }

        function subOf(item) {
            if (type === 'city') return item.address?.state || '';
            const city = item.address?.city || item.address?.town || item.address?.municipality || '';
            const dept = item.address?.state || '';
            return [city, dept].filter(Boolean).join(', ');
        }

        function render(items) {
            focusedIdx = -1;
            list.innerHTML = '';
            const seen = new Set();
            items.forEach(item => {
                const label = labelOf(item);
                if (seen.has(label.toLowerCase())) return;
                seen.add(label.toLowerCase());

                const li = document.createElement('li');
                li.className = 'sv-ac-item';
                li.setAttribute('role', 'option');
                li.dataset.value = label;
                const sub = subOf(item);
                li.innerHTML = `<span class="sv-ac-main">${escapeHtml(label)}</span>${sub ? `<span class="sv-ac-sub">${escapeHtml(sub)}</span>` : ''}`;
                li.addEventListener('mousedown', e => {
                    e.preventDefault();
                    inputEl.value = label;
                    list.classList.remove('open');
                });
                list.appendChild(li);
            });
            if (list.children.length) list.classList.add('open');
            else list.classList.remove('open');
        }

        const doSearch = debounce(async q => {
            if (q.length < 2) { list.classList.remove('open'); return; }
            if (abortCtrl) abortCtrl.abort();
            abortCtrl = new AbortController();
            list.innerHTML = '<li class="sv-ac-loading">Buscando…</li>';
            list.classList.add('open');
            try {
                const res = await fetch(buildUrl(q), { signal: abortCtrl.signal });
                render(await res.json());
            } catch (err) {
                if (err.name !== 'AbortError') list.classList.remove('open');
            }
        }, 500);

        inputEl.addEventListener('input', () => doSearch(inputEl.value.trim()));

        inputEl.addEventListener('keydown', e => {
            const items = [...list.querySelectorAll('.sv-ac-item')];
            if (!items.length) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); focusedIdx = Math.min(focusedIdx + 1, items.length - 1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); focusedIdx = Math.max(focusedIdx - 1, 0); }
            else if (e.key === 'Enter' && focusedIdx >= 0) {
                e.preventDefault();
                inputEl.value = items[focusedIdx].dataset.value;
                list.classList.remove('open');
                return;
            } else if (e.key === 'Escape') { list.classList.remove('open'); return; }
            items.forEach((el, i) => el.classList.toggle('focused', i === focusedIdx));
            if (focusedIdx >= 0) items[focusedIdx].scrollIntoView({ block: 'nearest' });
        });

        document.addEventListener('click', e => {
            if (!wrap.contains(e.target)) list.classList.remove('open');
        });
    }

    const ciudadInput = document.getElementById('reg-ciudad');
    if (ciudadInput) svAutocomplete(ciudadInput, 'city');

    const direccionInput = document.getElementById('reg-direccion');
    if (direccionInput) svAutocomplete(direccionInput, 'address');

    // ===== Toggle visibilidad contraseña =====
    window.switchLegalTab = function(tab) {
        const panels = { tc: 'legal-tab-tc', hd: 'legal-tab-hd' };
        const btns   = { tc: 'ltab-tc',      hd: 'ltab-hd' };
        Object.entries(panels).forEach(([key, panelId]) => {
            const panel = document.getElementById(panelId);
            const btn   = document.getElementById(btns[key]);
            const active = key === tab;
            if (panel) { if (active) panel.removeAttribute('hidden'); else panel.setAttribute('hidden', ''); }
            if (btn)   { btn.classList.toggle('active', active); btn.setAttribute('aria-selected', active); }
        });
    };

    window.togglePass = function(inputId, btn) {
        const inp = document.getElementById(inputId);
        if (!inp) return;
        const visible = inp.type === 'text';
        inp.type = visible ? 'password' : 'text';
        const eyeOpen = btn.querySelector('.eye-open');
        const eyeOff  = btn.querySelector('.eye-off');
        if (eyeOpen) eyeOpen.style.display = visible ? ''     : 'none';
        if (eyeOff)  eyeOff.style.display  = visible ? 'none' : '';
    };

    // ===== Password Strength Meter + Reglas =====
    const SYM_RE = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?~`]/;
    function calcStrength(pw) {
        let score = 0;
        if (pw.length >= 8)    score++;
        if (/[A-Z]/.test(pw))  score++;
        if (/[0-9]/.test(pw))  score++;
        if (SYM_RE.test(pw))   score++;
        return score;
    }
    function updatePassRules(pw) {
        const rules = {
            'rule-len':   pw.length >= 8,
            'rule-upper': /[A-Z]/.test(pw),
            'rule-num':   /[0-9]/.test(pw),
            'rule-sym':   SYM_RE.test(pw),
        };
        Object.entries(rules).forEach(([id, ok]) => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('ok', ok);
        });
    }
    function checkPassMatch() {
        const p1  = document.getElementById('reg-password')?.value  || '';
        const p2  = document.getElementById('reg-password2')?.value || '';
        const hint = document.getElementById('passMatchHint');
        if (!hint || !p2) return;
        if (p1 === p2) {
            hint.textContent = 'Las contraseñas coinciden';
            hint.className   = 'pass-match-hint ok';
        } else {
            hint.textContent = 'Las contraseñas no coinciden';
            hint.className   = 'pass-match-hint bad';
        }
    }

    const regPassInput = document.getElementById('reg-password');
    const regPass2Input = document.getElementById('reg-password2');
    const strengthFill  = document.getElementById('strengthFill');
    const strengthLabel = document.getElementById('strengthLabel');
    if (regPassInput && strengthFill && strengthLabel) {
        regPassInput.addEventListener('input', () => {
            const pw    = regPassInput.value;
            const score = calcStrength(pw);
            updatePassRules(pw);
            strengthFill.className = 'strength-fill';
            if (pw.length === 0) {
                strengthLabel.textContent = 'Ingresa una contraseña';
            } else if (score <= 1) {
                strengthFill.classList.add('weak');
                strengthLabel.textContent = 'Contraseña débil';
            } else if (score <= 2) {
                strengthFill.classList.add('medium');
                strengthLabel.textContent = 'Contraseña media';
            } else {
                strengthFill.classList.add('strong');
                strengthLabel.textContent = 'Contraseña fuerte';
            }
            if (regPass2Input?.value) checkPassMatch();
        });
    }
    if (regPass2Input) {
        regPass2Input.addEventListener('input', checkPassMatch);
    }

    // Inline validation for registration fields
    const regNombre = document.getElementById('reg-nombre');
    if (regNombre) setInlineValidity(regNombre, document.getElementById('err-reg-nombre'), SV_AUTH.validar.nombre);
    const regCedula = document.getElementById('reg-cedula');
    if (regCedula) setInlineValidity(regCedula, document.getElementById('err-reg-cedula'), SV_AUTH.validar.cedula);
    const regCorreo = document.getElementById('reg-correo');
    if (regCorreo) setInlineValidity(regCorreo, document.getElementById('err-reg-correo'), SV_AUTH.validar.correo);

    // ===== Form Registro =====
    const formReg = document.getElementById('registroForm');
    if (formReg) {
        formReg.addEventListener('submit', (e) => {
            e.preventDefault();
            limpiarErroresForm('registroForm');

            // Validar checkboxes de consentimiento
            const terminos = document.getElementById('reg-terminos')?.checked;
            const habeas   = document.getElementById('reg-habeas')?.checked;
            let consentOk  = true;
            const _isEN = (localStorage.getItem('sv_lang') === 'en-US');
            if (!terminos) {
                const el = document.getElementById('err-reg-terminos');
                if (el) el.textContent = _isEN ? 'You must accept the Terms and Conditions to continue.' : 'Debes aceptar los Términos y Condiciones para continuar.';
                consentOk = false;
            }
            if (!habeas) {
                const el = document.getElementById('err-reg-habeas');
                if (el) el.textContent = _isEN ? 'You must authorize data processing to continue.' : 'Debes autorizar el tratamiento de datos para continuar.';
                consentOk = false;
            }
            if (!consentOk) return;

            // Validar que las contraseñas coincidan
            const _p1 = document.getElementById('reg-password')?.value  || '';
            const _p2 = document.getElementById('reg-password2')?.value || '';
            if (_p1 !== _p2) {
                const el = document.getElementById('err-reg-password2');
                if (el) el.textContent = 'Las contraseñas no coinciden.';
                document.getElementById('reg-password2')?.focus();
                return;
            }

            const datos = {
                nombre:    document.getElementById('reg-nombre').value,
                cedula:    document.getElementById('reg-cedula').value,
                correo:    document.getElementById('reg-correo').value,
                password:  _p1,
                ciudad:    document.getElementById('reg-ciudad').value,
                direccion: document.getElementById('reg-direccion').value,
                acepto_terminos:       true,
                acepto_habeas:         true,
                fecha_consentimiento:  new Date().toISOString()
            };

            const resultado = SV_AUTH.registrar(datos);

            if (!resultado.exito) {
                mostrarErroresForm('reg', resultado.errores);
                const erroresLista = Object.values(resultado.errores).join(' ');
                mostrarFeedback('reg-feedback', 'Se encontraron errores: ' + erroresLista, 'error');
                return;
            }

            mostrarToast(resultado.mensaje, 'success');
            cerrarModal('registroModal');
            // Redirigir a perfil físico para completar datos
            setTimeout(() => {
                window.location.href = 'pages/perfil.html?onboarding=1';
            }, 800);
        });
    }

    // ===== Form Login =====
    const formLog = document.getElementById('loginForm');
    if (formLog) {
        formLog.addEventListener('submit', (e) => {
            e.preventDefault();
            limpiarErroresForm('loginForm');

            const correo = document.getElementById('log-correo').value;
            const password = document.getElementById('log-password').value;

            const resultado = SV_AUTH.iniciarSesion(correo, password);

            if (!resultado.exito) {
                mostrarErroresForm('log', resultado.errores);
                const msg = resultado.errores.general || Object.values(resultado.errores)[0];
                mostrarFeedback('log-feedback', msg, 'error');
                return;
            }

            mostrarToast(resultado.mensaje, 'success');
            cerrarModal('loginModal');
            setTimeout(() => {
                const destino = resultado.usuario.rol === 'admin' ? 'pages/admin.html' : 'pages/dashboard.html';
                window.location.href = destino;
            }, 600);
        });
    }

    // ===== Recuperación — 3 pasos =====
    const N8N_WEBHOOK = 'https://svfitness.app.n8n.cloud/webhook/recovery-code';
    let recCorreoActual = '';

    function recSetStep(n) {
        [1,2,3].forEach(i => {
            document.getElementById('recStep' + i).style.display = i === n ? '' : 'none';
            document.getElementById('recDot' + i).style.background = i <= n ? 'var(--color-primary)' : 'var(--color-border)';
        });
    }

    window.recReset = function() { recCorreoActual = ''; recSetStep(1); };

    async function enviarEmailRecuperacion(nombre, correo, codigo) {
        const html = `
<div style="background:#08080f;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:540px;margin:0 auto;background:#111118;border-radius:16px;overflow:hidden;border:1px solid #1e1e2e;">

    <div style="height:4px;background:#FFD60A;"></div>

    <div style="padding:22px 32px 18px;border-bottom:1px solid #1e1e2e;">
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:middle;">
          <div style="width:38px;height:38px;background:#FFD60A;border-radius:9px;text-align:center;line-height:38px;font-weight:900;font-size:15px;color:#08080f;display:inline-block;">SV</div>
        </td>
        <td style="vertical-align:middle;padding-left:10px;">
          <span style="font-size:1.1rem;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">StrongVision</span>
        </td>
      </tr></table>
    </div>

    <div style="padding:28px 32px;">
      <p style="margin:0 0 6px;font-size:0.95rem;color:#ffffff;">Hola, <strong>${escapeHtml(nombre)}</strong> 👋</p>
      <p style="margin:0 0 24px;font-size:0.85rem;color:#888888;line-height:1.6;">Recibimos una solicitud para recuperar tu contraseña. Usa este código de verificación:</p>
      <div style="font-size:2.8rem;font-weight:900;letter-spacing:0.55em;text-align:center;background:#1a1a28;padding:28px 20px;border-radius:12px;color:#FFD60A;margin:0 0 24px;border:1px solid #2a2a3e;font-family:'Courier New',monospace;">${String(codigo)}</div>
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;"><tr>
        <td style="width:20px;vertical-align:top;padding-top:1px;font-size:0.85rem;">⏱</td>
        <td style="padding-left:6px;font-size:0.85rem;color:#aaaaaa;line-height:1.5;">Este código expira en <strong style="color:#ffffff;">15 minutos</strong>.</td>
      </tr></table>
      <p style="margin:0;font-size:0.8rem;color:#555555;line-height:1.5;">Si no solicitaste esto, puedes ignorar este correo de forma segura.</p>
    </div>

    <div style="padding:14px 32px 20px;border-top:1px solid #1e1e2e;text-align:center;">
      <p style="color:#444444;font-size:0.72rem;margin:0;letter-spacing:0.02em;">— El equipo de StrongVision</p>
    </div>

  </div>
</div>`;

        let res;
        try {
            res = await fetch(N8N_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to_email: correo,
                    subject: 'Tu código de verificación — StrongVision',
                    html
                })
            });
        } catch (netErr) {
            throw new Error('Sin conexión al servidor n8n. ¿Está activo el workflow?');
        }
        if (!res.ok) {
            const texto = await res.text().catch(() => '');
            if (res.status === 404) throw new Error('404 — Activa el workflow en n8n (toggle Active).');
            if (res.status === 500) throw new Error('500 — Error interno en n8n. Revisa los nodos.');
            throw new Error(`Error ${res.status}: ${texto || 'Sin respuesta'}`);
        }
        return true;
    }

    // Paso 1 — enviar código
    const btnEnviarCodigo = document.getElementById('btnEnviarCodigo');
    if (btnEnviarCodigo) {
        btnEnviarCodigo.addEventListener('click', async () => {
            const correo = document.getElementById('rec-correo').value.trim();
            const fb = document.getElementById('rec-feedback-1');
            fb.className = 'form-feedback'; fb.textContent = '';

            const resultado = SV_AUTH.enviarCodigoRecuperacion(correo);
            if (!resultado.exito) {
                const msg = resultado.errores?.correo || 'Correo inválido.';
                fb.textContent = msg; fb.className = 'form-feedback error show'; return;
            }
            if (resultado.sinUsuario) {
                fb.textContent = resultado.mensaje; fb.className = 'form-feedback success show';
                setTimeout(() => cerrarModal('recoverModal'), 2500); return;
            }

            recCorreoActual = resultado.correo;
            document.getElementById('recCorreoMostrado').textContent = resultado.correo;
            btnEnviarCodigo.disabled = true; btnEnviarCodigo.textContent = 'Enviando...';

            try {
                await enviarEmailRecuperacion(resultado.nombre, resultado.correo, resultado.codigo);
                recSetStep(2);
            } catch (err) {
                console.error('[n8n]', err);
                fb.innerHTML = `❌ ${err.message}<br>Código: <strong style="font-size:1.2rem;letter-spacing:3px;">${resultado.codigo}</strong>`;
                fb.className = 'form-feedback warn show';
                setTimeout(() => recSetStep(2), 5000);
            }
            btnEnviarCodigo.disabled = false; btnEnviarCodigo.textContent = 'Enviar código →';
        });
    }

    // Reenviar código
    const btnReenviar = document.getElementById('btnReenviarCodigo');
    if (btnReenviar) {
        btnReenviar.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!recCorreoActual) return;
            const r = SV_AUTH.enviarCodigoRecuperacion(recCorreoActual);
            if (r.exito && !r.sinUsuario) {
                try {
                    await enviarEmailRecuperacion(r.nombre, r.correo, r.codigo);
                    mostrarToast('Código reenviado ✓', 'success');
                } catch { mostrarToast('Error al reenviar. Intenta de nuevo.', 'error'); }
            }
        });
    }

    // Paso 2 — verificar código
    const btnVerificar = document.getElementById('btnVerificarCodigo');
    if (btnVerificar) {
        btnVerificar.addEventListener('click', () => {
            const codigo = document.getElementById('rec-codigo').value.trim();
            const fb = document.getElementById('rec-feedback-2');
            fb.className = 'form-feedback'; fb.textContent = '';

            const r = SV_AUTH.verificarCodigoRecuperacion(recCorreoActual, codigo);
            if (!r.exito) {
                fb.textContent = r.error; fb.className = 'form-feedback error show'; return;
            }
            recSetStep(3);
        });
    }

    // Paso 3 — nueva contraseña
    const btnCambiarPass = document.getElementById('btnCambiarPass');
    if (btnCambiarPass) {
        btnCambiarPass.addEventListener('click', () => {
            const nueva = document.getElementById('rec-nueva-pass').value;
            const confirmar = document.getElementById('rec-confirmar-pass').value;
            const fb = document.getElementById('rec-feedback-3');
            fb.className = 'form-feedback'; fb.textContent = '';

            if (nueva !== confirmar) {
                fb.textContent = 'Las contraseñas no coinciden.'; fb.className = 'form-feedback error show'; return;
            }
            const codigo = document.getElementById('rec-codigo').value.trim();
            const r = SV_AUTH.cambiarPasswordConCodigo(recCorreoActual, codigo, nueva);
            if (!r.exito) {
                fb.textContent = r.error; fb.className = 'form-feedback error show'; return;
            }
            mostrarToast(r.mensaje, 'success');
            cerrarModal('recoverModal');
            recReset();
            setTimeout(() => abrirModal('loginModal'), 400);
        });
    }

    // Validación en vivo (mejor UX)
    document.querySelectorAll('input[required]').forEach(input => {
        input.addEventListener('blur', () => {
            if (input.value.trim() === '') {
                input.classList.add('invalid');
            } else {
                input.classList.remove('invalid');
                input.classList.add('valid');
            }
        });
        input.addEventListener('input', () => {
            input.classList.remove('invalid');
        });
    });
});

// ===== UTILIDADES GLOBALES =====
function abrirModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Focus al primer input
    setTimeout(() => {
        const input = modal.querySelector('input');
        if (input) input.focus();
    }, 100);
}

function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function cambiarModal(deId, aId) {
    cerrarModal(deId);
    setTimeout(() => abrirModal(aId), 200);
}

function abrirPolitica(seccion) {
    abrirModal('politicaModal');
    setTimeout(() => {
        const target = document.getElementById('sec-' + seccion);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
}

function toggleMenu() {
    const nav = document.querySelector('.nav-links');
    const btn = document.querySelector('.menu-toggle');
    if (!nav) return;
    const isOpen = nav.classList.toggle('open');
    if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function logout() {
    SV_AUTH.cerrarSesion();
    mostrarToast('Sesión cerrada correctamente', 'info');
    setTimeout(() => location.reload(), 600);
}

function mostrarToast(mensaje, tipo = 'info', duracion = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = mensaje;
    toast.className = `toast show ${tipo}`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, duracion);
}

function mostrarFeedback(id, mensaje, tipo = 'info') {
    const fb = document.getElementById(id);
    if (!fb) return;
    fb.textContent = mensaje;
    fb.className = `form-feedback show ${tipo}`;
}

function limpiarFeedback(id) {
    const fb = document.getElementById(id);
    if (!fb) return;
    fb.className = 'form-feedback';
    fb.textContent = '';
}

function mostrarErroresForm(prefix, errores) {
    Object.entries(errores).forEach(([campo, msg]) => {
        const errEl = document.getElementById(`err-${prefix}-${campo}`);
        const inputEl = document.getElementById(`${prefix}-${campo}`);
        if (errEl) errEl.textContent = msg;
        if (inputEl) inputEl.classList.add('invalid');
    });
}

function limpiarErroresForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll('.error-msg').forEach(e => e.textContent = '');
    form.querySelectorAll('.invalid').forEach(e => e.classList.remove('invalid'));
    form.querySelectorAll('.form-feedback').forEach(e => {
        e.className = 'form-feedback';
        e.textContent = '';
    });
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Esc cierra modales
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(m => cerrarModal(m.id));
    }
});

/* ================================================
   NUEVO LAYOUT: Sidebar + Tema + Avatar
================================================ */

// ── Toggle tema claro/oscuro ──────────────────────
function _updateLogoTheme(theme) {
    document.querySelectorAll('img[src*="SV_Fitness"]').forEach(img => {
        if (theme === 'light') {
            img.src = img.src.replace('SV_Fitness_white.png', 'SV_Fitness_transparent.png');
        } else {
            img.src = img.src.replace('SV_Fitness_transparent.png', 'SV_Fitness_white.png');
        }
    });
}

function toggleTheme() {
    const html  = document.documentElement;
    const icon  = document.getElementById('themeIcon');
    const label = document.getElementById('themeLabel');
    const isDark = html.getAttribute('data-theme') === 'dark';

    const sunSVG  = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    const moonSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    if (isDark) {
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('sv-theme', 'light');
        if (icon)  icon.innerHTML  = sunSVG;
        if (label) label.textContent = 'Modo oscuro';
        _updateLogoTheme('light');
    } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('sv-theme', 'dark');
        if (icon)  icon.innerHTML  = moonSVG;
        if (label) label.textContent = 'Modo claro';
        _updateLogoTheme('dark');
    }
}

// ── Cargar tema guardado al inicio ───────────────
(function initTheme() {
    const saved = localStorage.getItem('sv-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    const icon  = document.getElementById('themeIcon');
    const label = document.getElementById('themeLabel');
    const sunSVG  = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    const moonSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    if (icon)  icon.innerHTML  = saved === 'dark' ? moonSVG : sunSVG;
    if (label) label.textContent = saved === 'dark' ? 'Modo claro' : 'Modo oscuro';
})();

// ── Actualizar avatar y nombre en el sidebar ─────
function actualizarSidebarUsuario() {
    try {
        const usuario = (typeof SV_STORAGE !== 'undefined' && SV_STORAGE.obtenerUsuarioActual)
            ? (SV_STORAGE.obtenerUsuarioActual() || {})
            : {};
        const nombre  = usuario.nombre || usuario.correo || 'Usuario';
        const inicial = nombre[0].toUpperCase();

        const sbName    = document.getElementById('sidebarUserName');
        const userAvatar = document.getElementById('userAvatar');
        if (sbName)    sbName.textContent    = nombre;
        if (userAvatar) userAvatar.textContent = inicial;

        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle && pageTitle.dataset.personalize === 'true') {
            pageTitle.textContent = `¡Hola, ${nombre}!`;
        }
    } catch(e) {
        console.warn('actualizarSidebarUsuario:', e);
    }
}

// ── Marcar nav item activo automáticamente ───────
(function marcarNavActivo() {
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item[href]').forEach(item => {
        const href = item.getAttribute('href') || '';
        const hrefFile = href.split('/').pop();
        if (hrefFile && filename === hrefFile) {
            item.classList.add('active');
        }
    });
})();

// ── Sidebar mobile toggle ─────────────────────────
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

// ── Cerrar sidebar al hacer click fuera (mobile) ─
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const btn     = document.getElementById('sidebarToggle');
    if (sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && e.target !== btn) {
            sidebar.classList.remove('open');
        }
    }
});

// ── Llamar al cargar la página ───────────────────
document.addEventListener('DOMContentLoaded', () => {
    actualizarSidebarUsuario();
    _updateLogoTheme(localStorage.getItem('sv-theme') || 'dark');
});
