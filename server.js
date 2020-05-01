const io = require('socket.io');
const server = io.listen(9000);

var lastEvents = new Map();

server.on('connection', (socket) => {
    socket.on('join', (movie) => {
        socket.join(movie, () => {
            var lastEvent = lastEvents.get(movie);
            if (lastEvent != null) {
                socket.emit('sync', lastEvent.command, lastEvent.position, lastEvent.dateTime);
            }
        });
    });

    socket.on('leave', (movie) => {
        socket.leave(movie, () => {
            if (socket.adapter.rooms[movie] == null) {
                lastEvents.delete(movie);
            }
        });
    });

    socket.on('sync', (command, position, dateTime) => {
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
                    lastEvent.position = postion;
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