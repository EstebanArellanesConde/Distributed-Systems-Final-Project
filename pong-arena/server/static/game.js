// Variable global que almacena la conexión abierta de WebSocket
let ws = null;
// Extraemos el elemento canvas del DOM (Ahora mide 400x800 internamente)
const canvas = document.getElementById("gameCanvas");
// Extraemos la API de renderizado bidimensional (2D) para dibujar figuras
const ctx = canvas.getContext("2d");

// Coordenadas locales de la pelota (Serán sobreescritas por el servidor a 60 FPS)
let ballX = 400, ballY = 400;
// Diccionario que almacena la posición local en los ejes unidimensionales de las paletas
let paddles = { "TOP": 350, "BOTTOM": 350, "LEFT": 350, "RIGHT": 350 };
// Variable que almacena si la partida es de 2 o 4 jugadores
let activePlayers = 0;
// Diccionario local que rastrea los puntos actuales de la ronda
let scores = { "TOP": 0, "BOTTOM": 0, "LEFT": 0, "RIGHT": 0 };
// Puntuación objetivo para ganar, recibida del Host
let targetScore = 10;
// Posición asignada a este cliente (Ej: "LEFT" o "RIGHT")
let myPosition = ""; 

// Constante de mapeo para aplicar colores de dibujo basados en la posición
const COLORS = {
    "LEFT": "#ff0000",   // Jugador Host (Rojo)
    "RIGHT": "#000080",  // Jugador Invitado (Azul)
    "TOP": "#ffff00",    
    "BOTTOM": "#008000"  
};

// Nombres legibles en la interfaz de usuario para cada posición
const POS_NAMES = {
    "LEFT": "Jugador 1 (Izq)",
    "RIGHT": "Jugador 2 (Der)",
    "TOP": "Jugador 3 (Arr)",
    "BOTTOM": "Jugador 4 (Aba)"
};

// Diccionario booleano local para prevenir envío de datos basura por presionar repetidamente
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

// Función middleware que convierte teclas WASD a las flechas direccionales estándar
function normalizeKey(key) {
    // Normaliza la tecla a minúscula para evitar fallos si Bloq Mayús está activo
    const lowerKey = key.toLowerCase();
    // Traducciones de inputs de la matriz izquierda (WASD) a la derecha (Flechas)
    if (lowerKey === 'w') return 'ArrowUp';
    if (lowerKey === 's') return 'ArrowDown';
    if (lowerKey === 'a') return 'ArrowLeft';
    if (lowerKey === 'd') return 'ArrowRight';
    // Retorna la misma tecla si ya era una flecha o no está mapeada
    return key;
}

// Bucle de renderizado recursivo disparado por el refresco nativo del monitor (requestAnimationFrame)
function draw() {
    // 1. Limpieza de pantalla: Borramos todos los pixeles del lienzo de 400x800
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Guardamos el estado original del sistema de coordenadas (X=0, Y=0 en la esquina superior izquierda)
    ctx.save();

    // 3. --- LÓGICA DE VIEWPORT (CÁMARA DE PANTALLA DIVIDIDA) ---
    // Si somos el cliente asignado a la DERECHA de la cancha...
    if (myPosition === "RIGHT") {
        // ...Empujamos todo el universo de dibujo 400 píxeles a la izquierda.
        // Esto causa que las coordenadas absolutas (ej. X=450) se rendericen dentro de nuestra visión local (X=50).
        ctx.translate(-400, 0);
    } 
    // Nota: Si myPosition === "LEFT", el desplazamiento es nulo, así que ve la mitad de 0 a 400 normalmente.

    // 4. Dibujo de la Pelota
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    // Trazamos el círculo usando las coordenadas ABSOLUTAS enviadas por el servidor (El translate ajustará el visual)
    ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // 5. Dibujo de la Paleta Izquierda (Coord. absoluta: X=10)
    ctx.fillStyle = COLORS["LEFT"];
    ctx.fillRect(10, paddles["LEFT"], 10, 100);
    
    // 6. Dibujo de la Paleta Derecha (Coord. absoluta: X=780)
    ctx.fillStyle = COLORS["RIGHT"];
    ctx.fillRect(780, paddles["RIGHT"], 10, 100);

    // Si es un modo de 4 jugadores, dibujamos las paletas superior e inferior
    if (activePlayers === 4) {
        ctx.fillStyle = COLORS["TOP"];
        ctx.fillRect(paddles["TOP"], 10, 100, 10);
        
        ctx.fillStyle = COLORS["BOTTOM"];
        ctx.fillRect(paddles["BOTTOM"], 780, 100, 10);
    }

    // 7. Restauramos la matriz original de transformaciones del lienzo para el próximo fotograma
    ctx.restore();

    // Delegamos la siguiente iteración al navegador
    requestAnimationFrame(draw);
}

