// QUINIELA MUNDIAL 2026 - VERSIÓN COMPLETA CON ADMIN

let datosQuiniela = {
    ultimaActualizacion: new Date().toISOString(),
    participantes: [],
    partidos: [],
    predicciones: []
};

let usuarioActual = null;
let esAdmin = false;
let adminPassword = "sibarita2026";

// Cargar datos
async function cargarDatos() {
    try {
        const response = await fetch('quiniela.json');
        const data = await response.json();
        datosQuiniela.partidos = data.partidos;
    } catch (error) {
        console.error('Error cargando partidos:', error);
    }
    
    const storedParticipantes = localStorage.getItem('quiniela_participantes');
    const storedPredicciones = localStorage.getItem('quiniela_predicciones');
    
    if (storedParticipantes) datosQuiniela.participantes = JSON.parse(storedParticipantes);
    if (storedPredicciones) datosQuiniela.predicciones = JSON.parse(storedPredicciones);
    
    const storedUsuario = localStorage.getItem('quiniela_usuario_actual');
    if (storedUsuario) {
        usuarioActual = JSON.parse(storedUsuario);
        document.getElementById('userNameDisplay').innerText = usuarioActual.nombre;
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('mainPanel').style.display = 'block';
        document.getElementById('userInfo').style.display = 'flex';
    } else {
        document.getElementById('userInfo').style.display = 'none';
    }
}

function guardarDatos() {
    localStorage.setItem('quiniela_participantes', JSON.stringify(datosQuiniela.participantes));
    localStorage.setItem('quiniela_predicciones', JSON.stringify(datosQuiniela.predicciones));
    localStorage.setItem('quiniela_usuario_actual', JSON.stringify(usuarioActual));
}

// Registrar participante
function registrarParticipante(nombre, email) {
    if (!nombre || nombre.trim() === '') {
        alert('Ingresa un nombre');
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
    return true;
}

function cerrarSesion() {
    usuarioActual = null;
    localStorage.removeItem('quiniela_usuario_actual');
    document.getElementById('loginPanel').style.display = 'block';
    document.getElementById('mainPanel').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';
}

// Calcular puntos
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

function mostrarRanking() {
    const tbody = document.getElementById('rankingBody');
    if (!tbody) return;
    actualizarPuntos();
    if (datosQuiniela.participantes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">Sin participantes aún</td></tr>';
        return;
    }
    tbody.innerHTML = datosQuiniela.participantes.slice(0, 20).map((p, index) => `
        <tr><td>${index + 1}</td><td>${p.nombre}</td><td><strong>${p.puntos}</strong></td></tr>
    `).join('');
}

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
                <div class="partido-header"><span>Grupo ${partido.grupo}</span></div>
                <div class="partido-equipos">${partido.equipoA} vs ${partido.equipoB}</div>
                <div class="partido-fecha">${partido.fecha} - ${partido.hora}</div>
                <div class="prediccion-inputs">
                    <input type="number" id="golesA_${partido.id}" placeholder="0" value="${prediccion ? prediccion.golesA : ''}" ${tieneResultado ? 'disabled' : ''}>
                    <span>-</span>
                    <input type="number" id="golesB_${partido.id}" placeholder="0" value="${prediccion ? prediccion.golesB : ''}" ${tieneResultado ? 'disabled' : ''}>
                </div>
                <button onclick="guardarPrediccion(${partido.id})" ${tieneResultado ? 'disabled' : ''}>
                    ${tieneResultado ? 'Finalizado' : (prediccion ? 'Actualizar' : 'Guardar')}
                </button>
                ${tieneResultado ? `<div class="resultado-real">Resultado: ${partido.resultadoA} - ${partido.resultadoB}</div>` : ''}
            </div>
        `;
    }).join('');
}

function guardarPrediccion(partidoId) {
    if (!usuarioActual) { alert('Regístrate primero'); return; }
    const golesA = parseInt(document.getElementById(`golesA_${partidoId}`).value);
    const golesB = parseInt(document.getElementById(`golesB_${partidoId}`).value);
    if (isNaN(golesA) || isNaN(golesB)) { alert('Ingresa números válidos'); return; }
    
    let prediccion = datosQuiniela.predicciones.find(p => p.usuario_id === usuarioActual.id && p.partido_id === partidoId);
    if (prediccion) {
        prediccion.golesA = golesA;
        prediccion.golesB = golesB;
    } else {
        datosQuiniela.predicciones.push({ usuario_id: usuarioActual.id, partido_id: partidoId, golesA, golesB, puntos: 0 });
    }
    guardarDatos();
    actualizarPuntos();
    mostrarRanking();
    mostrarPartidos();
}

function compartirWhatsApp() {
    const url = window.location.href;
    const mensaje = `🏆 Quiniela Mundial 2026 - Participa y gana: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
}

