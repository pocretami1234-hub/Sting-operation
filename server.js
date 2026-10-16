const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

let players = {};
let robberies = {
    bov_quimica: { locked: false, value: 1500 },
    fab_uranio: { locked: false, value: 4500 }
};

io.on('connection', (socket) => {
    // Registrar operativo en la red de inmediato
    players[socket.id] = {
        id: socket.id, name: "Anon_User", x: 250, y: 250, angle: 0, hp: 100, cash: 0, bag: 0, role: 'PENDING'
    };

    socket.emit('init', { id: socket.id, players, robberies });

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
            Object.assign(players[socket.id], data);
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('fireProjectile', (projData) => {
        socket.broadcast.emit('enemyProjectile', projData);
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => console.log(`Servidor Sting Operation en puerto ${PORT}`));
