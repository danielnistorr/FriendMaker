
const path = require('path');
const express = require("express");
const bodyParser = require("body-parser");
const http = require('http');
const socketIo = require('socket.io');

// Create an "express" server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set up the port
const PORT = process.env.PORT || 3000;

// Set up middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from "public"
app.use(express.static('public'));

// Integrate WebSocket support in routes
require("./routing/apiRoutes")(app, io);
require("./routing/htmlRoutes")(app);

// Start the server
server.listen(PORT, function() {
    console.log("App listening on PORT " + PORT);
});
