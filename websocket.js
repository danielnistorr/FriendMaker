const fs = require("fs");
const WebSocket = require("ws");

// Load data from the JSON file
const loadData = () => {
  try {
    const rawData = fs.readFileSync("data/friends.json");
    return JSON.parse(rawData);
  } catch (err) {
    console.error("Error loading JSON file:", err);
    return [];
  }
};

// Calculate compatibility between two score lists
const compatibilityScore = (scores1, scores2) => {
  return (
    100 -
    (scores1.reduce((sum, s1, index) => sum + Math.abs(s1 - scores2[index]), 0) /
      (scores1.length * 5)) *
      100
  );
};

// Generate a description of common interests
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

  if (interests.length === 0) {
    return "No specific common interests identified.";
  }

  return interests.join(" ");
};

// Find the 3 most compatible persons with a description of common interests
const findCompatiblePersons = (name, photo, data) => {
  const target = data.find((person) => person.name === name && person.photo === photo);

  if (!target) return [];

  const targetScores = target.scores;

  const compatibilities = data
    .filter((person) => !(person.name === name && person.photo === photo))
    .map((person) => {
      const compatibility = compatibilityScore(targetScores, person.scores);

      let interestSummary;
      if (compatibility === 100) {
        interestSummary = "You both have identical interests.";
      } else {
        interestSummary = generateInterestDescription(person.scores, targetScores);
      }

      return {
        name: person.name,
        photo: person.photo,
        compatibility: parseFloat(compatibility.toFixed(2)),
        interestSummary,
      };
    })
    .filter((person) => person.compatibility >= 50) // Filter for compatibility >= 50%
    .sort((a, b) => b.compatibility - a.compatibility) // Sort by descending compatibility
    .slice(0, 3); // Take the top 3 results

  return compatibilities;
};

module.exports = function attachWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  console.log("WebSocket server attached to existing HTTP server.");

  wss.on("connection", (ws) => {
    console.log("New client connected");

    let intervalId;

    ws.on("message", (message) => {
      try {
        const userData = JSON.parse(message);
        const { name, photo } = userData;

        // Clear any previous interval to avoid duplicates
        if (intervalId) {
          clearInterval(intervalId);
        }

        // Start a new interval to send updates every second
        intervalId = setInterval(() => {
          const data = loadData();
          const results = findCompatiblePersons(name, photo, data);

          ws.send(JSON.stringify(results));
        }, 1000);
      } catch (err) {
        console.error("Error processing message:", err);
        ws.send(JSON.stringify({ error: "Internal server error" }));
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      // Clear interval when client disconnects
      if (intervalId) {
        clearInterval(intervalId);
      }
    });
  });
};
