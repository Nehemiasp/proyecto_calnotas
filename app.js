'use strict';

/* ── ESTADO ──────────────────────────────────────────────── */
let cursos = [];
let editandoId = null;

/* ── INIT ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('footer-year').textContent = new Date().getFullYear();
    actualizarTotal();
});

/* ── HELPERS ─────────────────────────────────────────────── */
function redondear(n) { return Math.round(n * 100) / 100; }

function leerNum(id, defVal) {
    const v = parseFloat(document.getElementById(id).value);
    return isNaN(v) ? defVal : v;
}

function validarRango(val, min, max, etiqueta) {
    if (isNaN(val) || val < min || val > max)
        throw new Error(`"${etiqueta}" debe estar entre ${min} y ${max}.`);
    return val;
}

function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ── ACTUALIZAR TOTAL ZONA ───────────────────────────────── */
function actualizarTotal() {
    const zonaMax = leerNum('max-parcial1', 0) + leerNum('max-parcial2', 0)
        + leerNum('max-tareas', 0) + leerNum('max-proyecto', 0);
    const exMax = leerNum('max-examen', 0);
    const total = zonaMax + exMax;

    const pill = document.getElementById('total-zona-pill');
    const isOk = total === 100;
    pill.textContent = isOk ? `${zonaMax} + ${exMax} = 100 pts ✓` : `${zonaMax} + ${exMax} = ${total} pts (debe ser 100)`;
    pill.className = 'total-pill ' + (isOk ? 'total-pill--ok' : 'total-pill--bad');
}

/* ── CALCULAR ESTADO ─────────────────────────────────────── */
function calcularEstado(comp, zonaMinima, punteoMinimo) {
    const { p1, p2, tareas, proyecto, examen, maxP1, maxP2, maxTareas, maxProyecto, maxExamen } = comp;

    const zonaObtenida = redondear(p1 + p2 + tareas + proyecto);
    const zonaMax = maxP1 + maxP2 + maxTareas + maxProyecto;

    // No llegó a zona mínima
    if (zonaObtenida < zonaMinima) {
        return { zonaObtenida, zonaMax, notaFinal: null, estado: 'sin-zona', necesita: null };
    }

    // Con examen
    if (examen !== null) {
        const notaFinal = redondear(zonaObtenida + examen);
        return {
            zonaObtenida, zonaMax, notaFinal,
            estado: notaFinal >= punteoMinimo ? 'aprobado' : 'reprobado',
            necesita: null
        };
    }

    // Simulador (sin examen)
    const notaNecesaria = redondear(punteoMinimo - zonaObtenida);
    if (notaNecesaria <= 0) return { zonaObtenida, zonaMax, notaFinal: null, estado: 'aprobado-zona', necesita: null };
    if (notaNecesaria <= maxExamen) return { zonaObtenida, zonaMax, notaFinal: null, estado: 'simulador', necesita: notaNecesaria };
    return { zonaObtenida, zonaMax, notaFinal: null, estado: 'imposible', necesita: null };
}

