// ============================================
// QUINIELA MUNDIAL 2026 - SIBARITA SPORT CLUB
// CON FIREBASE Y 3 LOGOS CENTRADOS EN TOP
// ============================================

// ------------------- CONFIGURACIÓN DE FIREBASE -------------------
const firebaseConfig = {
    apiKey: "AIzaSyDqwbgPuD6-pl90xyVdFV64HM-kvuIZV-I",
    authDomain: "sibarita-torneo-bolas-criollas.firebaseapp.com",
    projectId: "sibarita-torneo-bolas-criollas",
    storageBucket: "sibarita-torneo-bolas-criollas.firebasestorage.app",
    messagingSenderId: "466460618853",
    appId: "1:466460618853:web:b24f848eb8bb794b6e568c"
};

// Inicializar Firebase (versión compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ------------------- DATOS GLOBALES -------------------
let datosQuiniela = {
    ultimaActualizacion: new Date().toISOString(),
    participantes: [],
    partidos: [],
    predicciones: []
};

let usuarioActual = null;
let esAdmin = false;
let adminPassword = "sibarita2026";

// ------------------- PUBLICIDAD (3 LOGOS EN TOP, CENTRADOS) -------------------
const publicidadConfig = {
    anuncios: [
        {
            id: "logo1",
            texto: "SIBARITA SPORT CLUB",
            imagen: "logo_sibarita.jpg",
            link: "#",
            posicion: "top",
            activo: true
        },
        {
            id: "logo2",
            texto: "CEINPORT",
            imagen: "logo_ingenierosp.webp",
            link: "#",
            posicion: "top",
            activo: true
        },
        {
            id: "logo3",
            texto: "Scoobydoo Burguer",
            imagen: "logo_scooby.jpg",
            link: "#",
            posicion: "top",
            activo: true
        },
        {
            id: "logo4",
            texto: "Sibarita Restaurant",
            imagen: "logo_sibarita.png",
            link: "#",
            posicion: "top",
            activo: true
        },
        {
            id: "logo5",
            texto: "Bunker Restobar",
            imagen: "logo_yusbelis.png",
            link: "#",
            posicion: "top",
            activo: true
        }
    ]
};

// ------------------- FUNCIONES DE FIREBASE -------------------
async function cargarParticipantesFirebase() {
    try {
        const snapshot = await db.collection('quiniela_participantes').get();
        datosQuiniela.participantes = [];
        snapshot.forEach(doc => {
            datosQuiniela.participantes.push(doc.data());
        });
        console.log(`✅ Cargados ${datosQuiniela.participantes.length} participantes desde Firebase`);
    } catch (error) {
        console.error("Error cargando participantes:", error);
        datosQuiniela.participantes = [];
    }
}

// ------------------- CARGA DE PARTIDOS CON FIREBASE -------------------
async function cargarPartidosDesdeFirebase() {
    try {
        const snapshot = await db.collection('quiniela_partidos').get();
        if (!snapshot.empty) {
            datosQuiniela.partidos = [];
            snapshot.forEach(doc => {
                datosQuiniela.partidos.push(doc.data());
            });
            console.log("✅ Partidos cargados desde Firebase");
        } else {
            // Si no hay partidos en Firebase, cargar desde JSON y guardarlos
            await cargarPartidosDesdeJSON();
        }
    } catch (error) {
        console.error("Error cargando partidos desde Firebase:", error);
        await cargarPartidosDesdeJSON();
    }
}

async function cargarPartidosDesdeJSON() {
    try {
        const response = await fetch('quiniela.json');
        const data = await response.json();
        datosQuiniela.partidos = data.partidos;
        // Guardar cada partido en Firebase (solo la primera vez)
        for (const partido of datosQuiniela.partidos) {
            await db.collection('quiniela_partidos').doc(partido.id.toString()).set(partido);
        }
        console.log("✅ Partidos iniciales guardados en Firebase");
    } catch (error) {
        console.error("Error cargando quiniela.json:", error);
        datosQuiniela.partidos = [];
    }
}

