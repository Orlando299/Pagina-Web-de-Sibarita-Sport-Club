// ============================================
// QUINIELA MUNDIAL 2026 - SIBARITA SPORT CLUB
// CON PUNTUACIÓN SEMANAL
// ============================================

let datosQuiniela = {
    ultimaActualizacion: new Date().toISOString(),
    participantes: [],
    partidos: [],
    predicciones: []
};

let usuarioActual = null;
let esAdmin = false;
let adminPassword = "sibarita2026";

// ------------------- PUBLICIDAD (CONFIGURABLE) -------------------
const publicidadConfig = {
    anuncios: [
        {
            id: "logo1",
            texto: "SIBARITA SPORT CLUB",
            imagen: "logo_sibarita.jpg",
            link: "https://wa.me/123456789",
            posicion: "top",
            activo: true
        },
        {
            id: "logo2",
            texto: "CEINPORT",
            imagen: "logo_ingenierosp.webp",
            link: "https://goo.gl/maps/ejemplo",
            posicion: "top",
            activo: true
        }
    ]
};

// ------------------- UTILIDAD: OBTENER SEMANA DESDE FECHA (dd/mm/aaaa) -------------------
function obtenerSemanaDesdeFecha(fechaStr) {
    // fechaStr formato "12/06/2026"
    const partes = fechaStr.split('/');
    if (partes.length !== 3) return 0;
    const dia = parseInt(partes[0]);
    const mes = parseInt(partes[1]) - 1;
    const anio = parseInt(partes[2]);
    const fecha = new Date(anio, mes, dia);
    
    // Calcular semana según la primera semana del año (ISO)
    const primerDiaAnio = new Date(anio, 0, 1);
    const dias = Math.floor((fecha - primerDiaAnio) / (24 * 60 * 60 * 1000));
    const semana = Math.ceil((dias + primerDiaAnio.getDay() + 1) / 7);
    return semana;
}

// ------------------- CARGA Y GUARDADO -------------------
async function cargarDatos() {
    try {
        const response = await fetch('quiniela.json');
        const data = await response.json();
        datosQuiniela.partidos = data.partidos;
        console.log('✅ Partidos cargados');
    } catch (error) {
        console.error('Error cargando quiniela.json:', error);
        datosQuiniela.partidos = [];
    }

    const storedParticipantes = localStorage.getItem('quiniela_participantes');
    const storedPredicciones = localStorage.getItem('quiniela_predicciones');
    if (storedParticipantes) {
        datosQuiniela.participantes = JSON.parse(storedParticipantes);
        // Asegurar que cada participante tenga puntosPorSemana
        datosQuiniela.participantes.forEach(p => {
            if (!p.puntosPorSemana) p.puntosPorSemana = {};
        });
    }
    if (storedPredicciones) datosQuiniela.predicciones = JSON.parse(storedPredicciones);

    // Validar usuario actual
    const storedUsuario = localStorage.getItem('quiniela_usuario_actual');
    if (storedUsuario) {
        try {
            const parsed = JSON.parse(storedUsuario);
            if (parsed && typeof parsed === 'object' && parsed.nombre && typeof parsed.nombre === 'string') {
                usuarioActual = parsed;
                if (!usuarioActual.puntosPorSemana) usuarioActual.puntosPorSemana = {};
                document.getElementById('userNameDisplay').innerText = usuarioActual.nombre;
                document.getElementById('loginPanel').style.display = 'none';
                document.getElementById('mainPanel').style.display = 'block';
                document.getElementById('userInfo').style.display = 'flex';
            } else {
                localStorage.removeItem('quiniela_usuario_actual');
            }
        } catch(e) {
            localStorage.removeItem('quiniela_usuario_actual');
        }
    } else {
        document.getElementById('userInfo').style.display = 'none';
    }

    cargarPublicidad();
}

function guardarDatos() {
    localStorage.setItem('quiniela_participantes', JSON.stringify(datosQuiniela.participantes));
    localStorage.setItem('quiniela_predicciones', JSON.stringify(datosQuiniela.predicciones));
    if (usuarioActual && usuarioActual.nombre) {
        localStorage.setItem('quiniela_usuario_actual', JSON.stringify(usuarioActual));
    } else {
        localStorage.removeItem('quiniela_usuario_actual');
    }
}