// ========== ADMIN ==========
function agregarBotonAdmin() {
    console.log("Agregando botón admin...");
    const shareContainer = document.querySelector('.share-container');
    if (!shareContainer) {
        console.log("No encontré .share-container");
        return;
    }
    
    if (document.getElementById('adminBtn')) {
        console.log("Botón admin ya existe");
        return;
    }
    
    const adminButton = document.createElement('button');
    adminButton.id = 'adminBtn';
    adminButton.innerHTML = '👑 Admin';
    adminButton.style.cssText = 'background:#dc3545;border:none;padding:12px 24px;font-weight:bold;border-radius:50px;cursor:pointer;color:white;margin-right:10px;';
    adminButton.onclick = () => {
        const pwd = prompt("Contraseña de administrador:");
        if (pwd === adminPassword) {
            esAdmin = true;
            alert("Admin activado");
            adminButton.style.background = "#2e7d32";
            adminButton.innerHTML = "👑 Admin (Activo)";
            mostrarPanelAdmin();
        } else if (pwd) alert("Contraseña incorrecta");
    };
    shareContainer.insertBefore(adminButton, shareContainer.firstChild);
    console.log("Botón admin agregado correctamente");
}

function mostrarPanelAdmin() {
    if (document.getElementById('adminPanel')) return;
    const mainPanel = document.getElementById('mainPanel');
    if (!mainPanel) return;
    
    const panel = document.createElement('div');
    panel.id = 'adminPanel';
    panel.style.cssText = 'background:#000;border:2px solid red;padding:15px;margin-bottom:20px;border-radius:10px;';
    panel.innerHTML = `
        <h3 style="color:red;">👑 ADMINISTRADOR</h3>
        <div id="adminPartidosLista"></div>
        <button onclick="cerrarAdminPanel()" style="background:gray;padding:5px 15px;margin-top:10px;">Cerrar</button>
    `;
    mainPanel.insertBefore(panel, mainPanel.firstChild);
    cargarAdminPartidos();
}

function cerrarAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (panel) panel.remove();
    esAdmin = false;
    const btn = document.getElementById('adminBtn');
    if (btn) {
        btn.style.background = "#dc3545";
        btn.innerHTML = "👑 Admin";
    }
}

function cargarAdminPartidos() {
    const container = document.getElementById('adminPartidosLista');
    if (!container) return;
    
    const partidosPendientes = datosQuiniela.partidos.filter(p => p.resultadoA === null);
    container.innerHTML = `<h4>Partidos pendientes (${partidosPendientes.length})</h4>` + 
        partidosPendientes.map(p => `
            <div style="margin:10px 0;padding:10px;background:#222;border-radius:5px;">
                <strong>${p.equipoA} vs ${p.equipoB}</strong> (${p.fecha})
                <br>
                <input type="number" id="admin_gA_${p.id}" placeholder="Goles A" style="width:60px;">
                -
                <input type="number" id="admin_gB_${p.id}" placeholder="Goles B" style="width:60px;">
                <button onclick="actualizarResultadoAdmin(${p.id})">Guardar</button>
            </div>
        `).join('');
}

window.actualizarResultadoAdmin = function(partidoId) {
    if (!esAdmin) { alert("No eres admin"); return; }
    const gA = parseInt(document.getElementById(`admin_gA_${partidoId}`).value);
    const gB = parseInt(document.getElementById(`admin_gB_${partidoId}`).value);
    if (isNaN(gA) || isNaN(gB)) { alert("Números válidos"); return; }
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

function resetearFiltros() {
    document.getElementById('faseFilter').value = 'todos';
    document.getElementById('grupoFilter').value = 'todos';
    mostrarPartidos();
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos().then(() => {
        mostrarRanking();
        if (usuarioActual) mostrarPartidos();
    });
    
    document.getElementById('registerBtn')?.addEventListener('click', () => {
        registrarParticipante(document.getElementById('userName').value, document.getElementById('userEmail').value);
    });
    document.getElementById('logoutBtn')?.addEventListener('click', cerrarSesion);
    document.getElementById('faseFilter')?.addEventListener('change', mostrarPartidos);
    document.getElementById('grupoFilter')?.addEventListener('change', mostrarPartidos);
    document.getElementById('resetFiltersBtn')?.addEventListener('click', resetearFiltros);
    document.getElementById('shareWhatsAppBtn')?.addEventListener('click', compartirWhatsApp);
    
    // IMPORTANTE: Agregar el botón admin
    setTimeout(() => agregarBotonAdmin(), 500);
});

window.guardarPrediccion = guardarPrediccion;
window.actualizarResultadoAdmin = actualizarResultadoAdmin;
window.cerrarAdminPanel = cerrarAdminPanel;
