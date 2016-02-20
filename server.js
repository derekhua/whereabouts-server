var app       = require('express')();
var server    = require('http').Server(app);
var io        = require('socket.io')(server);
var Promise   = require('promise');

// rooms object stores arrays of username in rooms
// {
//   room1: ['user1', 'user2']
// }
var rooms = {};

// {
//   "socketId1": "username1"
// }
var currentUsers = {};


app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/rooms/:room/users', function(req, res) { 
  res.json(rooms[req.params.room]);
});

// Connection started
io.on('connection', function(socket) {
  console.log('a user connected');
  console.log(socket.id);

  // When users are on the app
  socket.on('active', function(data) {
    currentUsers[socket.id] = data.username;
  });

  // Joining and leaving rooms
  socket.on('subscribe', function(data) { 
    console.log(data.username + ' joining room ', data.room);
    if (!rooms[data.room]) {
      console.log('creating new room ' + data.room);
      rooms[data.room] = [data.username];
      socket.join(data.room);
      // Notify others in room
      io.sockets.in(data.room).emit('notify', {
        "msg": data.username + " has joined!",
        "room": data.room
      });
    } 
    else if (rooms[data.room].indexOf(data.username) === -1) {
      console.log(data.username + ' joining existing room ' + data.room);    
      rooms[data.room].push(data.username);
      socket.join(data.room); 
      // Notify others in room
      io.sockets.in(data.room).emit('notify', {
        "msg": data.username + " has joined!",
        "room": data.room
      });
    } 
    else {
      console.log(data.username + ' already in room ' + data.room);    
    }
  });

  socket.on('unsubscribe', function(data) {  
    console.log(data.username + ' leaving room ', data.room);
    if (!rooms[data.room]) {
      console.log('room does not exist');
    }
    else if (rooms[data.room].indexOf(data.username) > -1) {
      rooms[data.room].splice(rooms[data.room].indexOf(data.username), 1);
      if (rooms[data.room].length === 0) {
        delete rooms[data.room];
        console.log('room ' + data.room + ' deleted');
      } else {
         // Notify others in room
        io.sockets.in(data.room).emit('notify', {
          "msg": data.username + " has left",
          "room": data.room
        });
      } 
      socket.leave(data.room);
    }  
    else {
      console.log(data.username + ' not in ' + data.room);
    }
  });


  // Receiving update and broadcasting to room
  socket.on('update', function(data) {
    if (rooms[data.room].indexOf(data.username) > -1) {
      console.log(data.username + ' updating room ' + data.room);
      console.log(data);
      io.sockets.in(data.room).emit('update', data);  
    } else {
      console.log(data.username + ' not in room ' + data.room);
    }
  });

  // Receives chat
  socket.on('chat', function(data) {
    if (rooms[data.room].indexOf(data.username) > -1) {
      console.log(data.username + ' updating room ' + data.room);
      console.log(data);
      socket.broadcast.to(data.room).emit('chat', data);  
    } else {
      console.log(data.username + ' not in room ' + data.room);
    }
  });
  
  // Disconnect
  socket.on('disconnect', function() {
    delete currentUsers[socket.id];
    console.log(socket.id + ' disconnected');
  });

});

server.listen(3000, function(){
  console.log('listening on *:3000');
});