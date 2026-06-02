// ============================================
// QUINIELA MUNDIAL 2026 - SIBARITA SPORT CLUB
// ============================================

// Configuración inicial
let datosQuiniela = {
    ultimaActualizacion: new Date().toISOString(),
    participantes: [],
    partidos: [],
    predicciones: []
};

let usuarioActual = null;
let partidosOriginales = [];

// ============================================
// CARGA DE DATOS
// ============================================

async function cargarDatos() {
    try {
        const response = await fetch('quiniela.json');
        const data = await response.json();
        datosQuiniela.partidos = data.partidos;
        partidosOriginales = JSON.parse(JSON.stringify(data.partidos));
        console.log('✅ Partidos cargados desde quiniela.json');
    } catch (error) {
        console.error('❌ Error cargando quiniela.json:', error);
        datosQuiniela.partidos = [];
    }
    
    const storedParticipantes = localStorage.getItem('quiniela_participantes');
    const storedPredicciones = localStorage.getItem('quiniela_predicciones');
    
    if (storedParticipantes) {
        datosQuiniela.participantes = JSON.parse(storedParticipantes);
    }
    
    if (storedPredicciones) {
        datosQuiniela.predicciones = JSON.parse(storedPredicciones);
    }
    
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

// ============================================
// REGISTRO DE PARTICIPANTES
// ============================================

function registrarParticipante(nombre, email) {
    if (!nombre || nombre.trim() === '') {
        alert('⚠️ Por favor ingresa un nombre');
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
    
    cargarPrediccionesUsuario();
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
    document.getElementById('userName').value = '';
    document.getElementById('userEmail').value = '';
}

// ============================================
// SISTEMA DE PUNTUACIÓN
// ============================================

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

function actualizarPuntos() {
    datosQuiniela.participantes.forEach(p => p.puntos = 0);
    
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
    
    datosQuiniela.participantes.sort((a, b) => b.puntos - a.puntos);
    guardarDatos();
}

// ============================================
// RANKING
// ============================================

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
            <td>${p.nombre}</td>
            <td><strong>${p.puntos}</strong></td>
        </tr>
    `).join('');
}

// ============================================
// PREDICCIONES
// ============================================

function cargarPrediccionesUsuario() {
    if (!usuarioActual) return {};
    
    const prediccionesMap = {};
    const userPreds = datosQuiniela.predicciones.filter(p => p.usuario_id === usuarioActual.id);
    userPreds.forEach(pred => {
        prediccionesMap[pred.partido_id] = pred;
    });
    return prediccionesMap;
}

function guardarPrediccion(partidoId, golesA, golesB) {
    if (!usuarioActual) {
        alert('📝 Debes registrarte primero');
        return false;
    }
    
    const partido = datosQuiniela.partidos.find(p => p.id === partidoId);
    if (partido.resultadoA !== null && partido.resultadoB !== null) {
        alert('⛔ Este partido ya finalizó, no se pueden modificar las predicciones');
        return false;
    }
    
    const golesANum = parseInt(golesA);
    const golesBNum = parseInt(golesB);
    
    if (isNaN(golesANum) || isNaN(golesBNum) || golesANum < 0 || golesBNum < 0) {
        alert('⚠️ Ingresa valores válidos (números enteros no negativos)');
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

// ============================================
// MOSTRAR PARTIDOS
// ============================================

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
        container.innerHTML = '<div class="card">📭 No hay partidos para mostrar con estos filtros</div>';
        return;
    }
    
    container.innerHTML = partidosFiltrados.map(partido => {
        const prediccion = prediccionesUsuario[partido.id];
        const tieneResultado = partido.resultadoA !== null && partido.resultadoB !== null;
        const estaBloqueado = tieneResultado;
        
        return `
            <div class="partido-card" data-partido-id="${partido.id}">
                <div class="partido-header">
                    <span>${partido.fase === 'grupos' ? `📌 Grupo ${partido.grupo}` : partido.fase.toUpperCase()}</span>
                    <span>🆔 ${partido.id}</span>
                </div>
                <div class="partido-equipos">
                    <span>${partido.equipoA}</span>
                    <span>⚡ vs ⚡</span>
                    <span>${partido.equipoB}</span>
                </div>
                <div class="partido-fecha">
                    📅 ${partido.fecha} - ⏰ ${partido.hora}
                </div>
                <div class="prediccion-inputs">
                    <input type="number" id="golesA_${partido.id}" placeholder="0" min="0" value="${prediccion ? prediccion.golesA : ''}" ${estaBloqueado ? 'disabled' : ''}>
                    <span>-</span>
                    <input type="number" id="golesB_${partido.id}" placeholder="0" min="0" value="${prediccion ? prediccion.golesB : ''}" ${estaBloqueado ? 'disabled' : ''}>
                </div>
                <button class="guardar-prediccion" onclick="guardarPrediccion(${partido.id}, document.getElementById('golesA_${partido.id}').value, document.getElementById('golesB_${partido.id}').value)" ${estaBloqueado ? 'disabled' : ''}>
                    ${estaBloqueado ? '🔒 Partido Finalizado' : (prediccion ? '🔄 Actualizar Pronóstico' : '✅ Guardar Pronóstico')}
                </button>
                ${tieneResultado ? `
                    <div class="resultado-real">
                        🏆 Resultado real: ${partido.equipoA} ${partido.resultadoA} - ${partido.resultadoB} ${partido.equipoB}
                    </div>
                    ${prediccion ? `<div class="puntos-obtenidos">⭐ Puntos: ${prediccion.puntos || 0}</div>` : ''}
                ` : ''}
            </div>
        `;
    }).join('');
}

function resetearFiltros() {
    document.getElementById('faseFilter').value = 'todos';
    document.getElementById('grupoFilter').value = 'todos';
    mostrarPartidos();
}

// ============================================
// COMPARTIR WHATSAPP
// ============================================

function compartirWhatsApp() {
    if (!usuarioActual) {
        alert('📝 Regístrate primero para compartir la quiniela');
        return;
    }
    
    const url = window.location.href;
    const mensaje = `🎯 ¡${usuarioActual.nombre} te invita a participar en la Quiniela del Mundial 2026! 🏆\n\nRegístrate y haz tus predicciones: ${url}\n\n¡Demuestra quién es el mejor pronosticador! ⚽`;
    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsApp, '_blank');
}

// ============================================
// PANEL DE ADMINISTRADOR
// ============================================

let esAdmin = false;
let adminPassword = "sibarita2026"; // 🔐 CAMBIA ESTA CONTRASEÑA

function agregarBotonAdmin() {
    const mainPanel = document.getElementById('mainPanel');
    if (!mainPanel) return;
    
    if (document.getElementById('adminBtn')) return;
    
    const shareContainer = document.querySelector('.share-container');
    const adminButton = document.createElement('button');
    adminButton.id = 'adminBtn';
    adminButton.className = 'admin-btn';
    adminButton.innerHTML = '👑 Admin';
    adminButton.style.cssText = `
        background: #dc3545;
        border: none;
        padding: 12px 24px;
        font-weight: bold;
        border-radius: 50px;
        cursor: pointer;
        font-size: 1rem;
        font-family: inherit;
        color: white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        margin-right: 10px;
    `;
    
    adminButton.onclick = pedirPasswordAdmin;
    
    if (shareContainer) {
        shareContainer.insertBefore(adminButton, shareContainer.firstChild);
    } else {
        const container = document.querySelector('.container');
        const nuevoContainer = document.createElement('div');
        nuevoContainer.className = 'share-container';
        nuevoContainer.style.display = 'flex';
        nuevoContainer.style.gap = '10px';
        nuevoContainer.style.justifyContent = 'center';
        nuevoContainer.style.margin = '30px 0';
        nuevoContainer.appendChild(adminButton);
        container.appendChild(nuevoContainer);
    }
}

function pedirPasswordAdmin() {
    const password = prompt("🔐 Ingrese contraseña de administrador:");
    
    if (password === adminPassword) {
        esAdmin = true;
        mostrarPanelAdmin();
        alert("✅ Acceso de administrador concedido");
        
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn) {
            adminBtn.style.background = "#2e7d32";
            adminBtn.innerHTML = "👑 Admin (Activo)";
        }
    } else if (password !== null) {
        alert("❌ Contraseña incorrecta");
    }
}

function mostrarPanelAdmin() {
    if (document.getElementById('adminPanel')) return;
    
    const container = document.querySelector('.container');
    if (!container) return;
    
    const adminPanel = document.createElement('div');
    adminPanel.id = 'adminPanel';
    adminPanel.className = 'card admin-panel';
    adminPanel.style.border = "2px solid #ff0000";
    adminPanel.style.background = "rgba(0,0,0,0.95)";
    adminPanel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="color: #ff0000; margin:0;">👑 PANEL DE ADMINISTRADOR</h2>
            <button id="cerrarAdminPanelBtn" style="background: #dc3545; border: none; color: white; font-size: 20px; padding: 5px 15px; border-radius: 50%; cursor: pointer;">✖</button>
        </div>
        <p style="color: #ffd700; margin-top: 10px;">⚡ Solo tú puedes actualizar los resultados de los partidos</p>
        
        <div style="margin: 15px 0;">
            <label style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="mostrarSoloPendientes" checked> 
                📌 Mostrar solo partidos pendientes
            </label>
        </div>
        
        <div id="adminPartidosContainer" style="max-height: 500px; overflow-y: auto; margin-top: 15px;">
            Cargando partidos...
        </div>
        
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ff0000; display: flex; gap: 10px; justify-content: space-between; flex-wrap: wrap;">
            <button id="cerrarAdminPanel" class="secondary-btn" style="background: #dc3545;">🔒 Cerrar Panel</button>
            <button id="exportarDatosBtn" class="secondary-btn" style="background: #2196f3;">📥 Exportar Datos</button>
            <button id="resetearQuinielaBtn" class="secondary-btn" style="background: #ff9800;" onclick="confirmarResetearQuiniela()">⚠️ Resetear Todo</button>
        </div>
    `;
    
    const mainPanel = document.getElementById('mainPanel');
    if (mainPanel) {
        mainPanel.insertBefore(adminPanel, mainPanel.firstChild);
    } else {
        container.insertBefore(adminPanel, container.firstChild);
    }
    
    cargarAdminPartidos();
    
    document.getElementById('cerrarAdminPanel').addEventListener('click', () => {
        adminPanel.remove();
        esAdmin = false;
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn) {
            adminBtn.style.background = "#dc3545";
            adminBtn.innerHTML = "👑 Admin";
        }
    });
    
    document.getElementById('cerrarAdminPanelBtn').addEventListener('click', () => {
        adminPanel.remove();
        esAdmin = false;
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn) {
            adminBtn.style.background = "#dc3545";
            adminBtn.innerHTML = "👑 Admin";
        }
    });
    
    document.getElementById('mostrarSoloPendientes').addEventListener('change', () => {
        cargarAdminPartidos();
    });
    
    document.getElementById('exportarDatosBtn').addEventListener('click', exportarDatosQuiniela);
}

