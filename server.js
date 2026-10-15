const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
});

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

let players = {};
let robberies = {
    bov_quimica: { locked: false, cooldownEnd: 0, cooldownTime: 600000, value: 1500 },
    fab_uranio: { locked: false, cooldownEnd: 0, cooldownTime: 600000, value: 4500 }
};

io.on('connection', (socket) => {
    console.log(`Operativo conectado: ${socket.id}`);
    
    // Registrar jugador temporal antes de elegir bando
    players[socket.id] = {
        id: socket.id,
        name: "Conectando...",
        x: 0, y: 0,
        angle: 0,
        hp: 100,
        cash: 0, bag: 0,
        role: 'PENDING',
        vehicle: null,
        isArrestedOnGround: false
    };

    socket.emit('init', { id: socket.id, players, robberies });

    // Escuchar cuando un jugador confirma su bando y su nombre real
    socket.on('joinTeam', (data) => {
        if (players[socket.id]) {
            players[socket.id].role = data.role;
            players[socket.id].name = data.name;
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            socket.broadcast.emit('newPlayer', players[socket.id]);
        }
    });

    socket.on('playerUpdate', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].angle = data.angle;
            players[socket.id].vehicle = data.vehicle;
            players[socket.id].bag = data.bag;
            players[socket.id].role = data.role;
            players[socket.id].cash = data.cash;
            players[socket.id].name = data.name;
            players[socket.id].isArrestedOnGround = data.isArrestedOnGround;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('fireProjectile', (projData) => {
        socket.broadcast.emit('enemyProjectile', { id: socket.id, ...projData });
    });

    socket.on('rescuePlayer', (targetId) => {
        io.emit('playerRescued', targetId);
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => console.log(`Servidor Sting Operation en puerto ${PORT}`));