// Invocación inicial que arranca el bucle gráfico al cargar el script
draw(); 

// --- FUNCIONES DE RED Y LÓGICA DE INTERFAZ ---

// Función invocada por el Host para crear una sala y conectarse
function createRoom() {
    // Obtenemos los valores de configuración del DOM
    const maxPlayers = document.getElementById("playerCount").value;
    const scoreLimit = document.getElementById("targetScore").value;
    
    // Construimos la URL adjuntando los parámetros dinámicamente
    const wsUrl = `ws://${location.host}/host?max_players=${maxPlayers}&target_score=${scoreLimit}`;
    // Establecemos el túnel WebSocket
    ws = new WebSocket(wsUrl);
    
    // Registramos los event listeners del socket
    setupSocket();
    
    // Transicionamos la interfaz hacia el Lobby de Espera
    switchScreen("menuScreen", "lobbyScreen");
}

// Función invocada por el Invitado para conectarse a una sala
function joinRoom() {
    // Capturamos el código escrito y lo forzamos a mayúsculas
    const code = document.getElementById("roomCode").value.toUpperCase();
    if (!code) return; // Validación básica
    
    // Establecemos conexión al endpoint dinámico de unión
    ws = new WebSocket(`ws://${location.host}/join/${code}`);
    setupSocket();
    
    // Transicionamos la interfaz
    switchScreen("menuScreen", "lobbyScreen");
}

// Función de utilidad para cambiar la pantalla visible usando clases CSS
function switchScreen(hideId, showId) {
    // Removemos la clase .active para ocultar el elemento mediante CSS (display: none)
    document.getElementById(hideId).classList.remove("active");
    // Agregamos la clase .active al nuevo contenedor (display: flex)
    document.getElementById(showId).classList.add("active");
}

// Inicialización de la lógica de escucha del WebSocket (Recopilación de mensajes del servidor)
function setupSocket() {
    // Función que se dispara cada vez que llega un mensaje desde el backend en Python
    ws.onmessage = (event) => {
        // Deserialización obligatoria del paquete JSON a objeto Javascript
        const data = JSON.parse(event.data);

        // CASO 1: Confirmación de unión exitosa a la sala
        if (data.type === "room_created" || data.type === "joined") {
            // Guardamos el rol/posición oficial otorgado por el servidor
            myPosition = data.position;
            // Extraemos el código de la sala
            const code = data.code || data.room;
            document.getElementById("roomTitle").innerText = "Sala: " + code;
            
            // Actualizamos la UI para informarle al jugador su color y rol
            const roleEl = document.getElementById("myRoleText");
            if (roleEl) {
                roleEl.innerHTML = `Tú eres: <span style="color: ${COLORS[myPosition]}">${POS_NAMES[myPosition]}</span>`;
            }
        }

        // CASO 2: Actualización de estados en el Lobby (Se une gente, dan "Ready")
        if (data.type === "room_status") {
            targetScore = data.target_score;
            document.getElementById("roomConfigText").innerText = 
                `Objetivo: ${targetScore} Puntos | Jugadores: ${data.players}/${data.max_players}`;
            // Llamamos a la subrutina que repinta la lista de jugadores conectados
            updateLobby(data.players_list);
        }

        // CASO 3: Señal de Inicio de Partida
        if (data.type === "game_start") {
            // Pasamos inmediatamente de la pantalla de espera a la pantalla de renderizado del juego
            switchScreen("lobbyScreen", "gameScreen");
        }

        // CASO 4: Recepción de Fotograma Matemático (Aprox. 60 veces por segundo)
        if (data.type === "game_state") {
            // Actualizamos nuestras variables de renderizado local con la autoridad absoluta del servidor
            ballX = data.ball_x; 
            ballY = data.ball_y;
            paddles = data.paddles;
            activePlayers = data.active_players;
            scores = data.scores;
            
            // Si el servidor dictamina que las condiciones de victoria se cumplieron
            if (data.game_over) {
                // Pasamos a la pantalla de victoria
                switchScreen("gameScreen", "gameOverScreen");
                
                // Construimos el mensaje de victoria anunciando al líder
                document.getElementById("winnerText").innerText = `🏆 ¡EL ${POS_NAMES[data.winner].toUpperCase()} HA GANADO! 🏆`;
                document.getElementById("winnerText").style.color = COLORS[data.winner];
                
                // Cerramos ordenadamente el Socket para limpiar recursos
                ws.close();
                // Abortamos la ejecución de la función para este fotograma
                return;
            }

            // Repintamos los elementos de puntaje basados en la información más reciente
            updateHUD();
        }
    };
}