/* ── LEER Y VALIDAR FORM ─────────────────────────────────── */
function leerFormulario() {
    const nombre = document.getElementById('nombreCurso').value.trim();
    if (!nombre) throw new Error('Ingresá el nombre del curso.');

    const maxP1 = validarRango(leerNum('max-parcial1', NaN), 1, 100, 'Pts máx — 1er Parcial');
    const maxP2 = validarRango(leerNum('max-parcial2', NaN), 1, 100, 'Pts máx — 2do Parcial');
    const maxTareas = validarRango(leerNum('max-tareas', NaN), 1, 100, 'Pts máx — Tareas');
    const maxProyecto = validarRango(leerNum('max-proyecto', NaN), 1, 100, 'Pts máx — Proyecto');
    const maxExamen = validarRango(leerNum('max-examen', NaN), 1, 100, 'Pts máx — Examen Final');

    const total = maxP1 + maxP2 + maxTareas + maxProyecto + maxExamen;
    if (total !== 100) throw new Error(`Los puntos máximos deben sumar 100. Actualmente suman ${total}.`);

    const notaP1 = leerNota('nota-parcial1', maxP1, '1er Parcial');
    const notaP2 = leerNota('nota-parcial2', maxP2, '2do Parcial');
    const notaTareas = leerNota('nota-tareas', maxTareas, 'Tareas');
    const notaProyecto = leerNota('nota-proyecto', maxProyecto, 'Proyecto de Curso');

    const zonaMinima = validarRango(leerNum('zonaMinima', 26), 1, 99, 'Zona mínima');
    const punteoMinimo = validarRango(leerNum('punteoMinimo', 61), 1, 100, 'Punteo mínimo');

    const notaExamenEl = document.getElementById('nota-examen');
    let notaExamen = null;
    if (notaExamenEl.value !== '') {
        notaExamen = parseFloat(notaExamenEl.value);
        if (isNaN(notaExamen) || notaExamen < 0 || notaExamen > maxExamen)
            throw new Error(`La nota del examen debe estar entre 0 y ${maxExamen}.`);
    }

    const comp = {
        p1: notaP1, p2: notaP2, tareas: notaTareas, proyecto: notaProyecto,
        examen: notaExamen, maxP1, maxP2, maxTareas, maxProyecto, maxExamen
    };
    const { zonaObtenida, zonaMax, notaFinal, estado, necesita } =
        calcularEstado(comp, zonaMinima, punteoMinimo);

    return {
        nombre, notaP1, notaP2, notaTareas, notaProyecto, notaExamen,
        maxP1, maxP2, maxTareas, maxProyecto, maxExamen,
        zonaObtenida, zonaMax, zonaMinima, punteoMinimo, notaFinal, estado, necesita
    };
}

/* ── AGREGAR CURSO ───────────────────────────────────────── */
function agregarCurso() {
    try {
        const datos = leerFormulario();

        if (editandoId !== null) {
            // Modo edición: reemplazar el curso existente
            cursos = cursos.map(c => c.id === editandoId ? { id: editandoId, ...datos } : c);
            mostrarToast(`"${datos.nombre}" actualizado.`, 'success');
            editandoId = null;
            document.getElementById('edit-banner').classList.remove('visible');
            document.getElementById('btn-submit-txt').textContent = 'Agregar curso';
        } else {
            cursos.push({ id: Date.now(), ...datos });
            mostrarToast(`"${datos.nombre}" agregado.`, 'success');
        }

        renderizarCursos();
        limpiarFormulario();

    } catch (err) {
        mostrarToast(err.message, 'error');
    }
}

