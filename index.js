


const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const axios = require('axios');


//?types
let users = [];
const port = 1506;
const API_URL = require('./types');




app.get('/', (req, res) => {
    res.send("Hello---- world!" + API_URL.API_URL);
});
const addUser = ({ userName, roomId }) => {
    const user = { userName, roomId };
    //    if user already exists
    if (users.find(user => user.userName === userName)) {
        return { error: 'Username is  taken' };
    }
    users.push(user);
}
const userLeave = (userName) => {
    const user = users.find(user => user.userName != userName);
}
const getRoomUsers = (roomId) => {
    return users.filter(user => user.roomId === roomId);
};
// ?post
let dataCommentResult = [];
const getAllCommentPostApi = (token, idPost) => {
    console.log("Get all comments post");
    const config = {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }
    const res = axios.post(`${API_URL.API_URL}/api/showComment`, {
        where_comment: idPost
    }, config);
    if (res) {
        res.then((res) => {
            io.to(idPost).emit('all-comments', res.data);
        }).catch((err) => {
            return null;
        });
    }
    return null;
}



io.on('connection', socket => {
    console.log("Someone connected");
    socket.on('join-room', ({ roomId, userName }) => {
        console.log("User joined room");
        if (roomId && userName) {
            socket.join(roomId);
            addUser({ userName, roomId });
            socket.to(roomId).emit('user-connected', userName);
            io.to(roomId).emit('all-users', getRoomUsers(roomId));
        }
        socket.on('disconnect', () => {
            console.log("User disconnected");
            socket.leave(roomId);
            userLeave(userName);
            io.to(roomId).emit('all-users', getRoomUsers(roomId));
        });
    });




    socket.on('open-comemnts-post', async ({ idPost, idUser, token }) => {
        console.log("Open comments post " + idPost + " " + idUser + " " + token);
        if (idPost && idUser && token) {
            socket.join(idPost);
            getAllCommentPostApi(token, idPost);
            socket.to(idPost).emit('user-connected', idUser);
            socket.on('create-comment', async () => {
                getAllCommentPostApi(token, idPost);
            });
        }
    });


})

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});