// Función encargada de mantener el marcador visual actualizado
function updateHUD() {
    // Extraemos el contenedor de las puntuaciones
    const scoreBoard = document.getElementById("scoreBoard");
    scoreBoard.innerHTML = ""; // Limpiamos elementos anteriores
    
    let maxScore = -1;
    let leader = null;

    // Iteramos rígidamente sobre los 4 jugadores posibles para construir sus chips de puntuación
    ["LEFT", "RIGHT", "TOP", "BOTTOM"].forEach(pos => {
        // En partida de 2P, ignoramos construir métricas para los jugadores que no existen
        if (activePlayers === 2 && (pos === "TOP" || pos === "BOTTOM")) return;
        
        const currentScore = scores[pos];
        
        // Bloque lógico para rastrear quién es el líder de la partida actual
        if (currentScore > maxScore) {
            maxScore = currentScore;
            leader = pos;
        }

        // Creación dinámica de un bloque (div) visual
        const div = document.createElement("div");
        div.className = "score-item";
        div.style.color = COLORS[pos]; // Estiliza el chip con el color identificador del jugador
        div.innerHTML = `<span>${POS_NAMES[pos]}</span> <span style="font-size: 22px;">${currentScore}</span>`;
        scoreBoard.appendChild(div);
    });

    // Sub-rutina matemática para dictaminar cuántos puntos faltan
    const remaining = targetScore - maxScore;
    const subtitle = document.getElementById("gameSubtitle");
    
    // Mensaje estático si la partida acaba de empezar
    if (maxScore === 0) {
        subtitle.innerText = `¡La partida ha comenzado! Límite: ${targetScore} pts.`;
        subtitle.style.color = "#fbbf24";
    } else {
        // Mensaje dinámico de liderazgo
        subtitle.innerText = `¡${POS_NAMES[leader]} va a la delantera! (A ${remaining} puntos de ganar)`;
        subtitle.style.color = COLORS[leader];
    }
}

// Función que reconstruye la lista HTML del lobby cada que alguien hace un cambio
function updateLobby(playersList) {
    const ul = document.getElementById("playerList");
    ul.innerHTML = "";
    
    playersList.forEach(p => {
        const li = document.createElement("li");
        li.style.color = p.color; // Aplica el color Hex
        // Aplica el texto condicional indicando si el jugador ya está 'Ready'
        li.innerText = `${POS_NAMES[p.position]} - ${p.ready ? "LISTO ✔️" : "ESPERANDO..."}`;
        ul.appendChild(li);
    });
}

// Evento disparado al hacer click en el botón de Listo
document.getElementById("readyButton").onclick = () => {
    if (!ws) return;
    
    // Enviamos el mensaje de preparación en formato JSON al backend
    ws.send(JSON.stringify({ type: "ready" }));
    
    // Bloqueamos el botón y atenuamos su diseño para evitar pulsaciones redundantes
    document.getElementById("readyButton").disabled = true;
    document.getElementById("readyButton").innerText = "ESPERANDO A LOS DEMÁS...";
    document.getElementById("readyButton").style.background = "#4b5563"; 
};

// --- CAPTURA DE TECLADO ---

// Escucha el evento en el que un dedo hunde una tecla
document.addEventListener("keydown", (event) => {
    // Traducimos WASD a Flechas
    const stdKey = normalizeKey(event.key);
    
    // Evaluamos si es una tecla que pertenece a nuestros controles
    if (keys.hasOwnProperty(stdKey)) {
        event.preventDefault(); // Evita hacer scroll involuntario en el navegador
        
        // Bloque de prevención de Spam: Solo actuamos si la tecla no estaba ya presionada
        if (!keys[stdKey]) {
            keys[stdKey] = true; // Registramos estado en memoria local
            sendMovement(stdKey, true); // Transmitimos el estado al servidor
            
            // Retroalimentación visual interactiva en la pantalla del Lobby
            const ui = document.getElementById("ui-" + stdKey);
            if(ui) ui.classList.add("active");
        }
    }
});

// Escucha el evento en el que el dedo libera la tecla
document.addEventListener("keyup", (event) => {
    const stdKey = normalizeKey(event.key);
    
    if (keys.hasOwnProperty(stdKey)) {
        event.preventDefault();
        
        keys[stdKey] = false; // Actualiza el estado en memoria
        sendMovement(stdKey, false); // Transmite liberación al servidor
        
        // Retira el brillo de la interfaz del Lobby
        const ui = document.getElementById("ui-" + stdKey);
        if(ui) ui.classList.remove("active");
    }
});

// Enrutador oficial que construye el payload JSON y lo transmite al backend vía Socket TCP
function sendMovement(key, isPressed) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", key: key, pressed: isPressed }));
    }
}