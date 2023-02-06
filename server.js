var express = require("express");
var socket = require("socket.io");
var app = express();

app.use(express.static("public"));

var server = app.listen(5000, function() {
  console.log("Listening to port 5000.");
});

var io = socket(server);

// Global variables to hold all usernames and rooms created
var usernames = {};
var rooms = ["global", "C Sharp", "Java"];

io.on("connection", function(socket) {

  console.log("New user connected to server.");

  socket.on("createUser", function(username) {
    socket.username = username;
    usernames[username] = username;
    socket.currentRoom = "global";
    socket.join("global");
    socket.emit("updateChat", "INFO", "<b>System:</b><br/>You have joined <b>global</b> room");
    socket.broadcast
      .to("global")
      .emit("updateChat", "INFO", "<b>System:</b><br/>"+username + " has joined <b>global</b> room");
    io.sockets.emit("updateUsers", usernames);
    socket.emit("updateRooms", rooms, "global");
  });


  socket.on("sendMessage", function(data) {
    io.sockets
      .to(socket.currentRoom)
      .emit("updateChat", socket.username, data);
  });

//file upload
socket.on('userImage', function (image) {
    io.sockets.emit('addimage', socket.username, image);
});

  socket.on("createRoom", function(room) {
    if (room != null) {
      rooms.push(room);
      io.sockets.emit("updateRooms", rooms, null);
    }
  });

  socket.on("updateRooms", function(room) {
    socket.broadcast
      .to(socket.currentRoom)
      .emit("updateChat", "INFO", "<span style='color:red'><b>System:</b><br/><b>"+socket.username + "</b> left room <b>"+socket.currentRoom+"</b></span>");
    socket.leave(socket.currentRoom);
    socket.currentRoom = room;
    socket.join(room);
    socket.emit("updateChat", "INFO", "<b>System:</b><br/>You have joined <b>" + room + "</b> room");
    socket.broadcast
      .to(room)
      .emit("updateChat", "INFO", "<b>System:</b><br/><b>"+socket.username + "</b> has joined <b>" + room + "</b> room");
  });

//typing indicator
  socket.on("typing", data => { 
    socket.broadcast.emit("notifyTyping", { user: data.user, message: data.message }); 
  }); 
//when soemone stops typing
  socket.on("stopTyping", () => { 
    socket.broadcast.emit("notifyStopTyping");
  });

//play broadcast message
  socket.on("rSound", data => {
    socket.broadcast.emit("notifySound", { sound: data.sound }); 
  }); 

//disconnect user
  socket.on("disconnect", function() {
    delete usernames[socket.username];
    io.sockets.emit("updateUsers", usernames);
    socket.broadcast.emit("updateChat", "INFO", "<span style='color:red'><b>System:</b><br/><b>"+socket.username + "</b> has disconnected</span>");
  });

});
