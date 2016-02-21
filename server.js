var app       = require('express')();
var server    = require('http').Server(app);
var io        = require('socket.io')(server);
var bodyParser = require('body-parser')
var Promise   = require('promise');


// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
// Parse application/json
app.use(bodyParser.json({limit: '50mb'}));

// rooms object stores arrays of username in rooms
// {
//   roomID: {
//     name: ,
//     users: ['user1', 'user2'],
//     chatHistory: [{
//       username:
//       text:
//       room:
//     }],
//     locationHistory: [{}]
//   }
// }
var rooms = {};

// {
//   "username1": "socketId"
// }
var currentUsers = {};

// For cross-domain requests
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Authorization");
  next();
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/rooms/:room', function(req, res) { 
  console.log('get room request');
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
      rooms[data.room] = {};
      rooms[data.room].name = data.roomName;
      rooms[data.room].users = [data.username];   
      // Notify others in room
      socket.broadcast.to(data.room).emit('notify', {
        "msg": data.username + " has joined!",
        "room": data.room
      });
    } 
    else if (rooms[data.room].users.indexOf(data.username) === -1) {
      console.log(data.username + ' joining existing room ' + data.room);    
      rooms[data.room].users.push(data.username);      
      // Notify others in room
      io.sockets.in(data.room).emit('notify', {
        "msg": data.username + " has joined!",
        "room": data.room,
        "name": rooms[data.room].name
      });
    } 
    else {
      console.log(data.username + ' already in room ' + data.room);    
    }
    socket.join(data.room); 
  });

  socket.on('unsubscribe', function(data) {  
    console.log(data.username + ' leaving room ', data.room);
    if (!rooms[data.room]) {
      console.log('room does not exist');
    }
    else if (rooms[data.room].users.indexOf(data.username) > -1) {
      rooms[data.room].users.splice(rooms[data.room].indexOf(data.username), 1);
      if (rooms[data.room].users.length === 0) {
        delete rooms[data.room];
        console.log('room ' + data.room + ' deleted');
      } else {
         // Notify others in room
        io.sockets.in(data.room).emit('notify', {
          "msg": data.username + " has left",
          "room": data.room
        });
      }       
    }  
    else {
      console.log(data.username + ' not in ' + data.room);
    }
    socket.leave(data.room);
  });


  // Receiving update and broadcasting to room
  socket.on('update', function(data) {
    if (rooms[data.room].users.indexOf(data.username) > -1) {
      console.log(data.username + ' updating room ' + data.room);
      console.log(data);
      io.sockets.in(data.room).emit('update', data);  
      if (rooms[data.room].locationHistory === undefined) {
        rooms[data.room].locationHistory = [];
      }
      rooms[data.room].locationHistory.push(data);
    } else {
      console.log(data.username + ' not in room ' + data.room);
    }
  });

  // Receives chat
  socket.on('chat', function(data) {
    if (rooms[data.room] !== undefined && rooms[data.room].users.indexOf(data.username) > -1) {
      console.log(data.username + ' updating room ' + data.room + ' name ' + rooms[data.room].name);
      console.log(data);
      socket.broadcast.to(data.room).emit('chat', data);  
      if (rooms[data.room].chatHistory === undefined) {
        rooms[data.room].chatHistory = [];
      }
      rooms[data.room].chatHistory.push(data);
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
