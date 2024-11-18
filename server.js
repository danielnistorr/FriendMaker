const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const socketIo = require("socket.io");

// Create an "express" server
const app = express();
const server = http.createServer(app); // Attach HTTP server
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow requests from all origins (adjust for security in production)
        methods: ["GET", "POST"]
    }
});

// Set up the port
const PORT = process.env.PORT || 3000;

// Set up middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from "public"
app.use(express.static("public"));

// Socket.IO WebSocket connection handling
io.on("connection", (socket) => {
    console.log("A client connected:", socket.id);

    // Handle messages from the client
    socket.on("message", (data) => {
        console.log("Received message from client:", data);

        // Respond to the client
        socket.emit("response", { message: "Message received!", data });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// Integrate WebSocket support in routes
require("./routing/apiRoutes")(app, io); // Pass both `app` and `io` to routes
require("./routing/htmlRoutes")(app); // Standard routes

// Start the server
server.listen(PORT, function () {
    console.log(`App listening on http://0.0.0.0:${PORT}`);
});
