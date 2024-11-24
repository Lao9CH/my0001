const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('a user connected');
    
    socket.on('draw', (data) => {
        // 广播绘画数据给所有其他客户端
        socket.broadcast.emit('draw', data);
    });

    socket.on('clear', () => {
        // 广播清除画布消息
        socket.broadcast.emit('clear');
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
