// ================== REGISTRO (MODIFICADO) ==================
async function registrarParticipante(nombre, cedula) {
    // ... validaciones iguales ...
    const nuevoParticipante = {
        id: Date.now(),
        nombre: nombre.trim(),
        cedula: cedulaNormalizada,
        puntos: 0,
        puntosPorSemana: {},
        puntosPorFase: {}   // NUEVO
    };
    // ... resto igual ...
}

// ================== CARGAR FASES (NUEVA) ==================
function cargarFasesDisponibles() {
    const fasesSet = new Set();
    datosQuiniela.partidos.forEach(partido => {
        if (partido.fase) fasesSet.add(partido.fase);
    });
    const ordenFases = ['grupos', '16avos', 'Octavos', 'Cuartos', 'Semifinales', 'Final', 'Tercer puesto'];
    const fases = Array.from(fasesSet).sort((a, b) => ordenFases.indexOf(a) - ordenFases.indexOf(b));
    const selector = document.getElementById('semanaSelector');
    if (selector) {
        selector.innerHTML = '<option value="global">🔵 Puntos Globales</option>' +
            fases.map(f => `<option value="${f}">🏆 ${f.charAt(0).toUpperCase() + f.slice(1)}</option>`).join('');
    }
}

// ================== ACTUALIZAR PUNTOS (MODIFICADO) ==================
function actualizarPuntos() {
    datosQuiniela.participantes.forEach(p => {
        p.puntos = 0;
        p.puntosPorSemana = {};
        p.puntosPorFase = {};   // NUEVO
    });

    datosQuiniela.predicciones.forEach(pred => {
        const partido = datosQuiniela.partidos.find(p => p.id === pred.partido_id);
        if (partido && partido.resultadoA !== null) {
            const puntos = calcularPuntos(pred, partido);
            pred.puntos = puntos;
            const participante = datosQuiniela.participantes.find(p => p.id === pred.usuario_id);
            if (participante) {
                participante.puntos += puntos;
                // Semana (sigue igual)
                const semana = obtenerSemanaDesdeFecha(partido.fecha);
                if (semana) {
                    const clave = `semana_${semana}`;
                    participante.puntosPorSemana[clave] = (participante.puntosPorSemana[clave] || 0) + puntos;
                }
                // Fase (NUEVO)
                if (partido.fase) {
                    const fase = partido.fase;
                    participante.puntosPorFase[fase] = (participante.puntosPorFase[fase] || 0) + puntos;
                }
            }
        }
    });

    datosQuiniela.participantes.sort((a, b) => b.puntos - a.puntos);
}

// ================== MOSTRAR RANKING (MODIFICADO) ==================
function mostrarRanking() {
    const tbody = document.getElementById('rankingBody');
    if (!tbody) return;

    const tipoSeleccionado = document.getElementById('semanaSelector')?.value || 'global';
    
    if (datosQuiniela.participantes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">📭 Aún no hay participantes. ¡Sé el primero!</td></tr>';
        return;
    }

    let participantesOrdenados = [...datosQuiniela.participantes];

    if (tipoSeleccionado === 'global') {
        participantesOrdenados.sort((a, b) => b.puntos - a.puntos);
    } else if (tipoSeleccionado.startsWith('semana_')) {
        participantesOrdenados.sort((a, b) => (b.puntosPorSemana?.[tipoSeleccionado] || 0) - (a.puntosPorSemana?.[tipoSeleccionado] || 0));
    } else {
        // Es una fase
        participantesOrdenados.sort((a, b) => (b.puntosPorFase?.[tipoSeleccionado] || 0) - (a.puntosPorFase?.[tipoSeleccionado] || 0));
    }

    tbody.innerHTML = participantesOrdenados.map((p, index) => {
        const puntosGlobal = p.puntos;
        let puntosFiltrados = '—';
        if (tipoSeleccionado === 'global') {
            puntosFiltrados = puntosGlobal;
        } else if (tipoSeleccionado.startsWith('semana_')) {
            puntosFiltrados = p.puntosPorSemana?.[tipoSeleccionado] || 0;
        } else {
            puntosFiltrados = p.puntosPorFase?.[tipoSeleccionado] || 0;
        }
        return `
            <tr>
                <td style="padding: 8px; text-align: center;">${index + 1}</td>
                <td style="padding: 8px;">${p.nombre}<br><small style="font-size:0.7rem; color:#aaa;">${p.cedula || ''}</small></td>
                <td style="padding: 8px; text-align: center;"><strong>${puntosGlobal}</strong></td>
                <td style="padding: 8px; text-align: center;"><strong>${puntosFiltrados}</strong></td>
            </tr>
        `;
    }).join('');
}