async function guardarParticipanteFirebase(participante) {
    try {
        await db.collection('quiniela_participantes').doc(participante.cedula).set(participante);
        console.log("✅ Participante guardado en Firebase");
    } catch (error) {
        console.error("Error guardando participante:", error);
    }
}

async function cargarPrediccionesFirebase() {
    try {
        const snapshot = await db.collection('quiniela_predicciones').get();
        datosQuiniela.predicciones = [];
        snapshot.forEach(doc => {
            datosQuiniela.predicciones.push(doc.data());
        });
        console.log(`✅ Cargadas ${datosQuiniela.predicciones.length} predicciones desde Firebase`);
    } catch (error) {
        console.error("Error cargando predicciones:", error);
        datosQuiniela.predicciones = [];
    }
}

async function guardarPrediccionFirebase(prediccion) {
    try {
        const id = `${prediccion.usuario_id}_${prediccion.partido_id}`;
        await db.collection('quiniela_predicciones').doc(id).set(prediccion);
        console.log("✅ Predicción guardada en Firebase");
    } catch (error) {
        console.error("Error guardando predicción:", error);
    }
}

// ------------------- CARGA COMPLETA -------------------
async function cargarDatos() {
    await cargarPartidosDesdeFirebase();   // carga desde Firebase (o JSON si es primera vez)
    await cargarParticipantesFirebase();
    await cargarPrediccionesFirebase();
    actualizarPuntos();
    mostrarRanking();
    cargarPublicidad();
    
    const storedUsuario = localStorage.getItem('quiniela_usuario_actual');
    if (storedUsuario) {
        try {
            const parsed = JSON.parse(storedUsuario);
            if (parsed && parsed.cedula) {
                usuarioActual = parsed;
                document.getElementById('userNameDisplay').innerText = usuarioActual.nombre;
                document.getElementById('loginPanel').style.display = 'none';
                document.getElementById('mainPanel').style.display = 'block';
                document.getElementById('userInfo').style.display = 'flex';
                mostrarPartidos();
            } else {
                localStorage.removeItem('quiniela_usuario_actual');
            }
        } catch(e) {
            localStorage.removeItem('quiniela_usuario_actual');
        }
    } else {
        document.getElementById('userInfo').style.display = 'none';
    }
}

