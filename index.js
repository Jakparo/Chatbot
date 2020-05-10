var express = require("express");
var app = express();

app.use(express.static("public"));

app.set("view engine", "pug");
app.set("views", "./views");
var port = process.env.PORT || 3000;
var server = require("http").Server(app);
var io = require("socket.io")(server);
server.listen(port, () => {
    console.log("Server is available now")
});

app.get("/", (req, res) => {
    res.render("index");
});
// array that contain online users
let onlineUsers = [];

// server listen connection
io.on("connection", (socket) => {
    console.log('A new connection with id:',socket.id);
    socket.on("client_send_username", (data) => {
        console.log(`${socket.id} sign up username: ${data}`);
        users = onlineUsers.map(x => x.name)
        if( users.indexOf(data) >= 0) {
            socket.emit("server-send-failure-signup", data);
            console.log('Sign up fail')
        } else {
            onlineUsers.push({name: data, id: socket.id});
            socket.Username = data;
            socket.emit("Register-success", data);
            io.sockets.emit("server-send-success-signup", onlineUsers);
        }
    });
    // when users disconnect website -> remove their username
    socket.on("disconnect", () => {
        console.log(`${socket.id} is disconnected`);
        let u = onlineUsers.indexOf(socket.Username);
        onlineUsers.splice(u, 1);
        socket.emit(("server-send-success-signup", onlineUsers));
    });

    // client send message
    socket.on('msg', (data)=>{
        if(data.msg != "") { // empty msg not allow 
            let users = onlineUsers.map(x => x.name);
            if(data.to == 'Everyone'){
                socket.broadcast.emit('server_send_message', {Username:socket.Username, msg:data.msg});
                socket.emit('send_message_success', {msg:data.msg});
            } else if(users.indexOf(data.to) >= 0) {
                let matchedUser = onlineUsers.find(x => {
                    if (x.name == data.to){
                        return x;
                    }
                })
                socket.emit('send-private-success', {Username:socket.Username, msg:data.msg, rec: data.to});
                socket.to(matchedUser.id).emit('private', {Username:socket.Username, msg:data.msg});
            }
            else {
                socket.emit("server-send-failure-private", data.to);
            }
        }
    })
});

