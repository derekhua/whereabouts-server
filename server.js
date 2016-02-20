var app       = require('express')();
var server    = require('http').Server(app);
var io        = require('socket.io')(server);
var Promise   = require('promise');


app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

/*
io.on('connection', function(socket){
  socket.join('some room');
});

And then simply use to or in (they are the same) when broadcasting or emitting:

io.to('some room').emit('some event'):
 */


// Connection started
io.on('connection', function(socket) {
  console.log('a user connected');
  console.log(socket.id);

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

});

server.listen(3000, function(){
  console.log('listening on *:3000');
});