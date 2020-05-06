var express = require("express");
var app = express();

app.use(express.static("public"));

app.set("view engine", "pug");
app.set("views", "./views");

var server = require("http").Server(app);
var io = require("socket.io")(server);
server.listen(3000, () => {
    console.log("Server is available now")
});

app.get("/", (req, res) => {
    res.render("index");
});

let onlineUsers = [];

io.on("connection", (socket) => {
    console.log('A new connection with id:',socket.id);
    socket.on("client_send_username", (data) => {
        console.log(`${socket.id} sign up username: ${data}`);
        if( onlineUsers.indexOf(data) >= 0) {
            socket.emit("server-send-failure-signup", data);
            console.log('Sign up fail')
          } else {
            onlineUsers.push(data);
            socket.Username = data;
            socket.emit("Register-success", data);
            io.sockets.emit("server-send-success-signup", onlineUsers);
          }
    });
    socket.on("disconnect", () => {
        console.log(`${socket.id} is disconnected`);
        let u = onlineUsers.indexOf(socket.Username);
        onlineUsers.splice(u, 1);
        socket.emit(("server-send-success-signup", onlineUsers));
    });

    socket.on("client_send_message", (data) =>{
        io.sockets.emit("server_send_message", {Username:socket.Username, msg:data});
    });
});