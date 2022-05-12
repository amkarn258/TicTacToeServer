const express = require('express')
const dotenv = require('dotenv')
dotenv.config()
const cors = require('cors');
const PORT = process.env.PORT || 4000;
const INDEX = '/index.html';
const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://mayant258:alwarcity@cluster0.rh1us.mongodb.net/myFirstDatabase?retryWrites=true&w=majority');

const app = express()
app.use((_req, res) => res.sendFile(INDEX, { root: __dirname }))
app.use(cors());
const server = app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}...`));
const rooms = new mongoose.Schema({
    roomnames : Array
  }, {collection: 'RoomNames'});
const Rooms = mongoose.model('Rooms', rooms);
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
});

// socket server
const socket = require('socket.io');
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
            //console.log("whatever")
            //const newRoomName = random();
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
    /*const room =[]//this variable you have store in database and retrieve it when needed.
    socket.on('join',data=>{
            if(room.length!=0){
                const temp = data.room.split('!@!@2@!@!').reverse().join('!@!@2@!@!');
                if(room.includes(temp)){
                    socket.join(temp)
                    console.log('joined room',temp)
                    socket.emit('joined',{room:temp})
                    console.log(room);
                } else if(room.includes(data.room)){
                    socket.join(data.room)
                    console.log('joined room', data.room)
                    socket.emit('joined', { room: data.room})
                    console.log(room);
    
                }
            }else{
                socket.join(data.room);
                room.push(data.room)
                console.log('joined room',data.room);
                socket.emit('joined', { room: data.room })
                console.log(room);
            }
    
        })*/

    socket.on('reqRestart', (data) => {
        const room = JSON.parse(data).room
        io.to(room).emit('restart')
    })
});