// ============================================
// PANEL DE ADMINISTRADOR (BOTÓN VISIBLE)
// ============================================

let esAdmin = false;
let adminPassword = "sibarita2026"; // 🔐 CAMBIA ESTA CONTRASEÑA

// Crear botón de administrador visible
function agregarBotonAdmin() {
    const mainPanel = document.getElementById('mainPanel');
    if (!mainPanel) return;
    
    // Verificar si ya existe el botón
    if (document.getElementById('adminBtn')) return;
    
    // Buscar el share-container o el lugar donde poner el botón
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
        // Insertar antes del botón compartir
        shareContainer.insertBefore(adminButton, shareContainer.firstChild);
    } else {
        // Si no existe share-container, crear contenedor
        const container = document.querySelector('.container');
        const nuevoContainer = document.createElement('div');
        nuevoContainer.className = 'share-container';
        nuevoContainer.style.display = 'flex';
        nuevoContainer.style.gap = '10px';
        nuevoContainer.style.justifyContent = 'center';
        nuevoContainer.style.margin = '30px 0';
        nuevoContainer.appendChild(adminButton);
        
        const existingShare = document.querySelector('.share-container');
        if (existingShare) {
            existingShare.insertBefore(adminButton, existingShare.firstChild);
        } else {
            container.appendChild(nuevoContainer);
        }
    }
}

