var app       = require('express')();
var server    = require('http').Server(app);
var io        = require('socket.io')(server);
var Promise   = require('promise');


app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Connection started
io.on('connection', function(socket) {
  console.log('a user connected');
  console.log(socket.id);
  
});

server.listen(3000, function(){
  console.log('listening on *:3000');
});