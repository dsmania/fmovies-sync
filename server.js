const io = require('socket.io');
const server = io.listen(9000);

var movies = new Map();

server.on('connection', (socket) = > {
    socket.on('join', (msg) => {
        var id = msg;
        var movieData = movies.get(id);
        if (movieData == null) {
            movieData = {
                connections = new Set(),
                state = null
            };
        }

        movieData.connections.add(socket);

        if (movieData.lastCommand != null) {
            socket.send(movieData.state.command, movieData.state.parameters);
        }
    });

    socket.on('leave', (msg) => {
        var id = msg;
        var movieData = movies.get(id);
        if (movieData.connections == null) {
            movieData.connections = {};
        }
        if (!movieData.connections.includes(socket)) {
            movieData.connections.push(socket);
        }
    });

    socket.on('play', (msg) => {
        io.emit('play', msg);
    });
});
