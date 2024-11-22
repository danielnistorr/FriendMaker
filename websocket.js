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

// Generate a description of common interests and suggest activities
const generateInterestDescription = (friendScores, userScores) => {
  const pickLimitedItems = (items, limit) => {
    if (items.length <= limit) return items; // Return all if within limit
    return items.slice(0, limit).concat("..."); // Add "..." to indicate more content
  };

  let interests = [];
  let activitySuggestions = [];

  if (friendScores[7] >= 4 && userScores[7] >= 4) {
    interests.push("Both are highly active and enjoy regular training.");
    activitySuggestions.push(
      "Try going to the gym together or joining a fitness class.",
      "Participate in a local marathon or fun run.",
      "Join a yoga or pilates session."
    );
  } else if (friendScores[7] <= 2 && userScores[7] <= 2) {
    interests.push("Both prefer a more relaxed lifestyle over physical activity.");
    activitySuggestions.push(
      "Meet at a coffee shop or enjoy a movie marathon.",
      "Spend a day relaxing at a spa or wellness center.",
      "Explore a nearby bookstore or library together."
    );
  }

  if (friendScores[0] <= 2 && userScores[0] <= 2) {
    interests.push("Both prefer not to drink or drink rarely.");
    activitySuggestions.push(
      "Have a non-alcoholic mocktail-making session or explore a café.",
      "Go on a scenic picnic or have tea at a local tearoom."
    );
  } else if (friendScores[0] >= 3 && userScores[0] >= 3) {
    interests.push("Both enjoy social drinking.");
    activitySuggestions.push(
      "Meet for drinks at a local bar or host a cocktail night.",
      "Explore a wine-tasting event or brewery tour."
    );
  }

  if (friendScores[1] >= 3 && userScores[1] >= 3) {
    interests.push("Both enjoy social outings and spending time with friends.");
    activitySuggestions.push(
      "Plan a group hangout or organize a game night.",
      "Visit an escape room or amusement park with friends."
    );
  }

  if (friendScores[4] >= 4 && userScores[4] >= 4) {
    interests.push("Both are total pet lovers.");
    activitySuggestions.push(
      "Plan a pet playdate or volunteer at an animal shelter.",
      "Take your pets for a hike or to a pet-friendly café."
    );
  }

  if (friendScores[5] >= 3 && userScores[5] >= 3) {
    interests.push("Both enjoy adventurous travel experiences.");
    activitySuggestions.push(
      "Plan a hiking trip or explore a new city together.",
      "Try a thrilling activity like ziplining or skydiving.",
      "Go camping and stargazing at a national park."
    );
  }

  if (friendScores[6] >= 4 && userScores[6] >= 4) {
    interests.push("Both love chilling out and watching films.");
    activitySuggestions.push(
      "Go to the cinema or host a movie night.",
      "Watch a new series together or revisit a classic film series.",
      "Attend a film festival or outdoor movie screening."
    );
  }

  if (friendScores[2] >= 3 && userScores[2] >= 3) {
    interests.push("Both are foodies and love exploring cuisines.");
    activitySuggestions.push(
      "Try a cooking class together or experiment with a new recipe.",
      "Explore a food festival or restaurant hop for different cuisines.",
      "Organize a themed dinner party with friends."
    );
  }

  if (friendScores[3] >= 3 && userScores[3] >= 3) {
    interests.push("Both enjoy music and attending live events.");
    activitySuggestions.push(
      "Go to a live concert or music festival.",
      "Jam together if you play instruments or create a playlist to share.",
      "Attend an open mic night or karaoke session."
    );
  }

  // Limit activity suggestions to a maximum of 3
  const limitedActivities = pickLimitedItems(activitySuggestions, 3);
  const limitedInterests = pickLimitedItems(interests, 3);

  return {
    interestSummary: limitedInterests.length > 0 ? limitedInterests.join(" ") : "No specific common interests identified.",
    activitySuggestions: limitedActivities.length > 0 ? limitedActivities.join(" ") : "No specific activities suggested."
  };
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

      const { interestSummary, activitySuggestions } = compatibility >= 90
        ? { 
            interestSummary: "You are almost the same person.", 
            activitySuggestions: "Plan a trip together or work on shared hobbies." 
          }
        : generateInterestDescription(person.scores, targetScores);

      return {
        name: person.name,
        photo: person.photo,
        compatibility: parseFloat(compatibility.toFixed(2)),
        interestSummary,
        activitySuggestions
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

          // Send results with activitySuggestions included
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
