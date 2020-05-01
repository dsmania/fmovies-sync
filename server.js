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
                command = null,
                position = null,
                dateTime = null
            };
        }

        movieData.connections.add(socket);

        if (movieData.command != null) {
            socket.send('sync', movieData.command + ':' + movieData.position + ':' + movieData.dateTime);
        }
    });

    socket.on('leave', (msg) => {
        var id = msg;
        var movieData = movies.get(id);
        if (movieData == null) {
            return;
        }
        movieData.connections.delete(socket);
        if (movieData.connections.size == 0) {
            movieData.command = null;
            movieData.position = null;
            movieData.dateTime = null;
        }
    });

    socket.on('disconnect', (msg) => {
        for (const [id, movieData] of movies.entries()) {
            if (movieData != null) {
                movieData.connections.delete(socket);
                if (movieData.connections.size == 0) {
                    movieData.command = null;
                    movieData.position = null;
                    movieData.dateTime = null;
                }
            }
        }
    });

    socket.on('sync', (msg) => {
        for (const [id, movieData] of movies.entries()) {
            if (movieData != null) {
                movieData.connections.delete(socket);
                if (movieData.connections.size == 0) {
                    movieData.command = null;
                    movieData.position = null;
                    movieData.dateTime = null;
                }
            }
        }
    });
});
