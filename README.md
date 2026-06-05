# Proyecto Final - Sistemas Distribuidos (Clave: 1959)
# Pong Arena: Cliente-Servidor Multijugador

## Descripción del Proyecto

**Pong Arena** es una implementación multijugador en tiempo real del clásico juego de Ping Pong, diseñado para soportar hasta 4 jugadores simultáneos. Desarrollado como proyecto final para la asignatura de Sistemas Distribuidos en la Facultad de Ingeniería, este sistema demuestra la viabilidad de las comunicaciones de baja latencia mediante Sockets en redes locales.

El juego funciona bajo un modelo **Cliente-Servidor Autoritativo**, permitiendo que cualquier dispositivo (teléfonos móviles, tabletas, laptops) se conecte e interactúe a través de un navegador web estándar conectándose al host local.

## Características Principales

* **Multijugador en Tiempo Real (1v1 a 4-Player):** Sincronización de físicas y posiciones a 60 FPS.
* **Servidor Autoritativo:** La lógica pesada, las colisiones y el puntaje (`game_state.py`) se calculan centralizadamente en el servidor para evitar desincronización (*lag*) entre los clientes.
* **Gestión de Salas (Lobbies):** Soporte para múltiples partidas simultáneas e independientes mediante un sistema de gestión de salas (`rooms.py`).
* **Multiplataforma (Web-based):** Los clientes solo necesitan acceder a la IP del host desde su navegador (interfaz construida con HTML5 Canvas y JS). No requiere instalación.

## Stack Tecnológico

* **Backend / Host:** Python 3.x
* **Comunicación:** WebSockets (TCP) para mensajería bidireccional asíncrona.
* **Frontend / UI:** HTML5, CSS3, Vanilla JavaScript (`game.js`).

## ⚙️ Arquitectura de Red

El proyecto está diseñado para funcionar en una **Red de Área Local (LAN)** o mediante un **Mobile Hotspot** generado por el servidor host, evadiendo las restricciones de NAT o firewalls institucionales. 

1. El host levanta el servidor Python en un puerto específico.
2. Los dispositivos cliente se conectan a la misma red WiFi.
3. Los clientes acceden mediante el navegador a la dirección IPv4 local del host (ej. `http://192.168.1.XX:PORT`).

## 🚀 Instalación y Ejecución

### Prerrequisitos
* Python 3.8 o superior.
* Gestor de paquetes `pip`.

### Levantar el Servidor

1. Clona este repositorio:

```bash
   git clone [https://github.com/EstebanArellanesConde/Proyecto-Final-Sistemas-Distribuidos.git](https://github.com/EstebanArellanesConde/Proyecto-Final-Sistemas-Distribuidos.git)
   cd Proyecto-Final-Sistemas-Distribuidos/pong-arena
```

2. Recomendación: Crea y activa un entorno virtual

```bash 
python -m venv venv
   source venv/bin/activate  # En Linux/Mac
   # venv\Scripts\activate   # En Windows
```

3. Instala las dependencias necesarias:

```bash
pip install -r requirements.txt
```

4. Ejecuta la aplicación principal:

```bash
python server/app.py
```

# Conectar los Clientes

Asegúrate de que los dispositivos cliente estén en la misma red WiFi que el servidor.

Abre un navegador web en el cliente e ingresa la dirección IP del servidor.
Por ejemplo: http://localhost:8000


```bash
python -m venv venv
pip install fastapi uvicorn jinja2 websockets
uvicorn app:app --reload
```

# Estructura del Repositorio

```Plaintext
pong-arena/
├── client/
│   ├── join_client.py       # Script de prueba para simular clientes
│   └── test_client.py       # Herramienta de testeo de latencia/sockets
├── server/
│   ├── static/
│   │   └── game.js          # Lógica del cliente, renderizado del Canvas e inputs
│   ├── templates/
│   │   └── index.html       # Interfaz principal de usuario / Lobby
│   ├── app.py               # Entry point del servidor, rutas y conexión de sockets
│   ├── game_state.py        # Lógica de físicas, colisiones y estado autoritativo
│   └── rooms.py             # Estructura de datos para manejar múltiples partidas
└── README.md
```
ACTUALIZACIÓN PRIMER CAMBIO:

##  Características Principales

* **Escalabilidad Dinámica (2 vs 4 Jugadores):** El motor físico se adapta según los jugadores presentes al iniciar la partida. Para 2 jugadores, habilita paredes sólidas superior e inferior para un rebote clásico. Para 4 jugadores, abre el tablero completo.
* **Normalización de Controles (Cross-Input):** La interfaz cliente permite usar tanto las flechas direccionales estándar como las teclas `W A S D`. El frontend traduce automáticamente estas entradas al formato esperado por el servidor.
* **Probador de Controles en Antesala:** El Lobby incluye una interfaz interactiva que ilumina las teclas físicas presionadas, garantizando que el hardware del dispositivo cliente está siendo leído correctamente antes de declarar el estado *READY*.
* **Servidor Autoritativo:** La lógica pesada, las colisiones y el puntaje (`game_state.py`) se calculan centralizadamente a 60 FPS en el servidor (FastAPI/asyncio) para evitar desincronización (*lag*) entre los clientes.
* **Gestión de Salas (Lobbies):** Soporte para múltiples partidas simultáneas e independientes mediante un sistema de gestión de salas (`rooms.py`).
* **Multiplataforma (Web-based):** Los clientes solo necesitan acceder a la IP del host desde su navegador (interfaz construida con HTML5 Canvas y JS). No requiere instalación.

##  Stack Tecnológico

