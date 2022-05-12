const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors');
const PORT = process.env.PORT || 4000;
const INDEX = '/index.html';
const mongoose = require('mongoose')
const app = express()
const socket = require('socket.io');

const server = app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}...`));

mongoose.connect(MongoDBConnectionString);
dotenv.config()
app.use((_req, res) => res.sendFile(INDEX, { root: __dirname }))
app.use(cors());
const rooms = new mongoose.Schema({
    roomnames : Array
  }, {collection: 'RoomNames'});
const Rooms = mongoose.model('Rooms', rooms);
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
});

// socket server
const io = socket(server);
io.on('connection', (socket) => {
    console.log("socket", socket);
    socket.on('reqTurn', (data) => {
        const room = JSON.parse(data).room
        io.to(room).emit('playerTurn', data)
    })
    socket.on('create', room => {
        socket.join(room)
    })

    socket.on('join',async (room, msg) => {
        const currRooms= await Rooms.find({roomnames: String(room)}).limit(1);
        console.log("roomDetails",currRooms)
        if (currRooms.length>=1) {
            socket.emit('create_new_room');
        }
        else {
            const newRoom = {
                roomnames: String(room)
            };
            var currentRoom = new Rooms(newRoom);
            currentRoom.save();
            socket.join(room)
            io.to(room).emit('opponent_joined')
        }
    })

    socket.on('reqRestart', (data) => {
        const room = JSON.parse(data).room
        io.to(room).emit('restart')
    })
});