/* ── EDITAR CURSO ────────────────────────────────────────── */
function editarCurso(id) {
    const c = cursos.find(x => x.id === id);
    if (!c) return;

    editandoId = id;

    document.getElementById('nombreCurso').value = c.nombre;
    document.getElementById('max-parcial1').value = c.maxP1;
    document.getElementById('max-parcial2').value = c.maxP2;
    document.getElementById('max-tareas').value = c.maxTareas;
    document.getElementById('max-proyecto').value = c.maxProyecto;
    document.getElementById('max-examen').value = c.maxExamen;
    document.getElementById('nota-parcial1').value = c.notaP1;
    document.getElementById('nota-parcial2').value = c.notaP2;
    document.getElementById('nota-tareas').value = c.notaTareas;
    document.getElementById('nota-proyecto').value = c.notaProyecto;
    document.getElementById('nota-examen').value = c.notaExamen !== null ? c.notaExamen : '';
    document.getElementById('zonaMinima').value = c.zonaMinima;
    document.getElementById('punteoMinimo').value = c.punteoMinimo;

    actualizarTotal();
    document.getElementById('edit-banner').classList.add('visible');
    document.getElementById('btn-submit-txt').textContent = 'Guardar cambios';
    document.getElementById('form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── CANCELAR EDICIÓN ────────────────────────────────────── */
function cancelarEdicion() {
    editandoId = null;
    document.getElementById('edit-banner').classList.remove('visible');
    document.getElementById('btn-submit-txt').textContent = 'Agregar curso';
    limpiarFormulario();
}

function leerNota(id, max, etiqueta) {
    const el = document.getElementById(id);
    if (el.value === '') throw new Error(`Ingresá la nota de "${etiqueta}".`);
    const v = parseFloat(el.value);
    if (isNaN(v) || v < 0 || v > max) throw new Error(`"${etiqueta}" debe estar entre 0 y ${max}.`);
    return v;
}

/* ── ELIMINAR CURSO ──────────────────────────────────────── */
function eliminarCurso(id) {
    const c = cursos.find(x => x.id === id);
    cursos = cursos.filter(x => x.id !== id);
    renderizarCursos();
    if (c) mostrarToast(`"${c.nombre}" eliminado.`, 'error');
}

/* ── LIMPIAR FORM ────────────────────────────────────────── */
function limpiarFormulario() {
    document.getElementById('nombreCurso').value = '';
    ['nota-parcial1', 'nota-parcial2', 'nota-tareas', 'nota-proyecto', 'nota-examen']
        .forEach(id => document.getElementById(id).value = '');
    // reset max a defaults
    document.getElementById('max-parcial1').value = 15;
    document.getElementById('max-parcial2').value = 15;
    document.getElementById('max-tareas').value = 20;
    document.getElementById('max-proyecto').value = 15;
    document.getElementById('max-examen').value = 35;
    document.getElementById('zonaMinima').value = 26;
    document.getElementById('punteoMinimo').value = 61;
    actualizarTotal();
}

/* ── RENDERIZAR LISTA ────────────────────────────────────── */
function renderizarCursos() {
    const lista = document.getElementById('cursos-lista');
    const empty = document.getElementById('cursos-empty');
    const count = document.getElementById('cursos-count');

    lista.innerHTML = '';
    count.textContent = `${cursos.length} curso${cursos.length !== 1 ? 's' : ''}`;

    if (cursos.length === 0) {
        empty.style.display = 'block';
        lista.style.display = 'none';
    } else {
        empty.style.display = 'none';
        lista.style.display = 'flex';
        cursos.forEach(c => lista.appendChild(crearTarjeta(c)));
    }
    renderizarResumen();
}

/* ── CREAR TARJETA ───────────────────────────────────────── */
function crearTarjeta(c) {
    const card = document.createElement('div');
    card.className = `curso-card curso-card--${c.estado}`;

    // badge y nota
    const info = {
        aprobado: { cls: 'badge--green', txt: '✓ Aprobado', notaCls: 'nota--aprobado', notaVal: c.notaFinal },
        reprobado: { cls: 'badge--red', txt: '✗ Reprobado', notaCls: 'nota--reprobado', notaVal: c.notaFinal },
        simulador: { cls: 'badge--yellow', txt: 'Examen sin ingresar', notaCls: 'nota--simulador', notaVal: '?' },
        imposible: { cls: 'badge--red', txt: '✗ Imposible aprobar', notaCls: 'nota--imposible', notaVal: '✗' },
        'sin-zona': { cls: 'badge--red', txt: '✗ Sin zona mínima', notaCls: 'nota--sin-zona', notaVal: '✗' },
        'aprobado-zona': { cls: 'badge--green', txt: '✓ Aprobado sin examen', notaCls: 'nota--aprobado-zona', notaVal: '✓' },
    }[c.estado];

    const notaHtml = `<span class="curso-nota-final ${info.notaCls}">${info.notaVal}</span>`;
    const badgeHtml = `<span class="badge ${info.cls}">${info.txt}</span>`;

    // zona tag
    const zonaOk = c.zonaObtenida >= c.zonaMinima;
    const zonaTag = `<span class="zona-minima-tag zona-minima-tag--${zonaOk ? 'ok' : 'bad'}">${zonaOk ? '✓ zona ok' : `✗ mínimo ${c.zonaMinima}`}</span>`;

    // mensaje simulador
    let necesitaHtml = '';
    if (c.estado === 'simulador')
        necesitaHtml = `<p class="curso-necesita">Necesitás <strong>${c.necesita}</strong> pts en el examen para aprobar</p>`;
    else if (c.estado === 'aprobado-zona')
        necesitaHtml = `<p class="curso-necesita">Ya aprobás sin necesitar el examen</p>`;
    else if (c.estado === 'imposible')
        necesitaHtml = `<p class="curso-necesita">Ni con el examen completo se llega a ${c.punteoMinimo} pts</p>`;
    else if (c.estado === 'sin-zona')
        necesitaHtml = `<p class="curso-necesita">Zona de ${c.zonaObtenida} pts no llega al mínimo de ${c.zonaMinima} pts</p>`;

    // examen chip
    const examenChip = c.notaExamen !== null
        ? `<span class="comp-chip"><span class="comp-chip-dot d--examen"></span> Examen <strong>${c.notaExamen}/${c.maxExamen}</strong></span>`
        : '';

    card.innerHTML = `
        <div class="curso-card-main">
          <div class="curso-nombre">${escapeHtml(c.nombre)}</div>
          <div class="curso-breakdown">
            <div class="curso-breakdown-group">
              <span class="comp-chip"><span class="comp-chip-dot d--parcial"></span> P1 <strong>${c.notaP1}/${c.maxP1}</strong></span>
              <span class="comp-chip"><span class="comp-chip-dot d--parcial"></span> P2 <strong>${c.notaP2}/${c.maxP2}</strong></span>
              <span class="comp-chip"><span class="comp-chip-dot d--actividad"></span> Tareas <strong>${c.notaTareas}/${c.maxTareas}</strong></span>
              <span class="comp-chip"><span class="comp-chip-dot d--actividad"></span> Proyecto <strong>${c.notaProyecto}/${c.maxProyecto}</strong></span>
              ${examenChip}
            </div>
          </div>
          <div class="zona-bar">
            Zona: <span class="zona-score">${c.zonaObtenida} / ${c.zonaMax} pts</span>
            ${zonaTag}
          </div>
        </div>
        <div class="curso-card-right">
          ${notaHtml}
          ${badgeHtml}
          ${necesitaHtml}
          <div class="card-actions">
            <button class="btn-editar" onclick="editarCurso(${c.id})" title="Editar curso">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-eliminar" onclick="eliminarCurso(${c.id})" title="Eliminar curso">✕</button>
          </div>
        </div>
      `;
    return card;
}

/* ── RESUMEN ─────────────────────────────────────────────── */
function renderizarResumen() {
    const sec = document.getElementById('resumen-section');
    if (cursos.length === 0) { sec.style.display = 'none'; return; }
    sec.style.display = 'block';

    const aprobados = cursos.filter(c => c.estado === 'aprobado' || c.estado === 'aprobado-zona').length;
    const reprobados = cursos.filter(c => ['reprobado', 'imposible', 'sin-zona'].includes(c.estado)).length;
    const conNota = cursos.filter(c => c.notaFinal !== null);
    const promedio = conNota.length
        ? redondear(conNota.reduce((a, c) => a + c.notaFinal, 0) / conNota.length)
        : '—';

    document.getElementById('resumen-aprobados').textContent = aprobados;
    document.getElementById('resumen-reprobados').textContent = reprobados;
    document.getElementById('resumen-promedio').textContent = promedio;
}

/* ── TOAST ───────────────────────────────────────────────── */
function mostrarToast(msg, tipo) {
    const t = document.createElement('div');
    t.className = `toast toast--${tipo === 'success' ? 'success' : 'error'}`;
    t.textContent = msg;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => {
        t.classList.add('toast--out');
        t.addEventListener('animationend', () => t.remove());
    }, 3200);
}