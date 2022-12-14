

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { instrument } = require("@socket.io/admin-ui");

// https://admin.socket.io/#/
const axios = require('axios');
//  @socket.io/admin-ui
instrument(io, {
    auth: false
});

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

const updateSomeInfoPost = (idPost) => {
    const res = axios.get(`${API_URL.API_URL}/api/getSomeInForPostById/${idPost}`);
    if (res) {
        res.then((res) => {
            io.to(idPost).emit('update-some-info-post', res.data);
        }).catch((err) => {
            return null;
        });
    }
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
            // join user to room  post
            getAllCommentPostApi(token, idPost);
            socket.to(idPost).emit('user-connected', idUser);
            socket.on('create-comment', async () => {
                getAllCommentPostApi(token, idPost);
            });
            // edit comment
            socket.on('edit-comment', async () => {
                getAllCommentPostApi(token, idPost);
            });
            // delete comment
            socket.on('delete-comment', async () => {
                getAllCommentPostApi(token, idPost);
            });
            socket.on('disconnect', () => {
                console.log("User disconnected");
                socket.leave(idPost);
            });
        }
    });

    socket.on('open-app-weley', ({ token }) => {
        if (token) {
            console.log(token);
            socket.join(token);
        }
        socket.on('disconnect', () => {
            socket.leave(token);
        })
    });
    socket.on('open-post', ({ idPost, token }) => {
        if (idPost && token) {
            socket.join(idPost);
            console.log("Open post " + idPost + " " + token);
            socket.on('disconnect', () => {
                socket.leave(idPost);
            });
            // like post
        }
    });
    socket.on('edit-post', ({ id_Post }) => {
        updateSomeInfoPost(id_Post);
    });
    // delete-post
    socket.on('delete-post', ({id_Post})=>{
        // console.log("Delete post " + id_Post);
        socket.leave(id_Post);
        io.to(id_Post).emit('delete-post-client', id_Post);
    });
})


server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});