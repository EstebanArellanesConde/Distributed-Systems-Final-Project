let ws = null;

const canvas =
    document.getElementById(
        "gameCanvas"
    );

const ctx =
    canvas.getContext("2d");

const playerList =
    document.getElementById(
        "playerList"
    );

const roomTitle =
    document.getElementById(
        "roomTitle"
    );

let ballX = 400;
let ballY = 400;

function draw()
{
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.beginPath();

    ctx.arc(
        ballX,
        ballY,
        10,
        0,
        Math.PI * 2
    );

    ctx.fill();

    requestAnimationFrame(
        draw
    );
}

draw();

async function createRoom()
{
    const response =
        await fetch(
            "/create-room",
            {
                method: "POST"
            }
        );

    const data =
        await response.json();

    connectHost(
        data.room_code
    );
}

function joinRoom()
{
    const code =
        document
        .getElementById(
            "roomCode"
        )
        .value;

    connectPlayer(code);
}

function connectHost(code)
{
    ws =
        new WebSocket(
            "ws://" +
            location.host +
            "/host"
        );

    setupSocket();

    document
        .getElementById("menu")
        .style.display =
        "none";

    document
        .getElementById("lobby")
        .style.display =
        "block";

    roomTitle.innerText =
        "Sala: " + code;
}

function connectPlayer(code)
{
    ws =
        new WebSocket(
            "ws://" +
            location.host +
            "/join/" +
            code
        );

    setupSocket();

    document
        .getElementById("menu")
        .style.display =
        "none";

    document
        .getElementById("lobby")
        .style.display =
        "block";

    roomTitle.innerText =
        "Sala: " + code;
}

function setupSocket()
{
    ws.onmessage =
        (event) =>
    {
        const data =
            JSON.parse(
                event.data
            );

        if(
            data.type ===
            "room_status"
        )
        {
            updateLobby(
                data.players
            );
        }

        if(
            data.type ===
            "game_state"
        )
        {
            ballX =
                data.ball_x;

            ballY =
                data.ball_y;
        }
    };
}

function updateLobby(players)
{
    playerList.innerHTML =
        "";

    players.forEach(player =>
    {
        const li =
            document.createElement(
                "li"
            );

        li.innerText =
            player.position +
            " - " +
            (
                player.ready
                ? "READY"
                : "WAITING"
            );

        playerList.appendChild(
            li
        );
    });
}

document
.getElementById(
    "readyButton"
)
.onclick =
() =>
{
    if(!ws)
        return;

    ws.send(
        JSON.stringify({
            type:"ready"
        })
    );
};