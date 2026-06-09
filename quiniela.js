// ============================================
// QUINIELA MUNDIAL 2026 - SIBARITA SPORT CLUB
// ============================================

// ------------------- DATOS GLOBALES -------------------
let datosQuiniela = {
    ultimaActualizacion: new Date().toISOString(),
    participantes: [],
    partidos: [],
    predicciones: []
};

let usuarioActual = null;
let esAdmin = false;
let adminPassword = "sibarita2026";   // Cambia esta contraseña

// ------------------- PUBLICIDAD LOCAL (CONFIGURABLE) -------------------
const publicidadConfig = {
    anuncios: [
        {
            id: "logo1",
            texto: "SIBARITA SPORT CLUB",
            imagen: "logo_sibarita.jpg",   // ← SIN ESPACIOS (renombra el archivo)
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

// ------------------- CARGA Y GUARDADO (CON SANEAMIENTO TOTAL) -------------------
async function cargarDatos() {
    // 1. Cargar partidos (sin errores fatales)
    try {
        const response = await fetch('quiniela.json');
        const data = await response.json();
        datosQuiniela.partidos = data.partidos;
        console.log('✅ Partidos cargados');
    } catch (error) {
        console.error('Error cargando quiniela.json:', error);
        datosQuiniela.partidos = [];
    }

    // 2. Cargar participantes y predicciones
    try {
        const storedParticipantes = localStorage.getItem('quiniela_participantes');
        const storedPredicciones = localStorage.getItem('quiniela_predicciones');
        if (storedParticipantes) datosQuiniela.participantes = JSON.parse(storedParticipantes);
        if (storedPredicciones) datosQuiniela.predicciones = JSON.parse(storedPredicciones);
    } catch(e) {
        console.warn("Error al cargar participantes/predicciones", e);
    }

    // 3. Limpiar usuario corrupto y cargar si es válido
    try {
        const storedUsuario = localStorage.getItem('quiniela_usuario_actual');
        if (storedUsuario) {
            const parsed = JSON.parse(storedUsuario);
            if (parsed && typeof parsed === 'object' && parsed.nombre && typeof parsed.nombre === 'string') {
                usuarioActual = parsed;
                document.getElementById('userNameDisplay').innerText = usuarioActual.nombre;
                document.getElementById('loginPanel').style.display = 'none';
                document.getElementById('mainPanel').style.display = 'block';
                document.getElementById('userInfo').style.display = 'flex';
            } else {
                localStorage.removeItem('quiniela_usuario_actual');
                usuarioActual = null;
                document.getElementById('userInfo').style.display = 'none';
            }
        } else {
            document.getElementById('userInfo').style.display = 'none';
        }
    } catch(e) {
        console.error("Error crítico con usuario actual", e);
        localStorage.removeItem('quiniela_usuario_actual');
        usuarioActual = null;
        document.getElementById('userInfo').style.display = 'none';
    }

    // 4. 🔥 PUBLICIDAD: se carga SIEMPRE, incluso si hay errores arriba
    cargarPublicidad();
}

function guardarDatos() {
    localStorage.setItem('quiniela_participantes', JSON.stringify(datosQuiniela.participantes));
    localStorage.setItem('quiniela_predicciones', JSON.stringify(datosQuiniela.predicciones));
    // Solo guardar usuario si es válido
    if (usuarioActual && typeof usuarioActual === 'object' && usuarioActual.nombre) {
        localStorage.setItem('quiniela_usuario_actual', JSON.stringify(usuarioActual));
    } else {
        localStorage.removeItem('quiniela_usuario_actual');
    }
}

// ------------------- REGISTRO -------------------
function registrarParticipante(nombre, email) {
    if (!nombre || nombre.trim() === '') {
        alert('⚠️ Ingresa un nombre');
        return false;
    }

    let participante = datosQuiniela.participantes.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
    if (!participante) {
        participante = {
            id: Date.now(),
            nombre: nombre.trim(),
            email: email || '',
            puntos: 0
        };
        datosQuiniela.participantes.push(participante);
    }

    usuarioActual = participante;
    guardarDatos();

    document.getElementById('userNameDisplay').innerText = usuarioActual.nombre;
    document.getElementById('loginPanel').style.display = 'none';
    document.getElementById('mainPanel').style.display = 'block';
    document.getElementById('userInfo').style.display = 'flex';

    mostrarRanking();
    mostrarPartidos();
    cargarPublicidad();     // refrescar publicidad
    return true;
}

function cerrarSesion() {
    usuarioActual = null;
    localStorage.removeItem('quiniela_usuario_actual');
    document.getElementById('loginPanel').style.display = 'block';
    document.getElementById('mainPanel').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('userName').value = '';
    document.getElementById('userEmail').value = '';
    cargarPublicidad(); // asegurar que la publicidad se vea tras cerrar sesión
}

// ------------------- PUNTUACIÓN -------------------
function calcularPuntos(prediccion, resultadoReal) {
    if (!resultadoReal || resultadoReal.resultadoA === null) return 0;
    if (prediccion.golesA === resultadoReal.resultadoA && prediccion.golesB === resultadoReal.resultadoB) return 3;
    if ((prediccion.golesA - prediccion.golesB) === (resultadoReal.resultadoA - resultadoReal.resultadoB)) return 1;
    return 0;
}

function actualizarPuntos() {
    datosQuiniela.participantes.forEach(p => p.puntos = 0);
    datosQuiniela.predicciones.forEach(pred => {
        const partido = datosQuiniela.partidos.find(p => p.id === pred.partido_id);
        if (partido && partido.resultadoA !== null) {
            const puntos = calcularPuntos(pred, partido);
            pred.puntos = puntos;
            const participante = datosQuiniela.participantes.find(p => p.id === pred.usuario_id);
            if (participante) participante.puntos += puntos;
        }
    });
    datosQuiniela.participantes.sort((a, b) => b.puntos - a.puntos);
    guardarDatos();
}

// ------------------- RANKING -------------------
function mostrarRanking() {
    const tbody = document.getElementById('rankingBody');
    if (!tbody) return;
    actualizarPuntos();
    if (datosQuiniela.participantes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">📭 Aún no hay participantes. ¡Sé el primero!</td></tr>';
        return;
    }
    tbody.innerHTML = datosQuiniela.participantes.slice(0, 20).map((p, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${p.nombre}${p.email ? `<br><small>${p.email}</small>` : ''}</td>
            <td><strong>${p.puntos}</strong></td>
        </tr>
    `).join('');
}

// ------------------- PARTIDOS Y PREDICCIONES -------------------
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

function resetearFiltros() {
    document.getElementById('faseFilter').value = 'todos';
    document.getElementById('grupoFilter').value = 'todos';
    mostrarPartidos();
}

// ------------------- COMPARTIR WHATSAPP -------------------
function compartirWhatsApp() {
    if (!usuarioActual) {
        alert('📝 Regístrate primero para compartir');
        return;
    }
    const url = window.location.href;
    const mensaje = `🎯 ¡${usuarioActual.nombre} te invita a la Quiniela del Mundial 2026! 🏆\nParticipa y haz tus predicciones: ${url}\n⚽ ¡Demuestra quién es el mejor!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
}

// ------------------- PUBLICIDAD LOCAL (DISTRIBUCIÓN IZQUIERDA/DERECHA) -------------------
function cargarPublicidad() {
    console.log("cargarPublicidad() ejecutándose");
    const posiciones = ['top', 'before-ranking', 'after-ranking', 'footer'];
    posiciones.forEach(pos => {
        let id = 'ad' + pos.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
        const contenedor = document.getElementById(id);
        if (!contenedor) {
            console.log(`No se encontró el contenedor con id ${id}`);
            return;
        }

        const anunciosPos = publicidadConfig.anuncios.filter(anuncio => anuncio.posicion === pos && anuncio.activo === true);
        if (anunciosPos.length === 0) {
            contenedor.style.display = 'none';
            console.log(`No hay anuncios activos para la posición ${pos}`);
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

// ------------------- ADMINISTRADOR -------------------
function agregarBotonAdmin() {
    const shareContainer = document.querySelector('.share-container');
    if (!shareContainer) return;
    if (document.getElementById('adminBtn')) return;

    const btnAdmin = document.createElement('button');
    btnAdmin.id = 'adminBtn';
    btnAdmin.innerHTML = '👑 Admin';
    btnAdmin.className = 'admin-btn';
    btnAdmin.style.cssText = 'background:#dc3545;border:none;padding:12px 24px;font-weight:bold;border-radius:50px;cursor:pointer;color:white;margin-right:10px;';
    btnAdmin.onclick = () => {
        const pwd = prompt('🔐 Contraseña de administrador:');
        if (pwd === adminPassword) {
            esAdmin = true;
            alert('✅ Acceso de administrador concedido');
            btnAdmin.style.background = '#2e7d32';
            btnAdmin.innerHTML = '👑 Admin (Activo)';
            mostrarPanelAdmin();
        } else if (pwd) alert('❌ Contraseña incorrecta');
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
    panel.style.background = 'rgba(0,0,0,0.95)';
    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 style="color:#ff0000;">👑 PANEL ADMINISTRADOR</h2>
            <button id="cerrarAdminPanelBtn" style="background:#dc3545; border:none; color:white; font-size:20px; padding:5px 15px; border-radius:50%; cursor:pointer;">✖</button>
        </div>
        <p style="color:#ffd700;">⚡ Actualiza los resultados de los partidos</p>
        <div style="margin:15px 0;">
            <label><input type="checkbox" id="mostrarSoloPendientes" checked> 📌 Solo partidos pendientes</label>
        </div>
        <div id="adminPartidosContainer" style="max-height:500px; overflow-y:auto;"></div>
        <div style="margin-top:20px; display:flex; gap:10px; justify-content:space-between; flex-wrap:wrap;">
            <button id="cerrarAdminPanel" style="background:#dc3545; padding:8px 15px;">🔒 Cerrar</button>
            <button id="exportarDatosBtn" style="background:#2196f3; padding:8px 15px;">📥 Exportar datos</button>
            <button id="resetearQuinielaBtn" style="background:#ff9800; padding:8px 15px;" onclick="confirmarResetearQuiniela()">⚠️ Resetear todo</button>
        </div>
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
    if (btn) {
        btn.style.background = '#dc3545';
        btn.innerHTML = '👑 Admin';
    }
}

function cargarAdminPartidos() {
    const container = document.getElementById('adminPartidosContainer');
    if (!container) return;

    const soloPendientes = document.getElementById('mostrarSoloPendientes').checked;
    let partidosFiltrados = soloPendientes
        ? datosQuiniela.partidos.filter(p => p.resultadoA === null)
        : datosQuiniela.partidos;

    if (partidosFiltrados.length === 0) {
        container.innerHTML = '<p>📭 No hay partidos pendientes.</p>';
        return;
    }

    container.innerHTML = partidosFiltrados.map(partido => `
        <div class="admin-partido-card" style="background:#222; padding:12px; margin:10px 0; border-radius:10px; border-left:4px solid ${partido.resultadoA !== null ? '#4caf50' : '#ff9800'}">
            <strong>${partido.fase === 'grupos' ? `Grupo ${partido.grupo}` : partido.fase}</strong><br>
            ${partido.equipoA} vs ${partido.equipoB}<br>
            📅 ${partido.fecha} - ⏰ ${partido.hora}
            ${partido.resultadoA !== null ? `
                <div style="background:#2e7d32; padding:8px; border-radius:5px; margin:8px 0; text-align:center;">
                    ✅ Resultado: ${partido.equipoA} ${partido.resultadoA} - ${partido.resultadoB} ${partido.equipoB}
                    <button onclick="editarResultadoAdmin(${partido.id})" style="background:#ff9800; border:none; padding:3px 10px; border-radius:5px; cursor:pointer;">✏️ Editar</button>
                </div>
            ` : `
                <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap; align-items:center;">
                    <input type="number" id="admin_gA_${partido.id}" placeholder="Goles ${partido.equipoA}" style="width:90px; padding:8px; border-radius:5px;">
                    <span>-</span>
                    <input type="number" id="admin_gB_${partido.id}" placeholder="Goles ${partido.equipoB}" style="width:90px; padding:8px; border-radius:5px;">
                    <button onclick="actualizarResultadoAdmin(${partido.id})" style="background:#4caf50; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">✅ Guardar</button>
                </div>
            `}
        </div>
    `).join('');
}

window.actualizarResultadoAdmin = function(partidoId) {
    if (!esAdmin) { alert('❌ No eres administrador'); return; }
    const gA = parseInt(document.getElementById(`admin_gA_${partidoId}`).value);
    const gB = parseInt(document.getElementById(`admin_gB_${partidoId}`).value);
    if (isNaN(gA) || isNaN(gB) || gA < 0 || gB < 0) { alert('⚠️ Ingresa números válidos'); return; }
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
    if (!esAdmin) { alert('❌ No eres administrador'); return; }
    const partido = datosQuiniela.partidos.find(p => p.id === partidoId);
    if (!partido) return;
    const nuevosA = prompt(`✏️ Goles de ${partido.equipoA} (actual: ${partido.resultadoA})`, partido.resultadoA);
    const nuevosB = prompt(`✏️ Goles de ${partido.equipoB} (actual: ${partido.resultadoB})`, partido.resultadoB);
    if (nuevosA !== null && nuevosB !== null) {
        const gA = parseInt(nuevosA);
        const gB = parseInt(nuevosB);
        if (!isNaN(gA) && !isNaN(gB) && gA >= 0 && gB >= 0) {
            partido.resultadoA = gA;
            partido.resultadoB = gB;
            actualizarPuntos();
            guardarDatos();
            mostrarRanking();
            mostrarPartidos();
            cargarAdminPartidos();
            alert(`✅ Editado: ${partido.equipoA} ${gA} - ${gB} ${partido.equipoB}`);
        } else alert('❌ Valores inválidos');
    }
};

function exportarDatosQuiniela() {
    if (!esAdmin) { alert('❌ No eres administrador'); return; }
    const exportData = {
        fechaExportacion: new Date().toISOString(),
        participantes: datosQuiniela.participantes,
        partidos: datosQuiniela.partidos,
        predicciones: datosQuiniela.predicciones
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiniela_backup_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Datos exportados');
}

function confirmarResetearQuiniela() {
    if (!esAdmin) { alert('❌ No eres administrador'); return; }
    const confirmado = confirm('⚠️ ¿Resetear TODOS los datos? Se perderán participantes, predicciones y resultados.');
    if (confirmado) {
        const clave = prompt('Escribe "RESET" para confirmar:');
        if (clave === 'RESET') {
            datosQuiniela.participantes = [];
            datosQuiniela.predicciones = [];
            datosQuiniela.partidos.forEach(p => { p.resultadoA = null; p.resultadoB = null; });
            guardarDatos();
            usuarioActual = null;
            localStorage.removeItem('quiniela_usuario_actual');
            alert('✅ Quiniela reseteada. La página se recargará.');
            location.reload();
        } else alert('❌ Cancelado');
    }
}

// ------------------- INICIALIZACIÓN -------------------
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM cargado, inicializando...");
    cargarDatos().then(() => {
        mostrarRanking();
        if (usuarioActual) {
            mostrarPartidos();
        }
    }).catch(err => {
        console.error("Error en cargarDatos, pero publicidad ya se cargó internamente", err);
    });

    document.getElementById('registerBtn')?.addEventListener('click', () => {
        registrarParticipante(document.getElementById('userName').value, document.getElementById('userEmail').value);
    });
    document.getElementById('logoutBtn')?.addEventListener('click', cerrarSesion);
    document.getElementById('faseFilter')?.addEventListener('change', mostrarPartidos);
    document.getElementById('grupoFilter')?.addEventListener('change', mostrarPartidos);
    document.getElementById('resetFiltersBtn')?.addEventListener('click', resetearFiltros);
    document.getElementById('shareWhatsAppBtn')?.addEventListener('click', compartirWhatsApp);

    setTimeout(() => agregarBotonAdmin(), 500);

    document.getElementById('userName')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('registerBtn').click();
    });
});

// Funciones globales
window.guardarPrediccion = guardarPrediccion;
window.actualizarResultadoAdmin = actualizarResultadoAdmin;
window.editarResultadoAdmin = editarResultadoAdmin;
window.confirmarResetearQuiniela = confirmarResetearQuiniela;
window.cerrarAdminPanel = cerrarAdminPanel;
window.cargarPublicidad = cargarPublicidad;