// ------------------- REGISTRO -------------------
async function registrarParticipante(nombre, cedula) {
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

    const docRef = await db.collection('quiniela_participantes').doc(cedulaNormalizada).get();
    if (docRef.exists) {
        const participanteExistente = docRef.data();
        const confirmar = confirm(`La cédula ${cedulaNormalizada} ya está registrada a nombre de "${participanteExistente.nombre}". ¿Deseas iniciar sesión?`);
        if (confirmar) {
            usuarioActual = participanteExistente;
            localStorage.setItem('quiniela_usuario_actual', JSON.stringify(usuarioActual));
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
    
    await guardarParticipanteFirebase(nuevoParticipante);
    datosQuiniela.participantes.push(nuevoParticipante);
    usuarioActual = nuevoParticipante;
    localStorage.setItem('quiniela_usuario_actual', JSON.stringify(usuarioActual));

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
}

function cargarSemanasDisponibles() {
    const semanasSet = new Set();
    datosQuiniela.partidos.forEach(partido => {
        const semana = obtenerSemanaDesdeFecha(partido.fecha);
        if (semana) semanasSet.add(`semana_${semana}`);
    });
    const semanas = Array.from(semanasSet).sort();
    const selector = document.getElementById('semanaSelector');
    if (selector) {
        selector.innerHTML = '<option value="global">🔵 Puntos Globales</option>' +
            semanas.map(sem => `<option value="${sem}">📅 ${sem.replace('semana_', 'Semana ')}</option>`).join('');
    }
}

// ------------------- RANKING -------------------
function mostrarRanking() {
    const tbody = document.getElementById('rankingBody');
    if (!tbody) return;
    
    if (datosQuiniela.participantes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">📭 Aún no hay participantes. ¡Sé el primero!</td></tr>';
        return;
    }
    
    // Mostrar TODOS los participantes (sin .slice)
    tbody.innerHTML = datosQuiniela.participantes.map((p, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${p.nombre}<br><small style="font-size:0.7rem;">${p.cedula}</small></td>
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

// ------------------- VALIDACIÓN DE PRONÓSTICOS (1 HORA ANTES) -------------------
function puedePronosticar(partido) {
    const [dia, mes, anio] = partido.fecha.split('/');
    const [hora, minuto] = partido.hora.split(':');
    const fechaPartido = new Date(anio, mes - 1, dia, hora, minuto);
    const ahora = new Date();
    const limite = new Date(fechaPartido.getTime() - 60 * 60 * 1000);
    return ahora < limite;
}

// ------------------- GUARDAR PREDICCIÓN -------------------
async function guardarPrediccion(partidoId) {
    if (!usuarioActual) {
        alert('📝 Debes registrarte primero');
        return;
    }
    const partido = datosQuiniela.partidos.find(p => p.id === partidoId);
    if (!partido) {
        alert('Partido no encontrado');
        return;
    }

    // 🔥 Validación: prohibir predicciones 1 hora antes del partido
    if (!puedePronosticar(partido)) {
        alert(`⛔ Las predicciones se cierran 1 hora antes del inicio del partido (${partido.fecha} ${partido.hora}).`);
        return;
    }

    // Si ya tiene resultado real cargado, bloquear
    if (partido.resultadoA !== null && partido.resultadoB !== null) {
        alert('⛔ Este partido ya finalizó, no se pueden modificar las predicciones');
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
        prediccion = {
            usuario_id: usuarioActual.id,
            partido_id: partidoId,
            golesA: golesA,
            golesB: golesB,
            puntos: 0
        };
        datosQuiniela.predicciones.push(prediccion);
    }
    
    await guardarPrediccionFirebase(prediccion);
    actualizarPuntos();
    mostrarRanking();
    mostrarPartidos();
}

function resetearFiltros() {
    document.getElementById('faseFilter').value = 'todos';
    document.getElementById('grupoFilter').value = 'todos';
    mostrarPartidos();
}

// ------------------- PUBLICIDAD (TOP CENTRADO, 3 LOGOS) -------------------
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

        if (pos === 'top') {
            contenedor.innerHTML = `
                <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 20px; align-items: center;">
                    ${anunciosPos.map(anuncio => `
                        <div style="text-align: center;">
                            ${anuncio.imagen ? `<img src="${anuncio.imagen}" alt="${anuncio.texto}" class="ad-img" style="max-height: 80px;">` : ''}
                            ${anuncio.texto ? `<div class="ad-text">${anuncio.texto}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            const mitad = Math.ceil(anunciosPos.length / 2);
            const izquierda = anunciosPos.slice(0, mitad);
            const derecha = anunciosPos.slice(mitad);
            contenedor.innerHTML = `
                <div class="ad-flex-container">
                    <div class="ad-group-left">
                        ${izquierda.map(anuncio => `
                            <div class="ad-item">
                                ${anuncio.imagen ? `<img src="${anuncio.imagen}" alt="${anuncio.texto}" class="ad-img">` : ''}
                                ${anuncio.texto ? `<div class="ad-text">${anuncio.texto}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div class="ad-group-right">
                        ${derecha.map(anuncio => `
                            <div class="ad-item">
                                ${anuncio.imagen ? `<img src="${anuncio.imagen}" alt="${anuncio.texto}" class="ad-img">` : ''}
                                ${anuncio.texto ? `<div class="ad-text">${anuncio.texto}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });
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

// ------------------- ADMINISTRADOR -------------------
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
    panel.style.background = 'rgba(0,0,0,0.95)';
    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between;">
            <h2 style="color:#ff0000;">👑 ADMIN</h2>
            <button id="cerrarAdminPanelBtn" style="background:#dc3545; border:none; color:white; cursor:pointer;">✖</button>
        </div>
        <div id="adminPartidosContainer"></div>
        <div style="margin-top:15px;">
            <button id="cerrarAdminPanel" style="background:#dc3545;">Cerrar</button>
            <button id="exportarDatosBtn" style="background:#2196f3;">Exportar</button>
        </div>
    `;
    mainPanel.insertBefore(panel, mainPanel.firstChild);
    document.getElementById('cerrarAdminPanel').addEventListener('click', () => panel.remove());
    document.getElementById('cerrarAdminPanelBtn').addEventListener('click', () => panel.remove());
    document.getElementById('exportarDatosBtn').addEventListener('click', () => {
        const dataStr = JSON.stringify(datosQuiniela, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiniela_backup_${Date.now()}.json`;
        a.click();
    });
    cargarAdminPartidos();
}

function cargarAdminPartidos() {
    const container = document.getElementById('adminPartidosContainer');
    if (!container) return;
    const partidosPendientes = datosQuiniela.partidos.filter(p => p.resultadoA === null);
    if (partidosPendientes.length === 0) {
        container.innerHTML = '<p>📭 No hay partidos pendientes.</p>';
        return;
    }
    container.innerHTML = partidosPendientes.map(partido => `
        <div style="background:#222; margin:10px 0; padding:10px;">
            <strong>${partido.equipoA} vs ${partido.equipoB}</strong> (${partido.fecha})<br>
            <input type="number" id="admin_gA_${partido.id}" placeholder="Goles A" style="width:80px;"> -
            <input type="number" id="admin_gB_${partido.id}" placeholder="Goles B" style="width:80px;">
            <button onclick="actualizarResultadoAdmin(${partido.id})">Guardar</button>
        </div>
    `).join('');
}

// 🔥 ACTUALIZAR RESULTADOS (GUARDA EN FIRESTORE)
window.actualizarResultadoAdmin = async function(partidoId) {
    if (!esAdmin) return;
    const gA = parseInt(document.getElementById(`admin_gA_${partidoId}`).value);
    const gB = parseInt(document.getElementById(`admin_gB_${partidoId}`).value);
    if (isNaN(gA) || isNaN(gB)) {
        alert("Ingresa números válidos");
        return;
    }
    const partido = datosQuiniela.partidos.find(p => p.id === partidoId);
    if (partido) {
        partido.resultadoA = gA;
        partido.resultadoB = gB;
        // Guardar en Firestore (merge para no borrar otros campos)
        await db.collection('quiniela_partidos').doc(partidoId.toString()).set({
            resultadoA: gA,
            resultadoB: gB
        }, { merge: true });
        
        actualizarPuntos();
        // Opcional: actualizar puntos en Firebase si tienes esa función
        // await actualizarPuntosEnFirebase();
        mostrarRanking();
        mostrarPartidos();
        cargarAdminPartidos(); // refresca el panel
        alert(`✅ Resultado guardado: ${partido.equipoA} ${gA} - ${gB} ${partido.equipoB}`);
    }
};

// ------------------- INICIALIZACIÓN -------------------
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM cargado, inicializando...");
    cargarDatos();
    
    document.getElementById('registerBtn')?.addEventListener('click', () => {
        const nombre = document.getElementById('userName').value;
        const cedula = document.getElementById('userCedula').value;
        registrarParticipante(nombre, cedula);
    });
    document.getElementById('logoutBtn')?.addEventListener('click', cerrarSesion);
    document.getElementById('faseFilter')?.addEventListener('change', mostrarPartidos);
    document.getElementById('grupoFilter')?.addEventListener('change', mostrarPartidos);
    document.getElementById('resetFiltersBtn')?.addEventListener('click', resetearFiltros);
    document.getElementById('shareWhatsAppBtn')?.addEventListener('click', compartirWhatsApp);
    
    setTimeout(() => agregarBotonAdmin(), 500);
});

window.guardarPrediccion = guardarPrediccion;
window.actualizarResultadoAdmin = actualizarResultadoAdmin;
