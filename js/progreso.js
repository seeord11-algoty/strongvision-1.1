/**
 * StrongVision - Progreso JS
 * ===========================
 * Cubre RFU-6 y RFU-8: TC-024 (gráfica semanal), TC-029 (filtro fecha),
 * TC-030 (filtro grupo), TC-031 (exportar PDF).
 */

(function() {
    'use strict';

    if (!SV_AUTH.requireAuth('../index.html')) return;
    const usuario = SV_STORAGE.obtenerUsuarioActual();
    const isEN = (localStorage.getItem('sv_lang') || 'es-CO') === 'en-US';
    const L = (es, en) => isEN ? en : es;

    let progreso = null;

    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('avatarLetter').textContent = usuario.nombre.charAt(0).toUpperCase();
        document.getElementById('userAvatar').addEventListener('click', () => {
            document.getElementById('userDropdown').classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                document.getElementById('userDropdown')?.classList.remove('open');
            }
        });

        progreso = SV_STORAGE.obtenerProgreso(usuario.id);

        if (!progreso.sesiones || progreso.sesiones.length === 0) {
            document.getElementById('sinDatos').style.display = 'block';
            return;
        }

        document.getElementById('conDatos').style.display = 'block';
        renderKPIs();
        renderChartSemanal();
        renderChartGrupos();
        renderHistorial();
        renderMolestias();

        // Filtros
        document.getElementById('filtroDesde').addEventListener('change', renderHistorial);
        document.getElementById('filtroHasta').addEventListener('change', renderHistorial);
        document.getElementById('filtroGrupo').addEventListener('change', renderHistorial);
        document.getElementById('btnLimpiarFiltros').addEventListener('click', () => {
            document.getElementById('filtroDesde').value = '';
            document.getElementById('filtroHasta').value = '';
            document.getElementById('filtroGrupo').value = '';
            renderHistorial();
        });

        // Exportar PDF (TC-031)
        document.getElementById('btnExportar').addEventListener('click', exportarPDF);
    });

    function renderKPIs() {
        const totalSesiones = progreso.sesiones.length;
        const tiempoTotal = progreso.sesiones.reduce((acc, s) => acc + (s.duracion_min || 0), 0);
        const caloriasTotal = progreso.sesiones.reduce((acc, s) => acc + (s.calorias || 0), 0);
        const rpes = progreso.sesiones.map(s => s.rpe).filter(Boolean);
        const rpePromedio = rpes.length > 0 ? (rpes.reduce((a,b) => a+b, 0) / rpes.length).toFixed(1) : '-';

        document.getElementById('kpiSesiones').textContent = totalSesiones;
        document.getElementById('kpiTiempo').innerHTML = `${(tiempoTotal/60).toFixed(1)}<small>h</small>`;
        document.getElementById('kpiCalorias').textContent = caloriasTotal.toLocaleString();
        document.getElementById('kpiRPE').textContent = rpePromedio;
    }

    function renderChartSemanal() {
        // Agrupar últimas 8 semanas
        const ahora = new Date();
        const semanas = [];
        for (let i = 7; i >= 0; i--) {
            const lunes = new Date(ahora);
            lunes.setDate(ahora.getDate() - ahora.getDay() + 1 - (i * 7));
            lunes.setHours(0,0,0,0);
            const domingo = new Date(lunes);
            domingo.setDate(lunes.getDate() + 6);
            domingo.setHours(23,59,59,999);

            const sesionesSemana = progreso.sesiones.filter(s => {
                const f = new Date(s.fecha);
                return f >= lunes && f <= domingo;
            });

            semanas.push({
                label: `${lunes.getDate()}/${lunes.getMonth()+1}`,
                count: sesionesSemana.length
            });
        }

        const max = Math.max(1, ...semanas.map(s => s.count));
        const cont = document.getElementById('chartSemanal');
        cont.innerHTML = semanas.map(s => {
            const altura = (s.count / max) * 100;
            return `
                <div class="chart-bar" style="height: ${altura}%;" title="${s.count} sesiones - semana del ${s.label}">
                    <span class="chart-bar-value">${s.count}</span>
                    <span class="chart-bar-label">${s.label}</span>
                </div>
            `;
        }).join('');
    }

    const GRUPO_COLORS = {
        'pecho':    '#60a5fa',
        'espalda':  '#34d399',
        'piernas':  '#a78bfa',
        'hombros':  '#fb923c',
        'brazos':   '#f472b6',
        'core':     '#2dd4bf',
        'abdomen':  '#2dd4bf',
        'glúteos':  '#f87171',
        'gluteos':  '#f87171',
    };

    function renderChartGrupos() {
        // Agrupar series por grupo muscular en últimas 4 semanas
        const hace4Sem = new Date();
        hace4Sem.setDate(hace4Sem.getDate() - 28);

        const grupos = {};
        progreso.sesiones
            .filter(s => new Date(s.fecha) >= hace4Sem)
            .forEach(s => {
                (s.registros || []).forEach(r => {
                    if (!r.omitido && r.grupo) {
                        const series = (r.series_realizadas || []).length || 1;
                        grupos[r.grupo] = (grupos[r.grupo] || 0) + series;
                    }
                });
            });

        const grupos_arr = Object.entries(grupos)
            .sort((a,b) => b[1] - a[1])
            .slice(0, 7);

        const cont = document.getElementById('chartGrupos');

        if (grupos_arr.length === 0) {
            cont.innerHTML = '<p style="color: var(--color-text-muted); text-align:center; width:100%;">No hay datos suficientes en las últimas 4 semanas.</p>';
            return;
        }

        const max = Math.max(1, ...grupos_arr.map(g => g[1]));
        cont.innerHTML = grupos_arr.map(([grupo, series]) => {
            const altura = (series / max) * 100;
            const color = GRUPO_COLORS[grupo.toLowerCase()] || '#a78bfa';
            return `
                <div class="chart-bar" style="height: ${altura}%; --bar-c: ${color}" title="${series} series en ${grupo}">
                    <span class="chart-bar-value">${series}</span>
                    <span class="chart-bar-label">${capitalize(grupo)}</span>
                </div>
            `;
        }).join('');
    }

    function renderHistorial() {
        const desde = document.getElementById('filtroDesde').value;
        const hasta = document.getElementById('filtroHasta').value;
        const grupo = document.getElementById('filtroGrupo').value;

        let sesiones = [...progreso.sesiones].reverse();

        if (desde) {
            const d = new Date(desde);
            sesiones = sesiones.filter(s => new Date(s.fecha) >= d);
        }
        if (hasta) {
            const h = new Date(hasta);
            h.setHours(23,59,59,999);
            sesiones = sesiones.filter(s => new Date(s.fecha) <= h);
        }
        if (grupo) {
            sesiones = sesiones.filter(s =>
                (s.registros || []).some(r => r.grupo === grupo)
            );
        }

        const tbody = document.getElementById('historialTbody');
        const empty = document.getElementById('historialEmpty');

        if (sesiones.length === 0) {
            tbody.innerHTML = '';
            empty.style.display = 'block';
            return;
        }
        empty.style.display = 'none';

        tbody.innerHTML = sesiones.map(s => `
            <tr>
                <td>${formatFecha(s.fecha)}</td>
                <td>Día ${s.dia}</td>
                <td>${capitalize(s.enfoque || '-')}</td>
                <td>${s.ejercicios_realizados}/${s.ejercicios_total}</td>
                <td>${s.duracion_min || 0} min</td>
                <td>${s.rpe || '-'}</td>
                <td>${s.calorias || 0}</td>
            </tr>
        `).join('');
    }

    function renderMolestias() {
        const cont = document.getElementById('molestiasContenido');
        const molestias = progreso.molestias || [];

        if (molestias.length === 0) return;

        // Conteo por zona
        const zonas = {};
        molestias.forEach(m => zonas[m.zona] = (zonas[m.zona] || 0) + 1);

        cont.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--sp-sm); margin-bottom: var(--sp-md);">
                ${Object.entries(zonas).map(([zona, count]) => `
                    <div class="stat-card" style="border-color: ${count >= 2 ? 'var(--color-warning)' : 'var(--color-border)'};">
                        <div class="stat-label">${capitalize(zona)}</div>
                        <div class="stat-value" style="color: ${count >= 2 ? 'var(--color-warning)' : 'var(--color-text)'}">${count}</div>
                    </div>
                `).join('')}
            </div>
            <h3 style="font-size: var(--fs-md); margin-bottom: var(--sp-sm);">Últimas molestias reportadas</h3>
            <table class="table">
                <thead>
                    <tr><th>Fecha</th><th>Zona</th><th>Ejercicio</th></tr>
                </thead>
                <tbody>
                    ${molestias.slice(-10).reverse().map(m => `
                        <tr>
                            <td>${formatFecha(m.fecha)}</td>
                            <td><span class="tag warn">${capitalize(m.zona)}</span></td>
                            <td>${escapeHtml(m.ejercicio || '-')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // ===== EXPORTAR PDF (TC-031) =====
    function exportarPDF() {
        // Estrategia: abrir ventana con HTML imprimible y window.print()
        const sesiones = progreso.sesiones;
        const totalSesiones = sesiones.length;
        const tiempoTotal = sesiones.reduce((acc, s) => acc + (s.duracion_min || 0), 0);
        const caloriasTotal = sesiones.reduce((acc, s) => acc + (s.calorias || 0), 0);

        const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Reporte StrongVision - ${usuario.nombre}</title><style>
            body{font-family:Arial,sans-serif;padding:30px;color:#222;line-height:1.5;}
            h1{color:#0a4a3a;border-bottom:3px solid #00d4ff;padding-bottom:10px;}
            h2{color:#0a4a3a;margin-top:25px;border-bottom:1px solid #ccc;padding-bottom:5px;}
            table{width:100%;border-collapse:collapse;margin:15px 0;font-size:13px;}
            th,td{padding:8px;text-align:left;border:1px solid #ddd;}
            th{background:#0a1228;color:#fff;}
            tr:nth-child(even){background:#f5f5f5;}
            .header{display:flex;justify-content:space-between;align-items:center;}
            .header img{height:40px;}
            .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin:15px 0;}
            .kpi{padding:15px;border:1px solid #ddd;border-radius:8px;text-align:center;}
            .kpi .num{font-size:24px;font-weight:bold;color:#0a4a3a;}
            .kpi .lbl{font-size:11px;color:#666;text-transform:uppercase;}
            .footer{margin-top:30px;padding-top:15px;border-top:1px solid #ccc;font-size:11px;color:#666;text-align:center;}
            @media print{body{padding:15mm;}}
        </style></head><body>
            <div class="header">
                <h1>📊 Reporte StrongVision</h1>
                <div style="text-align:right;font-size:12px;">
                    <strong>${escapeHtml(usuario.nombre)}</strong><br>
                    ${escapeHtml(usuario.correo)}<br>
                    Generado: ${new Date().toLocaleDateString('es-CO')}
                </div>
            </div>

            <h2>Resumen general</h2>
            <div class="kpi-grid">
                <div class="kpi"><div class="num">${totalSesiones}</div><div class="lbl">Sesiones</div></div>
                <div class="kpi"><div class="num">${(tiempoTotal/60).toFixed(1)}h</div><div class="lbl">Tiempo total</div></div>
                <div class="kpi"><div class="num">${caloriasTotal.toLocaleString()}</div><div class="lbl">Calorías</div></div>
                <div class="kpi"><div class="num">${(progreso.molestias || []).length}</div><div class="lbl">Molestias</div></div>
            </div>

            <h2>Historial de sesiones</h2>
            <table>
                <thead>
                    <tr><th>Fecha</th><th>Día</th><th>Enfoque</th><th>Ejercicios</th><th>Tiempo</th><th>RPE</th><th>Calorías</th></tr>
                </thead>
                <tbody>
                    ${sesiones.map(s => `
                        <tr>
                            <td>${formatFecha(s.fecha)}</td>
                            <td>Día ${s.dia}</td>
                            <td>${capitalize(s.enfoque || '-')}</td>
                            <td>${s.ejercicios_realizados}/${s.ejercicios_total}</td>
                            <td>${s.duracion_min} min</td>
                            <td>${s.rpe || '-'}</td>
                            <td>${s.calorias || 0}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            ${(progreso.molestias || []).length > 0 ? `
                <h2>Molestias reportadas</h2>
                <table>
                    <thead><tr><th>Fecha</th><th>Zona</th><th>Ejercicio</th></tr></thead>
                    <tbody>
                        ${progreso.molestias.map(m => `
                            <tr><td>${formatFecha(m.fecha)}</td><td>${capitalize(m.zona)}</td><td>${escapeHtml(m.ejercicio || '-')}</td></tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : ''}

            <div class="footer">
                <strong>StrongVision</strong> · Plataforma fitness con IA personalizada<br>
                Reporte generado automáticamente · No reemplaza consulta médica profesional
            </div>
            <script>window.onload=()=>setTimeout(()=>window.print(),300);</script>
        </body></html>`;

        const ventana = window.open('', '_blank');
        ventana.document.write(html);
        ventana.document.close();
        mostrarToast(L('Reporte generado. Usa "Guardar como PDF" en el diálogo de impresión.', 'Report generated. Use "Save as PDF" in the print dialog.'), 'success', 5000);
    }

    // ===== UTILIDADES =====
    function capitalize(s) {
        if (!s) return '';
        return String(s).charAt(0).toUpperCase() + String(s).slice(1).replace(/_/g, ' ');
    }
    function escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }
    function formatFecha(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' });
    }
    function mostrarToast(mensaje, tipo, dur = 3000) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = mensaje;
        toast.className = `toast show ${tipo}`;
        setTimeout(() => toast.classList.remove('show'), dur);
    }
    window.cerrarSesionApp = function() {
        SV_AUTH.cerrarSesion();
        setTimeout(() => window.location.href = '../index.html', 300);
    };
})();
