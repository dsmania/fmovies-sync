const io = require('socket.io').listen(process.env.PORT || 9000, { origins: '*:*' });

var lastEvents = new Map();

io.on('connection', (socket) => {
    socket.on('join', (movie) => {
        socket.join(movie, () => {
            socket.emit('adjust', new Date().getTime(), process.env.npm_package_version);
            var lastEvent = lastEvents.get(movie);
            if (lastEvent != null) {
                socket.emit('sync', lastEvent.command, lastEvent.position, lastEvent.dateTime);
            }
            io.in(movie).clients((err, clients) => {
                io.to(movie).emit('info', clients.length);
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
                io.to(movie).emit('info', clients.length);
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
