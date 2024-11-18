const fs = require("fs");

// Helper functions
const loadData = () => {
    try {
        const rawData = fs.readFileSync("data/friends.json");
        return JSON.parse(rawData);
    } catch (err) {
        console.error("Error loading JSON file:", err);
        return [];
    }
};

const compatibilityScore = (scores1, scores2) => {
    return 100 - (scores1.reduce((sum, s1, index) => sum + Math.abs(s1 - scores2[index]), 0) / (scores1.length * 5)) * 100;
};

const generateInterestDescription = (friendScores, userScores) => {
    let interests = [];
    if (friendScores[7] >= 4 && userScores[7] >= 4) {
        interests.push("Both are highly active and enjoy regular training.");
    } else if (friendScores[7] <= 2 && userScores[7] <= 2) {
        interests.push("Both prefer a more relaxed lifestyle over physical activity.");
    }
    if (friendScores[0] <= 2 && userScores[0] <= 2) {
        interests.push("Both prefer not to drink or drink rarely.");
    } else if (friendScores[0] >= 3 && userScores[0] >= 3) {
        interests.push("Both enjoy social drinking.");
    }
    if (friendScores[1] >= 3 && userScores[1] >= 3) {
        interests.push("Both enjoy social outings and spending time with friends.");
    }
    if (friendScores[4] >= 4 && userScores[4] >= 4) {
        interests.push("Both are total pet lovers.");
    }
    if (friendScores[5] >= 3 && userScores[5] >= 3) {
        interests.push("Both enjoy adventurous travel experiences.");
    }
    return interests.length > 0 ? interests.join(" ") : "No specific common interests identified.";
};

const findCompatiblePersons = (name, photo, data) => {
    const target = data.find(person => person.name === name && person.photo === photo);
    if (!target) return [];
    const targetScores = target.scores;
    return data
        .filter(person => person.name !== name)
        .map(person => ({
            name: person.name,
            photo: person.photo,
            compatibility: parseFloat(compatibilityScore(targetScores, person.scores).toFixed(2)),
            interestSummary: generateInterestDescription(person.scores, targetScores),
        }))
        .filter(person => person.compatibility >= 50)
        .sort((a, b) => b.compatibility - a.compatibility)
        .slice(0, 3);
};

// Export WebSocket logic
module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("A client connected:", socket.id);

        socket.on("message", (data) => {
            console.log("Received message from client:", data);
            try {
                const userData = JSON.parse(data);
                const { name, photo } = userData;

                const jsonData = loadData();
                const results = findCompatiblePersons(name, photo, jsonData);

                socket.emit("response", results);
            } catch (err) {
                console.error("Error handling message:", err);
                socket.emit("error", { error: "Internal server error" });
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });
};
// Optional origin check for Render
function originCheck(origin) {
    return origin === "https://friendmaker.onrender.com"; // Update with your app's URL
}

wss.on("connection", (ws, req) => {
    if (!originCheck(req.headers.origin)) {
        ws.terminate();
        return;
    }
    console.log("Client connected");
    // Your connection logic here
});