* **Backend / Host:** Python 3.x, FastAPI.
* **Comunicación:** WebSockets (TCP) bidireccional asíncrona gestionada mediante Uvicorn.
* **Frontend / UI:** HTML5, CSS3, Vanilla JavaScript (`game.js`), API de Canvas 2D.

##  Arquitectura de Red

El proyecto está diseñado para funcionar en una **Red de Área Local (LAN)** o mediante un **Mobile Hotspot** generado por el servidor host, evadiendo las restricciones de NAT o firewalls institucionales. 

1. El host levanta el servidor Python enlazándolo a todas las interfaces de red (`0.0.0.0`) en un puerto específico.
2. Los dispositivos cliente se conectan a la misma red WiFi.
3. Los clientes acceden mediante el navegador a la dirección IPv4 local del host (ej. `http://192.168.1.XX:8000`).

## ACTUALIZACIÓN ENTREGA FINAL / PANTALLA DIVIDIDA:

## Características Principales

* Pantalla Dividida Distribuida: Utilizando el concepto de "Cámara Desplazada", el mundo del juego se divide físicamente en los dispositivos de los clientes. El Jugador 1 visualiza exclusivamente la mitad izquierda y el Jugador 2 la mitad derecha, compartiendo un mismo espacio físico virtual.
* Motor Autoritativo: El servidor es la única fuente de la verdad. Procesa las matemáticas de colisiones, velocidad y límites en un lienzo virtual absoluto de 800x800 a 60 FPS, previniendo la desincronización y las trampas.
* Diseño Responsivo Total: Interfaz adaptada con la unidad CSS 100dvh (Dynamic Viewport Height) y restricciones de Aspect-Ratio, asegurando que el juego escale perfectamente tanto en computadoras de escritorio como en tabletas y smartphones sin cortes.
* Configuración de Sala: Permite crear partidas con puntuación límite dinámica (5, 10 o 20 puntos) y soporte escalar (2 a 4 jugadores).

## Arquitectura y Funcionamiento (WebSockets)

El proyecto abandona el paradigma tradicional de petición/respuesta HTTP en favor de una comunicación Full-Duplex (Bidireccional) lograda mediante WebSockets y FastAPI.

### El Backend (El Servidor Autoritativo)
Escrito en Python, su función es agrupar las conexiones y simular el universo del juego.
* Recopilación: Mediante el enrutador de FastAPI (app.py), el servidor acepta las conexiones entrantes y las mantiene vivas en un bucle asíncrono. Agrupa a los UUIDs de los jugadores en salas independientes (rooms.py).
* Sincronización (game_state.py): Un bucle asíncrono corre a 60 veces por segundo. Lee los inputs de los jugadores, mueve la pelota, calcula las físicas en un tablero de 800x800 y empaqueta el estado final en un JSON.
* Emisión (Broadcast): Envía este estado absoluto a todos los clientes conectados a la sala.

### El Frontend (El Cliente Terminal)
Escrito en Vanilla JavaScript y HTML5 Canvas, su función es actuar como una terminal "tonta" visual.
* Optimización de Red: El cliente captura los eventos del teclado (WASD/Flechas) y usa un diccionario local para evitar el envío excesivo de pulsaciones de teclas. Solo envía un paquete JSON por WebSocket en el instante exacto en que una tecla se presiona (keydown) o se suelta (keyup), reduciendo drásticamente el uso del ancho de banda.
* Renderizado con Cámara (Viewport): Utilizando requestAnimationFrame, el cliente dibuja los fotogramas recibidos. Mediante la función ctx.translate(), el cliente "mueve" el mapa absoluto recibido del servidor, actuando como el lente de una cámara que solo revela la mitad correspondiente de la cancha (0 a 400px o 400 a 800px).

## Metodología de Ejecución (Cómo iniciar el proyecto)

Siga estos pasos para levantar el servidor en su computadora y permitir que otros dispositivos de su red local se conecten a jugar.

### 1. Preparación del Entorno
Puede ejecutar directamente el archivo "start.sh" desde una terminal WSL / Linux y levantará el servidor al mismo tiempo que crea un entorno para las dependencias necesarias (recordar dar privilegios de ejecución con "chmod +x start.sh" para que pueda ejecutar cambios en su terminal).
Si quiere levantar el entorno de manera manual, siga los siguientes pasos:

Abra su terminal, navegue a la carpeta principal del proyecto (donde se encuentra app.py) y cree un entorno virtual de Python:

# Crear el entorno virtual
python -m venv venv

# Activar el entorno virtual (Windows)
venv\Scripts\activate

# Activar el entorno virtual (Mac/Linux)
source venv/bin/activate

### 2. Instalación de Dependencias
Con el entorno virtual activado, instale las librerías necesarias para la comunicación asíncrona:

pip install fastapi uvicorn websockets jinja2

### 3. Levantar el Servidor en Red Local
Para que los dispositivos móviles y otras computadoras puedan ver el servidor, debe enlazarlo al host universal de su máquina (0.0.0.0). Ejecute:

uvicorn app:app --host 0.0.0.0 --port 8000

(El servidor comenzará a ejecutarse y se mantendrá en escucha).

### 4. Conectar los Dispositivos (Clientes)
Abra otra pestaña en su terminal para averiguar su dirección IP local.
* En Windows, escriba ipconfig y busque la línea "Dirección IPv4" bajo su adaptador Wi-Fi/Ethernet (Ejemplo: 192.168.1.75 o 10.127.X.X).
* En Mac/Linux, escriba ip a o ifconfig.

Finalmente, tome el dispositivo de destino (tableta, smartphone o computadora invitada), abra un navegador web (se recomienda Pestaña de Incógnito para evitar la caché) y navegue a la ruta:

http://<SU_DIRECCION_IP>:8000

Cree una sala, comparta el código de 4 letras con su oponente y comience a jugar.