// ------------------- PUNTUACIÓN (TOTAL Y SEMANAL) -------------------
function calcularPuntos(prediccion, resultadoReal) {
    if (!resultadoReal || resultadoReal.resultadoA === null) return 0;
    if (prediccion.golesA === resultadoReal.resultadoA && prediccion.golesB === resultadoReal.resultadoB) return 3;
    if ((prediccion.golesA - prediccion.golesB) === (resultadoReal.resultadoA - resultadoReal.resultadoB)) return 1;
    return 0;
}

function actualizarPuntos() {
    // Reiniciar puntos totales y semanales
    datosQuiniela.participantes.forEach(p => {
        p.puntos = 0;
        p.puntosPorSemana = {};
    });

    datosQuiniela.predicciones.forEach(pred => {
        const partido = datosQuiniela.partidos.find(p => p.id === pred.partido_id);
        if (partido && partido.resultadoA !== null) {
            const puntos = calcularPuntos(pred, partido);
            pred.puntos = puntos;

            // Puntos totales
            const participante = datosQuiniela.participantes.find(p => p.id === pred.usuario_id);
            if (participante) {
                participante.puntos += puntos;

                // Puntos semanales
                const semana = obtenerSemanaDesdeFecha(partido.fecha);
                if (semana > 0) {
                    const claveSemana = `semana_${semana}`;
                    if (!participante.puntosPorSemana[claveSemana]) {
                        participante.puntosPorSemana[claveSemana] = 0;
                    }
                    participante.puntosPorSemana[claveSemana] += puntos;
                }
            }
        }
    });

    // Ordenar participantes por puntos totales
    datosQuiniela.participantes.sort((a, b) => b.puntos - a.puntos);
    guardarDatos();
}