function pedirPasswordAdmin() {
    const password = prompt("🔐 Ingrese contraseña de administrador:");
    
    if (password === adminPassword) {
        esAdmin = true;
        mostrarPanelAdmin();
        alert("✅ Acceso de administrador concedido");
        
        // Cambiar estilo del botón para indicar que está activo
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
    // Verificar si ya existe el panel
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
        <p style="color: #ffd700; margin-top: 10px;">Solo tú puedes actualizar los resultados de los partidos</p>
        
        <div style="margin: 15px 0;">
            <label style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="mostrarSoloPendientes" checked> 
                Mostrar solo partidos pendientes
            </label>
        </div>
        
        <div id="adminPartidosContainer" style="max-height: 500px; overflow-y: auto; margin-top: 15px;">
            Cargando partidos...
        </div>
        
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ff0000; display: flex; gap: 10px; justify-content: space-between;">
            <button id="cerrarAdminPanel" class="secondary-btn" style="background: #dc3545;">Cerrar Panel</button>
            <button id="exportarDatosBtn" class="secondary-btn" style="background: #2196f3;">📥 Exportar Datos</button>
            <button id="resetearQuinielaBtn" class="secondary-btn" style="background: #ff9800;" onclick="confirmarResetearQuiniela()">⚠️ Resetear Todo</button>
        </div>
    `;
    
    // Insertar después del loginPanel o al inicio del mainPanel
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
    
    // Agrupar por fase
    const partidosGrupos = partidosFiltrados.filter(p => p.fase === 'grupos');
    // Para fases eliminatorias (si las agregas después)
    const otrasFases = partidosFiltrados.filter(p => p.fase !== 'grupos');
    
    container.innerHTML = `
        ${partidosGrupos.length > 0 ? `
            <h3>📅 FASE DE GRUPOS</h3>
            <div class="admin-grupos-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
                ${partidosGrupos.map(partido => `
                    <div class="admin-partido-card" style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 10px; border-left: 4px solid ${partido.resultadoA !== null ? '#4caf50' : '#ff9800'}">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <strong style="color: #ffd700;">Grupo ${partido.grupo}</strong>
                            <span style="font-size: 12px;">📅 ${partido.fecha}</span>
                        </div>
                        <div style="font-weight: bold; margin-bottom: 8px;">
                            ${partido.equipoA} vs ${partido.equipoB}
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
        ` : '<p>No hay partidos de grupos pendientes</p>'}
        
        ${otrasFases.length > 0 ? `
            <h3 style="margin-top: 20px;">🏆 SIGUIENTES FASES</h3>
            <div class="admin-otras-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
                ${otrasFases.map(partido => `
                    <div class="admin-partido-card" style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 10px;">
                        <div style="font-weight: bold;">${partido.fase.toUpperCase()}</div>
                        <div>${partido.equipoA} vs ${partido.equipoB}</div>
                        <div style="font-size: 12px;">📅 ${partido.fecha} - ${partido.hora}</div>
                        ${partido.resultadoA !== null ? `
                            <div style="background: #2e7d32; padding: 5px; border-radius: 5px; margin-top: 8px; text-align: center;">
                                ${partido.resultadoA} - ${partido.resultadoB}
                                <button onclick="editarResultadoAdmin(${partido.id})" style="margin-left: 10px; background: #ff9800; border: none; padding: 2px 10px; border-radius: 5px; cursor: pointer;">✏️</button>
                            </div>
                        ` : `
                            <div style="display: flex; gap: 8px; margin-top: 8px;">
                                <input type="number" id="admin_golesA_${partido.id}" placeholder="Goles A" style="width: 70px;">
                                <input type="number" id="admin_golesB_${partido.id}" placeholder="Goles B" style="width: 70px;">
                                <button onclick="actualizarResultadoAdmin(${partido.id})" style="background: #4caf50; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Guardar</button>
                            </div>
                        `}
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
}

// Función para actualizar resultados (solo funciona si es admin)
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
    
    // Actualizar resultado
    const partido = datosQuiniela.partidos.find(p => p.id === partidoId);
    if (partido) {
        partido.resultadoA = golesA;
        partido.resultadoB = golesB;
        
        // Recalcular todos los puntos
        actualizarPuntos();
        
        // Guardar en localStorage
        guardarDatos();
        
        // Actualizar vistas
        mostrarRanking();
        mostrarPartidos();
        cargarAdminPartidos(); // Recargar panel admin
        
        alert(`✅ Resultado actualizado: ${partido.equipoA} ${golesA} - ${golesB} ${partido.equipoB}`);
        
        // Si el checkbox de solo pendientes está activo, podría desaparecer el partido
        if (document.getElementById('mostrarSoloPendientes')?.checked) {
            cargarAdminPartidos();
        }
    }
};

// Función para editar un resultado ya existente
window.editarResultadoAdmin = function(partidoId) {
    if (!esAdmin) {
        alert("❌ No tienes permisos de administrador");
        return;
    }
    
    const partido = datosQuiniela.partidos.find(p => p.id === partidoId);
    if (!partido) return;
    
    const nuevosGolesA = prompt(`Editar goles de ${partido.equipoA} (actual: ${partido.resultadoA})`, partido.resultadoA);
    const nuevosGolesB = prompt(`Editar goles de ${partido.equipoB} (actual: ${partido.resultadoB})`, partido.resultadoB);
    
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

// Exportar datos de la quiniela
function exportarDatosQuiniela() {
    if (!esAdmin) {
        alert("❌ No tienes permisos de administrador");
        return;
    }
    
    const datosExportar = {
        fechaExportacion: new Date().toISOString(),
        participantes: datosQuiniela.participantes,
        partidos: datosQuiniela.partidos,
        predicciones: datosQuiniela.predicciones,
        configuracion: datosQuiniela.configuracion
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

// Resetear toda la quiniela (con confirmación)
function confirmarResetearQuiniela() {
    if (!esAdmin) {
        alert("❌ No tienes permisos de administrador");
        return;
    }
    
    const confirmar = confirm("⚠️ ¿ESTÁS SEGURO? Esto eliminará TODOS los participantes, predicciones y puntajes. Los partidos se mantendrán.\n\n¡Esta acción NO se puede deshacer!");
    
    if (confirmar) {
        const dobleConfirmacion = prompt("Escribe 'RESET' para confirmar el borrado total de la quiniela:");
        
        if (dobleConfirmacion === "RESET") {
            // Resetear datos
            datosQuiniela.participantes = [];
            datosQuiniela.predicciones = [];
            
            // Limpiar resultados de partidos (opcional, comentar si no quieres)
            datosQuiniela.partidos.forEach(p => {
                p.resultadoA = null;
                p.resultadoB = null;
            });
            
            // Guardar cambios
            guardarDatos();
            
            // Cerrar sesión del usuario actual
            usuarioActual = null;
            localStorage.removeItem('quiniela_usuario_actual');
            
            // Recargar página para reiniciar todo
            alert("✅ Quiniela reseteada completamente. La página se recargará.");
            location.reload();
        } else {
            alert("❌ Confirmación incorrecta. No se reseteó nada.");
        }
    }
}