function cargarAdminPartidos() {
    const container = document.getElementById('adminPartidosContainer');
    if (!container) return;
    
    const soloPendientes = document.getElementById('mostrarSoloPendientes')?.checked || true;
    
    let partidosFiltrados = soloPendientes 
        ? datosQuiniela.partidos.filter(p => p.resultadoA === null)
        : datosQuiniela.partidos;
    
    const partidosGrupos = partidosFiltrados.filter(p => p.fase === 'grupos');
    const otrasFases = partidosFiltrados.filter(p => p.fase !== 'grupos');
    
    container.innerHTML = `
        ${partidosGrupos.length > 0 ? `
            <h3>📅 FASE DE GRUPOS</h3>
            <div class="admin-grupos-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 15px;">
                ${partidosGrupos.map(partido => `
                    <div class="admin-partido-card" style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 10px; border-left: 4px solid ${partido.resultadoA !== null ? '#4caf50' : '#ff9800'}">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <strong style="color: #ffd700;">📌 Grupo ${partido.grupo}</strong>
                            <span style="font-size: 12px;">📅 ${partido.fecha}</span>
                        </div>
                        <div style="font-weight: bold; margin-bottom: 8px;">
                            ${partido.equipoA} ⚡ vs ⚡ ${partido.equipoB}
                        </div>
                        <div style="font-size: 12px; margin-bottom: 10px;">
                            ⏰ ${partido.hora}
                        </div>
                        ${partido.resultadoA !== null ? `
                            <div style="background: #2e7d32; padding: 8px; border-radius: 5px; margin-bottom: 8px; text-align: center;">
                                ✅ Resultado actual: ${partido.equipoA} ${partido.resultadoA} - ${partido.resultadoB} ${partido.equipoB}
                                <button onclick="editarResultadoAdmin(${partido.id})" style="margin-left: 10px; background: #ff9800; border: none; padding: 3px 10px; border-radius: 5px; cursor: pointer;">✏️ Editar</button>
                            </div>
                        ` : `
                            <div style="display: flex; gap: 10px; margin-top: 10px; align-items: center; flex-wrap: wrap;">
                                <input type="number" id="admin_golesA_${partido.id}" placeholder="Goles ${partido.equipoA}" style="width: 90px; padding: 8px; border-radius: 5px; text-align: center;">
                                <span>-</span>
                                <input type="number" id="admin_golesB_${partido.id}" placeholder="Goles ${partido.equipoB}" style="width: 90px; padding: 8px; border-radius: 5px; text-align: center;">
                                <button class="nb" onclick="actualizarResultadoAdmin(${partido.id})" style="padding: 8px 15px; margin: 0;">✅ Guardar</button>
                            </div>
                        `}
                    </div>
                `).join('')}
            </div>
        ` : '<p>📭 No hay partidos de grupos pendientes</p>'}
        
        ${otrasFases.length > 0 ? `
            <h3 style="margin-top: 20px;">🏆 SIGUIENTES FASES</h3>
            <div class="admin-otras-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 15px;">
                ${otrasFases.map(partido => `
                    <div class="admin-partido-card" style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 10px;">
                        <div style="font-weight: bold; color: #ffd700;">${partido.fase.toUpperCase()}</div>
                        <div style="margin: 8px 0;">${partido.equipoA} ⚡ vs ⚡ ${partido.equipoB}</div>
                        <div style="font-size: 12px;">📅 ${partido.fecha} - ⏰ ${partido.hora}</div>
                        ${partido.resultadoA !== null ? `
                            <div style="background: #2e7d32; padding: 5px; border-radius: 5px; margin-top: 8px; text-align: center;">
                                ✅ ${partido.resultadoA} - ${partido.resultadoB}
                                <button onclick="editarResultadoAdmin(${partido.id})" style="margin-left: 10px; background: #ff9800; border: none; padding: 2px 10px; border-radius: 5px; cursor: pointer;">✏️</button>
                            </div>
                        ` : `
                            <div style="display: flex; gap: 8px; margin-top: 8px;">
                                <input type="number" id="admin_golesA_${partido.id}" placeholder="Goles A" style="width: 70px; padding: 5px; border-radius: 5px;">
                                <input type="number" id="admin_golesB_${partido.id}" placeholder="Goles B" style="width: 70px; padding: 5px; border-radius: 5px;">
                                <button onclick="actualizarResultadoAdmin(${partido.id})" style="background: #4caf50; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">✅</button>
                            </div>
                        `}
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
}

window.actualizarResultadoAdmin = function(partidoId) {
    if (!esAdmin) {
        alert("❌ No tienes permisos de administrador");
        return;
    }
    
    const golesAInput = document.getElementById(`admin_golesA_${partidoId}`);
    const golesBInput = document.getElementById(`admin_golesB_${partidoId}`);
    
    if (!golesAInput || !golesBInput) return;
    
    const golesA = parseInt(golesAInput.value);
    const golesB = parseInt(golesBInput.value);
    
    if (isNaN(golesA) || isNaN(golesB)) {
        alert("⚠️ Ingresa valores numéricos para los goles");
        return;
    }
    
    if (golesA < 0 || golesB < 0) {
        alert("⚠️ Los goles no pueden ser negativos");
        return;
    }
    
    const partido = datosQuiniela.partidos.find(p => p.id === partidoId);
    if (partido) {
        partido.resultadoA = golesA;
        partido.resultadoB = golesB;
        
        actualizarPuntos();
        guardarDatos();
        mostrarRanking();
        mostrarPartidos();
        cargarAdminPartidos();
        
        alert(`✅ Resultado actualizado: ${partido.equipoA} ${golesA} - ${golesB} ${partido.equipoB}`);
        
        if (document.getElementById('mostrarSoloPendientes')?.checked) {
            cargarAdminPartidos();
        }
    }
};

window.editarResultadoAdmin = function(partidoId) {
    if (!esAdmin) {
        alert("❌ No tienes permisos de administrador");
        return;
    }
    
    const partido = datosQuiniela.partidos.find(p => p.id === partidoId);
    if (!partido) return;
    
    const nuevosGolesA = prompt(`✏️ Editar goles de ${partido.equipoA} (actual: ${partido.resultadoA})`, partido.resultadoA);
    const nuevosGolesB = prompt(`✏️ Editar goles de ${partido.equipoB} (actual: ${partido.resultadoB})`, partido.resultadoB);
    
    if (nuevosGolesA !== null && nuevosGolesB !== null) {
        const golesA = parseInt(nuevosGolesA);
        const golesB = parseInt(nuevosGolesB);
        
        if (!isNaN(golesA) && !isNaN(golesB) && golesA >= 0 && golesB >= 0) {
            partido.resultadoA = golesA;
            partido.resultadoB = golesB;
            
            actualizarPuntos();
            guardarDatos();
            mostrarRanking();
            mostrarPartidos();
            cargarAdminPartidos();
            
            alert(`✅ Resultado editado: ${partido.equipoA} ${golesA} - ${golesB} ${partido.equipoB}`);
        } else {
            alert("❌ Valores inválidos");
        }
    }
};

function exportarDatosQuiniela() {
    if (!esAdmin) {
        alert("❌ No tienes permisos de administrador");
        return;
    }
    
    const datosExportar = {
        fechaExportacion: new Date().toISOString(),
        participantes: datosQuiniela.participantes,
        partidos: datosQuiniela.partidos,
        predicciones: datosQuiniela.predicciones
    };
    
    const dataStr = JSON.stringify(datosExportar, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `quiniela_backup_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert("✅ Datos exportados correctamente");
}

function confirmarResetearQuiniela() {
    if (!esAdmin) {
        alert("❌ No tienes permisos de administrador");
        return;
    }
    
    const confirmar = confirm("⚠️ ¿ESTÁS SEGURO? Esto eliminará TODOS los participantes, predicciones y puntajes.\n\n¡Esta acción NO se puede deshacer!");
    
    if (confirmar) {
        const dobleConfirmacion = prompt("✏️ Escribe 'RESET' para confirmar el borrado total de la quiniela:");
        
        if (dobleConfirmacion === "RESET") {
            datosQuiniela.participantes = [];
            datosQuiniela.predicciones = [];
            
            datosQuiniela.partidos.forEach(p => {
                p.resultadoA = null;
                p.resultadoB = null;
            });
            
            guardarDatos();
            usuarioActual = null;
            localStorage.removeItem('quiniela_usuario_actual');
            
            alert("✅ Quiniela reseteada completamente. La página se recargará.");
            location.reload();
        } else {
            alert("❌ Confirmación incorrecta. No se reseteó nada.");
        }
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

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
    
    // 👇 BOTÓN DE ADMINISTRADOR 👇
    agregarBotonAdmin();
    
    document.getElementById('userName')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('registerBtn').click();
        }
    });
});

// Funciones globales necesarias
window.guardarPrediccion = guardarPrediccion;
window.actualizarResultadoAdmin = actualizarResultadoAdmin;
window.editarResultadoAdmin = editarResultadoAdmin;
window.confirmarResetearQuiniela = confirmarResetearQuiniela;
