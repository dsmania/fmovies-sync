var express = require('express');
var app = express();
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
 if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, OPTIONS');
      res.header('Access-Control-Max-Age', 120);
      return res.status(200).json({});
  }
  next();
});
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 9000;

server.listen(port);

var lastEvents = new Map();

io.on('connection', (socket) => {
    socket.on('join', (movie) => {
        socket.join(movie, () => {
            socket.emit('adjust', new Date().getTime());
            var lastEvent = lastEvents.get(movie);
            if (lastEvent != null) {
                socket.emit('sync', lastEvent.command, lastEvent.position, lastEvent.dateTime);
            }
            io.in(movie).clients((err, clients) => {
                console.log(socket.id + ': join(' + movie + ') -> ' + clients.length);
            });
        });
    });

    socket.on('leave', (movie) => {
        console.log(socket.id + ': leave(' + movie + ')');
        socket.leave(movie, () => {
            if (socket.adapter.rooms[movie] == null) {
                lastEvents.delete(movie);
            }
            io.in(movie).clients((err, clients) => {
                console.log(socket.id + ': leave(' + movie + ') -> ' + clients.length);
            });
        });
    });

    socket.on('sync', (command, position, dateTime) => {
        console.log(socket.id + ': sync(' + command + ', ' + position + ', ' + dateTime + ')');
        Object.keys(socket.adapter.rooms).forEach((room) => {
            socket.to(room).emit('sync', command, position, dateTime);

            if (command == 'play' || command == 'pause') {
                lastEvents.set(room, {
                    command: command,
                    position: position,
                    dateTime: dateTime
                });
            } else if (command != 'stop') {
                lastEvents.delete(room);
            } else if (command != 'seek') {
                var lastEvent = lastEvents.get(room);
                if (lastEvent != null) {
                    lastEvent.position = position;
                    lastEvent.dateTime = dateTime;
                } else {
                    lastEvents.set(room, {
                        command: 'pause',
                        position: position,
                        dateTime: dateTime
                    });
                }
            }
        });
    });
});
