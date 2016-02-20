var app       = require('express')();
var server    = require('http').Server(app);
var io        = require('socket.io')(server);
var Promise   = require('promise');


app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});


// rooms object stores arrays of username in rooms
// {
//   room1: ['user1', 'user2']
// }
var rooms = {};


// Connection started
io.on('connection', function(socket) {
  console.log('a user connected');
  console.log(socket.id);
  
  // Joining and leaving rooms
  socket.on('subscribe', function(data) { 
    console.log(data.username + ' joining room ', data.room);
    if (rooms[data.room]) {
      console.log('joining existing room ' + rooms[data.room]);  
    } else {
      console.log('creating new room');
      rooms[data.room] = [];
    }
    rooms[data.room].push(data.username);
    socket.join(data.room); 
  });
  socket.on('unsubscribe', function(data) {  
    console.log(data.username + ' leaving room ', data.room);
    if (rooms[data.room]) {
      if (rooms[data.room].length === 0) {
        delete rooms[data.room];
      } else {
        if (rooms[data.room].indexOf(data.username) > -1) {
          rooms[data.room].splice(rooms[data.room].indexOf(data.username), 1);
        }        
      }
    }
    socket.leave(data.room); 
  });

  // Receiving update and broadcasting to room
  socket.on('update', function(data) {
    console.log(data.username + ' updating room ' + data.room);
    io.sockets.in(data.room).emit('update', data);
  });


  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });


});

server.listen(3000, function(){
  console.log('listening on *:3000');
});