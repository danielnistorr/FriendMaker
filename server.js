const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const socketIo = require("socket.io");

// Create an Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Set up the port
const PORT = process.env.PORT || 3000;

// Set up middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from "public"
app.use(express.static("public"));

// Initialize Socket.IO
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins (adjust for production)
        methods: ["GET", "POST"]
    }
});

// Import WebSocket logic
require("./websocket")(io); // Pass `io` to the WebSocket module

// Integrate routes
require("./routing/apiRoutes")(app, io); // Pass both `app` and `io` if needed
require("./routing/htmlRoutes")(app);

// Start the server
server.listen(PORT, () => {
    console.log(`App listening on http://0.0.0.0:${PORT}`);
});

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
    websocketServer.handleUpgrade(request, socket, head, (ws) => {
        websocketServer.emit('connection', ws, request);
    });
});