// QUINIELA MUNDIAL 2026 - JavaScript
// Configuración inicial
let datosQuiniela = {
    ultimaActualizacion: new Date().toISOString(),
    participantes: [],
    partidos: [],
    predicciones: []
};

let usuarioActual = null;
let partidosOriginales = [];

// Cargar datos desde localStorage o archivo JSON
async function cargarDatos() {
    // Intentar cargar partidos desde JSON
    try {
        const response = await fetch('quiniela.json');
        const data = await response.json();
        datosQuiniela.partidos = data.partidos;
        partidosOriginales = JSON.parse(JSON.stringify(data.partidos));
        console.log('Partidos cargados desde quiniela.json');
    } catch (error) {
        console.error('Error cargando quiniela.json:', error);
        // Datos de ejemplo por si falla la carga
        datosQuiniela.partidos = [];
    }
    
    // Cargar participantes y predicciones desde localStorage
    const storedParticipantes = localStorage.getItem('quiniela_participantes');
    const storedPredicciones = localStorage.getItem('quiniela_predicciones');
    
    if (storedParticipantes) {
        datosQuiniela.participantes = JSON.parse(storedParticipantes);
    }
    
    if (storedPredicciones) {
        datosQuiniela.predicciones = JSON.parse(storedPredicciones);
    }
    
    // Cargar usuario actual
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

// Guardar datos en localStorage
function guardarDatos() {
    localStorage.setItem('quiniela_participantes', JSON.stringify(datosQuiniela.participantes));
    localStorage.setItem('quiniela_predicciones', JSON.stringify(datosQuiniela.predicciones));
    localStorage.setItem('quiniela_usuario_actual', JSON.stringify(usuarioActual));
}

// Registrar nuevo participante
function registrarParticipante(nombre, email) {
    if (!nombre || nombre.trim() === '') {
        alert('Por favor ingresa un nombre');
        return false;
    }
    
    // Verificar si ya existe
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
    
    cargarPrediccionesUsuario();
    mostrarRanking();
    mostrarPartidos();
    
    return true;
}

// Cerrar sesión
function cerrarSesion() {
    usuarioActual = null;
    localStorage.removeItem('quiniela_usuario_actual');
    document.getElementById('loginPanel').style.display = 'block';
    document.getElementById('mainPanel').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('userName').value = '';
    document.getElementById('userEmail').value = '';
}

// Calcular puntos para una predicción
function calcularPuntos(prediccion, resultadoReal) {
    if (!resultadoReal || resultadoReal.resultadoA === null || resultadoReal.resultadoB === null) {
        return 0;
    }
    
    const exacto = (prediccion.golesA === resultadoReal.resultadoA && prediccion.golesB === resultadoReal.resultadoB);
    if (exacto) return 3;
    
    const difPrediccion = prediccion.golesA - prediccion.golesB;
    const difReal = resultadoReal.resultadoA - resultadoReal.resultadoB;
    
    if (difPrediccion === difReal) return 1;
    
    return 0;
}

// Actualizar todos los puntos
function actualizarPuntos() {
    // Resetear puntos de todos los participantes
    datosQuiniela.participantes.forEach(p => p.puntos = 0);
    
    // Calcular puntos por cada predicción
    datosQuiniela.predicciones.forEach(pred => {
        const partido = datosQuiniela.partidos.find(p => p.id === pred.partido_id);
        if (partido && partido.resultadoA !== null && partido.resultadoB !== null) {
            const puntos = calcularPuntos(pred, partido);
            pred.puntos = puntos;
            
            const participante = datosQuiniela.participantes.find(p => p.id === pred.usuario_id);
            if (participante) {
                participante.puntos += puntos;
            }
        }
    });
    
    // Ordenar participantes por puntos
    datosQuiniela.participantes.sort((a, b) => b.puntos - a.puntos);
    guardarDatos();
}

// Mostrar ranking
function mostrarRanking() {
    const tbody = document.getElementById('rankingBody');
    if (!tbody) return;
    
    actualizarPuntos();
    
    if (datosQuiniela.participantes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">Aún no hay participantes. ¡Sé el primero!</td></tr>';
        return;
    }
    
    tbody.innerHTML = datosQuiniela.participantes.slice(0, 20).map((p, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${p.nombre}</td>
            <td><strong>${p.puntos}</strong></td>
        </tr>
    `).join('');
}

// Cargar predicciones del usuario actual
function cargarPrediccionesUsuario() {
    if (!usuarioActual) return {};
    
    const prediccionesMap = {};
    const userPreds = datosQuiniela.predicciones.filter(p => p.usuario_id === usuarioActual.id);
    userPreds.forEach(pred => {
        prediccionesMap[pred.partido_id] = pred;
    });
    return prediccionesMap;
}

// Guardar predicción
function guardarPrediccion(partidoId, golesA, golesB) {
    if (!usuarioActual) {
        alert('Debes registrarte primero');
        return false;
    }
    
    const partido = datosQuiniela.partidos.find(p => p.id === partidoId);
    if (partido.resultadoA !== null && partido.resultadoB !== null) {
        alert('Este partido ya finalizó, no se pueden modificar las predicciones');
        return false;
    }
    
    const golesANum = parseInt(golesA);
    const golesBNum = parseInt(golesB);
    
    if (isNaN(golesANum) || isNaN(golesBNum) || golesANum < 0 || golesBNum < 0) {
        alert('Ingresa valores válidos (números enteros no negativos)');
        return false;
    }
    
    let prediccion = datosQuiniela.predicciones.find(p => p.usuario_id === usuarioActual.id && p.partido_id === partidoId);
    
    if (prediccion) {
        prediccion.golesA = golesANum;
        prediccion.golesB = golesBNum;
    } else {
        prediccion = {
            usuario_id: usuarioActual.id,
            partido_id: partidoId,
            golesA: golesANum,
            golesB: golesBNum,
            puntos: 0
        };
        datosQuiniela.predicciones.push(prediccion);
    }
    
    guardarDatos();
    actualizarPuntos();
    mostrarRanking();
    mostrarPartidos();
    
    return true;
}

// Mostrar partidos con filtros
function mostrarPartidos() {
    const container = document.getElementById('partidosContainer');
    if (!container) return;
    
    const faseFilter = document.getElementById('faseFilter').value;
    const grupoFilter = document.getElementById('grupoFilter').value;
    
    let partidosFiltrados = [...datosQuiniela.partidos];
    
    if (faseFilter !== 'todos') {
        partidosFiltrados = partidosFiltrados.filter(p => p.fase === faseFilter);
    }
    
    if (grupoFilter !== 'todos' && faseFilter === 'grupos') {
        partidosFiltrados = partidosFiltrados.filter(p => p.grupo === grupoFilter);
    }
    
    const prediccionesUsuario = cargarPrediccionesUsuario();
    
    if (partidosFiltrados.length === 0) {
        container.innerHTML = '<div class="card">No hay partidos para mostrar con estos filtros</div>';
        return;
    }
    
    container.innerHTML = partidosFiltrados.map(partido => {
        const prediccion = prediccionesUsuario[partido.id];
        const tieneResultado = partido.resultadoA !== null && partido.resultadoB !== null;
        const estaBloqueado = tieneResultado;
        
        return `
            <div class="partido-card" data-partido-id="${partido.id}">
                <div class="partido-header">
                    <span>${partido.fase === 'grupos' ? `Grupo ${partido.grupo}` : partido.fase.toUpperCase()}</span>
                    <span>ID: ${partido.id}</span>
                </div>
                <div class="partido-equipos">
                    <span>${partido.equipoA}</span>
                    <span>vs</span>
                    <span>${partido.equipoB}</span>
                </div>
                <div class="partido-fecha">
                    📅 ${partido.fecha} - ${partido.hora}
                </div>
                <div class="prediccion-inputs">
                    <input type="number" id="golesA_${partido.id}" placeholder="0" min="0" value="${prediccion ? prediccion.golesA : ''}" ${estaBloqueado ? 'disabled' : ''}>
                    <span>-</span>
                    <input type="number" id="golesB_${partido.id}" placeholder="0" min="0" value="${prediccion ? prediccion.golesB : ''}" ${estaBloqueado ? 'disabled' : ''}>
                </div>
                <button class="guardar-prediccion" onclick="guardarPrediccion(${partido.id}, document.getElementById('golesA_${partido.id}').value, document.getElementById('golesB_${partido.id}').value)" ${estaBloqueado ? 'disabled' : ''}>
                    ${estaBloqueado ? 'Partido Finalizado' : (prediccion ? 'Actualizar Pronóstico' : 'Guardar Pronóstico')}
                </button>
                ${tieneResultado ? `
                    <div class="resultado-real">
                        ✅ Resultado real: ${partido.equipoA} ${partido.resultadoA} - ${partido.resultadoB} ${partido.equipoB}
                    </div>
                    ${prediccion ? `<div class="puntos-obtenidos">⭐ Puntos: ${prediccion.puntos || 0}</div>` : ''}
                ` : ''}
            </div>
        `;
    }).join('');
}

// Compartir por WhatsApp
function compartirWhatsApp() {
    if (!usuarioActual) {
        alert('Regístrate primero para compartir la quiniela');
        return;
    }
    
    const url = window.location.href;
    const mensaje = `🎯 ¡${usuarioActual.nombre} te invita a participar en la Quiniela del Mundial 2026! 🏆\n\nRegístrate y haz tus predicciones: ${url}\n\n¡Demuestra quién es el mejor pronosticador! ⚽`;
    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsApp, '_blank');
}

// Actualizar resultados (admin)
function actualizarResultadoAdmin(partidoId, resultadoA, resultadoB) {
    // Esta función es para uso administrativo
    // En una versión real, se protegería con contraseña
    const partido = datosQuiniela.partidos.find(p => p.id === partidoId);
    if (partido) {
        partido.resultadoA = parseInt(resultadoA);
        partido.resultadoB = parseInt(resultadoB);
        actualizarPuntos();
        guardarDatos();
        mostrarPartidos();
        mostrarRanking();
        console.log(`Resultado actualizado: ${partido.equipoA} ${resultadoA} - ${resultadoB} ${partido.equipoB}`);
    }
}

// Resetear filtros
function resetearFiltros() {
    document.getElementById('faseFilter').value = 'todos';
    document.getElementById('grupoFilter').value = 'todos';
    mostrarPartidos();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos().then(() => {
        mostrarRanking();
        if (usuarioActual) {
            mostrarPartidos();
        }
    });
    
    document.getElementById('registerBtn')?.addEventListener('click', () => {
        const nombre = document.getElementById('userName').value;
        const email = document.getElementById('userEmail').value;
        registrarParticipante(nombre, email);
    });
    
    document.getElementById('logoutBtn')?.addEventListener('click', cerrarSesion);
    document.getElementById('faseFilter')?.addEventListener('change', mostrarPartidos);
    document.getElementById('grupoFilter')?.addEventListener('change', mostrarPartidos);
    document.getElementById('resetFiltersBtn')?.addEventListener('click', resetearFiltros);
    document.getElementById('shareWhatsAppBtn')?.addEventListener('click', compartirWhatsApp);
    
    // Permitir Enter en el registro
    document.getElementById('userName')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('registerBtn').click();
        }
    });
});

// Exponer funciones globales
window.guardarPrediccion = guardarPrediccion;
window.actualizarResultadoAdmin = actualizarResultadoAdmin;