// ------------------- RANKING (TOTAL O SEMANAL) -------------------
function mostrarRanking() {
    const tipoRanking = document.getElementById('tipoRanking')?.value || 'total';
    const semanaSeleccionada = document.getElementById('semanaSelector')?.value || '';

    actualizarPuntos();

    let listaParticipantes = [...datosQuiniela.participantes];
    if (tipoRanking === 'semanal' && semanaSeleccionada) {
        // Ordenar por puntos en esa semana
        listaParticipantes.sort((a, b) => {
            const puntosA = a.puntosPorSemana?.[semanaSeleccionada] || 0;
            const puntosB = b.puntosPorSemana?.[semanaSeleccionada] || 0;
            return puntosB - puntosA;
        });
    } else {
        listaParticipantes.sort((a, b) => b.puntos - a.puntos);
    }

    const tbody = document.getElementById('rankingBody');
    if (!tbody) return;

    if (listaParticipantes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">📭 Aún no hay participantes. ¡Sé el primero!</td></tr>';
        return;
    }

    tbody.innerHTML = listaParticipantes.slice(0, 20).map((p, index) => {
        let puntosMostrar = p.puntos;
        if (tipoRanking === 'semanal' && semanaSeleccionada) {
            puntosMostrar = p.puntosPorSemana?.[semanaSeleccionada] || 0;
        }
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${p.nombre}<br><small style="font-size:0.7rem; color:#aaa;">${p.cedula || ''}</small></td>
                <td><strong>${puntosMostrar}</strong></td>
            </tr>
        `;
    }).join('');
}

// ------------------- REGISTRO CON CÉDULA -------------------
function registrarParticipante(nombre, cedula) {
    if (!nombre || nombre.trim() === '') {
        alert('⚠️ Ingresa un nombre válido');
        return false;
    }
    if (!cedula || cedula.trim() === '') {
        alert('⚠️ La cédula es obligatoria');
        return false;
    }
    let cedulaNormalizada = cedula.trim().toUpperCase();
    const cedulaRegex = /^[A-Z0-9\-]{5,20}$/i;
    if (!cedulaRegex.test(cedulaNormalizada)) {
        alert('⚠️ Formato de cédula inválido.');
        return false;
    }

    let participanteExistente = datosQuiniela.participantes.find(p => p.cedula === cedulaNormalizada);
    if (participanteExistente) {
        const confirmar = confirm(`La cédula ${cedulaNormalizada} ya está registrada a nombre de "${participanteExistente.nombre}". ¿Deseas iniciar sesión?`);
        if (confirmar) {
            usuarioActual = participanteExistente;
            guardarDatos();
            document.getElementById('userNameDisplay').innerText = usuarioActual.nombre;
            document.getElementById('loginPanel').style.display = 'none';
            document.getElementById('mainPanel').style.display = 'block';
            document.getElementById('userInfo').style.display = 'flex';
            mostrarRanking();
            mostrarPartidos();
            cargarPublicidad();
            alert(`✅ Bienvenido de nuevo, ${usuarioActual.nombre}`);
        }
        return false;
    }

    const nuevoParticipante = {
        id: Date.now(),
        nombre: nombre.trim(),
        cedula: cedulaNormalizada,
        puntos: 0,
        puntosPorSemana: {}
    };
    datosQuiniela.participantes.push(nuevoParticipante);
    usuarioActual = nuevoParticipante;
    guardarDatos();

    document.getElementById('userNameDisplay').innerText = usuarioActual.nombre;
    document.getElementById('loginPanel').style.display = 'none';
    document.getElementById('mainPanel').style.display = 'block';
    document.getElementById('userInfo').style.display = 'flex';

    mostrarRanking();
    mostrarPartidos();
    cargarPublicidad();
    alert(`✅ Registro exitoso. ¡Bienvenido ${usuarioActual.nombre}!`);
    return true;
}

// ------------------- MOSTRAR PARTIDOS (sin cambios relevantes) -------------------
function mostrarPartidos() {
    const container = document.getElementById('partidosContainer');
    if (!container) return;

    const faseFilter = document.getElementById('faseFilter').value;
    const grupoFilter = document.getElementById('grupoFilter').value;

    let partidosFiltrados = [...datosQuiniela.partidos];
    if (faseFilter !== 'todos') partidosFiltrados = partidosFiltrados.filter(p => p.fase === faseFilter);
    if (grupoFilter !== 'todos' && faseFilter === 'grupos') partidosFiltrados = partidosFiltrados.filter(p => p.grupo === grupoFilter);

    const prediccionesUsuario = {};
    if (usuarioActual) {
        datosQuiniela.predicciones.filter(p => p.usuario_id === usuarioActual.id).forEach(pred => {
            prediccionesUsuario[pred.partido_id] = pred;
        });
    }

    container.innerHTML = partidosFiltrados.map(partido => {
        const prediccion = prediccionesUsuario[partido.id];
        const tieneResultado = partido.resultadoA !== null;
        return `
            <div class="partido-card">
                <div class="partido-header"><span>${partido.fase === 'grupos' ? `📌 Grupo ${partido.grupo}` : partido.fase.toUpperCase()}</span></div>
                <div class="partido-equipos">${partido.equipoA} vs ${partido.equipoB}</div>
                <div class="partido-fecha">📅 ${partido.fecha} - ⏰ ${partido.hora}</div>
                <div class="prediccion-inputs">
                    <input type="number" id="golesA_${partido.id}" placeholder="0" value="${prediccion ? prediccion.golesA : ''}" ${tieneResultado ? 'disabled' : ''}>
                    <span>-</span>
                    <input type="number" id="golesB_${partido.id}" placeholder="0" value="${prediccion ? prediccion.golesB : ''}" ${tieneResultado ? 'disabled' : ''}>
                </div>
                <button onclick="guardarPrediccion(${partido.id})" ${tieneResultado ? 'disabled' : ''}>
                    ${tieneResultado ? '🔒 Finalizado' : (prediccion ? '🔄 Actualizar' : '✅ Guardar')}
                </button>
                ${tieneResultado ? `<div class="resultado-real">🏆 Resultado: ${partido.resultadoA} - ${partido.resultadoB}</div>` : ''}
                ${prediccion && tieneResultado ? `<div class="puntos-obtenidos">⭐ Puntos: ${prediccion.puntos}</div>` : ''}
            </div>
        `;
    }).join('');
}

function guardarPrediccion(partidoId) {
    if (!usuarioActual) {
        alert('📝 Debes registrarte primero');
        return;
    }
    const golesA = parseInt(document.getElementById(`golesA_${partidoId}`).value);
    const golesB = parseInt(document.getElementById(`golesB_${partidoId}`).value);
    if (isNaN(golesA) || isNaN(golesB) || golesA < 0 || golesB < 0) {
        alert('⚠️ Ingresa números válidos (0 o más)');
        return;
    }

    let prediccion = datosQuiniela.predicciones.find(p => p.usuario_id === usuarioActual.id && p.partido_id === partidoId);
    if (prediccion) {
        prediccion.golesA = golesA;
        prediccion.golesB = golesB;
    } else {
        datosQuiniela.predicciones.push({
            usuario_id: usuarioActual.id,
            partido_id: partidoId,
            golesA: golesA,
            golesB: golesB,
            puntos: 0
        });
    }
    guardarDatos();
    actualizarPuntos();
    mostrarRanking();
    mostrarPartidos();
}

// ------------------- COMPARTIR WHATSAPP -------------------
function compartirWhatsApp() {
    if (!usuarioActual) {
        alert('📝 Regístrate primero para compartir');
        return;
    }
    const url = window.location.href;
    const mensaje = `🎯 ¡${usuarioActual.nombre} te invita a la Quiniela del Mundial 2026! 🏆\nParticipa: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
}

// ------------------- PUBLICIDAD -------------------
function cargarPublicidad() {
    console.log("cargarPublicidad() ejecutándose");
    const posiciones = ['top', 'before-ranking', 'after-ranking', 'footer'];
    posiciones.forEach(pos => {
        let id = 'ad' + pos.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
        const contenedor = document.getElementById(id);
        if (!contenedor) return;

        const anunciosPos = publicidadConfig.anuncios.filter(anuncio => anuncio.posicion === pos && anuncio.activo === true);
        if (anunciosPos.length === 0) {
            contenedor.style.display = 'none';
            return;
        }
        contenedor.style.display = 'block';
        const mitad = Math.ceil(anunciosPos.length / 2);
        const izquierda = anunciosPos.slice(0, mitad);
        const derecha = anunciosPos.slice(mitad);
        contenedor.innerHTML = `
            <div class="ad-flex-container">
                <div class="ad-group-left">
                    ${izquierda.map(anuncio => `
                        <div class="ad-item">
                            <a href="${anuncio.link}" target="_blank" rel="noopener noreferrer" class="ad-link">
                                ${anuncio.imagen ? `<img src="${anuncio.imagen}" alt="${anuncio.texto}" class="ad-img">` : ''}
                                ${anuncio.texto ? `<div class="ad-text">${anuncio.texto}</div>` : ''}
                            </a>
                        </div>
                    `).join('')}
                </div>
                <div class="ad-group-right">
                    ${derecha.map(anuncio => `
                        <div class="ad-item">
                            <a href="${anuncio.link}" target="_blank" rel="noopener noreferrer" class="ad-link">
                                ${anuncio.imagen ? `<img src="${anuncio.imagen}" alt="${anuncio.texto}" class="ad-img">` : ''}
                                ${anuncio.texto ? `<div class="ad-text">${anuncio.texto}</div>` : ''}
                            </a>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
}

// ------------------- ADMIN (RESTO DE FUNCIONES) -------------------
function agregarBotonAdmin() {
    const shareContainer = document.querySelector('.share-container');
    if (!shareContainer || document.getElementById('adminBtn')) return;
    const btnAdmin = document.createElement('button');
    btnAdmin.id = 'adminBtn';
    btnAdmin.innerHTML = '👑 Admin';
    btnAdmin.className = 'admin-btn';
    btnAdmin.style.cssText = 'background:#dc3545;border:none;padding:12px 24px;font-weight:bold;border-radius:50px;cursor:pointer;color:white;margin-right:10px;';
    btnAdmin.onclick = () => {
        const pwd = prompt('🔐 Contraseña:');
        if (pwd === adminPassword) {
            esAdmin = true;
            alert('✅ Admin activado');
            btnAdmin.style.background = '#2e7d32';
            btnAdmin.innerHTML = '👑 Admin (Activo)';
            mostrarPanelAdmin();
        } else if (pwd) alert('❌ Incorrecta');
    };
    shareContainer.insertBefore(btnAdmin, shareContainer.firstChild);
}

function mostrarPanelAdmin() {
    if (document.getElementById('adminPanel')) return;
    const mainPanel = document.getElementById('mainPanel');
    if (!mainPanel) return;
    const panel = document.createElement('div');
    panel.id = 'adminPanel';
    panel.className = 'card admin-panel';
    panel.style.border = '2px solid #ff0000';
    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between;"><h2 style="color:#ff0000;">👑 ADMIN</h2><button id="cerrarAdminPanelBtn" style="background:#dc3545; border:none; color:white; cursor:pointer;">✖</button></div>
        <p>⚡ Actualiza resultados</p>
        <div><label><input type="checkbox" id="mostrarSoloPendientes" checked> Solo pendientes</label></div>
        <div id="adminPartidosContainer"></div>
        <div><button id="cerrarAdminPanel" style="background:#dc3545;">Cerrar</button>
        <button id="exportarDatosBtn" style="background:#2196f3;">Exportar</button>
        <button id="resetearQuinielaBtn" style="background:#ff9800;" onclick="confirmarResetearQuiniela()">Resetear</button></div>
    `;
    mainPanel.insertBefore(panel, mainPanel.firstChild);
    document.getElementById('cerrarAdminPanel').addEventListener('click', cerrarAdminPanel);
    document.getElementById('cerrarAdminPanelBtn').addEventListener('click', cerrarAdminPanel);
    document.getElementById('mostrarSoloPendientes').addEventListener('change', cargarAdminPartidos);
    document.getElementById('exportarDatosBtn').addEventListener('click', exportarDatosQuiniela);
    cargarAdminPartidos();
}

function cerrarAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (panel) panel.remove();
    esAdmin = false;
    const btn = document.getElementById('adminBtn');
    if (btn) { btn.style.background = '#dc3545'; btn.innerHTML = '👑 Admin'; }
}

function cargarAdminPartidos() {
    const container = document.getElementById('adminPartidosContainer');
    if (!container) return;
    const soloPendientes = document.getElementById('mostrarSoloPendientes').checked;
    let partidosFiltrados = soloPendientes ? datosQuiniela.partidos.filter(p => p.resultadoA === null) : datosQuiniela.partidos;
    if (partidosFiltrados.length === 0) { container.innerHTML = '<p>📭 No hay partidos pendientes.</p>'; return; }
    container.innerHTML = partidosFiltrados.map(partido => `
        <div style="background:#222; padding:10px; margin:10px 0;">
            <strong>${partido.equipoA} vs ${partido.equipoB}</strong> (${partido.fecha})<br>
            ${partido.resultadoA !== null ? `✅ Resultado: ${partido.resultadoA} - ${partido.resultadoB} <button onclick="editarResultadoAdmin(${partido.id})">Editar</button>` : `
                <input type="number" id="admin_gA_${partido.id}" placeholder="${partido.equipoA}" style="width:80px;"> -
                <input type="number" id="admin_gB_${partido.id}" placeholder="${partido.equipoB}" style="width:80px;">
                <button onclick="actualizarResultadoAdmin(${partido.id})">Guardar</button>
            `}
        </div>
    `).join('');
}

window.actualizarResultadoAdmin = function(partidoId) {
    if (!esAdmin) return;
    const gA = parseInt(document.getElementById(`admin_gA_${partidoId}`).value);
    const gB = parseInt(document.getElementById(`admin_gB_${partidoId}`).value);
    if (isNaN(gA) || isNaN(gB)) return;
    const partido = datosQuiniela.partidos.find(p => p.id === partidoId);
    if (partido) {
        partido.resultadoA = gA;
        partido.resultadoB = gB;
        actualizarPuntos();
        guardarDatos();
        mostrarRanking();
        mostrarPartidos();
        cargarAdminPartidos();
        alert(`✅ ${partido.equipoA} ${gA} - ${gB} ${partido.equipoB}`);
    }
};

window.editarResultadoAdmin = function(partidoId) {
    if (!esAdmin) return;
    const partido = datosQuiniela.partidos.find(p => p.id === partidoId);
    if (!partido) return;
    const nuevosA = prompt(`Goles ${partido.equipoA}:`, partido.resultadoA);
    const nuevosB = prompt(`Goles ${partido.equipoB}:`, partido.resultadoB);
    if (nuevosA !== null && nuevosB !== null) {
        partido.resultadoA = parseInt(nuevosA);
        partido.resultadoB = parseInt(nuevosB);
        actualizarPuntos();
        guardarDatos();
        mostrarRanking();
        mostrarPartidos();
        cargarAdminPartidos();
        alert('✅ Actualizado');
    }
};

function exportarDatosQuiniela() {
    if (!esAdmin) return;
    const dataStr = JSON.stringify(datosQuiniela, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiniela_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function confirmarResetearQuiniela() {
    if (!esAdmin) return;
    if (confirm('¿Resetear todo?')) {
        if (prompt('Escribe RESET') === 'RESET') {
            datosQuiniela.participantes = [];
            datosQuiniela.predicciones = [];
            datosQuiniela.partidos.forEach(p => { p.resultadoA = null; p.resultadoB = null; });
            guardarDatos();
            usuarioActual = null;
            localStorage.removeItem('quiniela_usuario_actual');
            location.reload();
        }
    }
}

// ------------------- INICIALIZACIÓN -------------------
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM cargado, inicializando...");
    cargarDatos().then(() => {
        mostrarRanking();
        if (usuarioActual) mostrarPartidos();
    }).catch(err => console.error(err));

    document.getElementById('registerBtn')?.addEventListener('click', () => {
        registrarParticipante(document.getElementById('userName').value, document.getElementById('userCedula').value);
    });
    document.getElementById('logoutBtn')?.addEventListener('click', cerrarSesion);
    document.getElementById('faseFilter')?.addEventListener('change', mostrarPartidos);
    document.getElementById('grupoFilter')?.addEventListener('change', mostrarPartidos);
    document.getElementById('resetFiltersBtn')?.addEventListener('click', resetearFiltros);
    document.getElementById('shareWhatsAppBtn')?.addEventListener('click', compartirWhatsApp);

    // Selector de ranking (total/semanal)
    const tipoRankingSelect = document.getElementById('tipoRanking');
    const semanaSelect = document.getElementById('semanaSelector');
    if (tipoRankingSelect) {
        tipoRankingSelect.addEventListener('change', () => {
            const esSemanal = tipoRankingSelect.value === 'semanal';
            semanaSelect.style.display = esSemanal ? 'inline-block' : 'none';
            mostrarRanking();
        });
    }
    if (semanaSelect) {
        semanaSelect.addEventListener('change', mostrarRanking);
    }

    setTimeout(() => agregarBotonAdmin(), 500);
});

function resetearFiltros() {
    document.getElementById('faseFilter').value = 'todos';
    document.getElementById('grupoFilter').value = 'todos';
    mostrarPartidos();
}

function cerrarSesion() {
    usuarioActual = null;
    localStorage.removeItem('quiniela_usuario_actual');
    document.getElementById('loginPanel').style.display = 'block';
    document.getElementById('mainPanel').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('userName').value = '';
    document.getElementById('userCedula').value = '';
    cargarPublicidad();
}

window.guardarPrediccion = guardarPrediccion;
window.actualizarResultadoAdmin = actualizarResultadoAdmin;
window.editarResultadoAdmin = editarResultadoAdmin;
window.confirmarResetearQuiniela = confirmarResetearQuiniela;
window.cerrarAdminPanel = cerrarAdminPanel;
