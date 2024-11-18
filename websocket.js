const fs = require("fs");
const WebSocket = require("ws");

// Carica dati dal file JSON
const loadData = () => {
  try {
    const rawData = fs.readFileSync("data/friends.json");
    return JSON.parse(rawData);
  } catch (err) {
    console.error("Errore caricando il file JSON:", err);
    return [];
  }
};

// Calcola compatibilità tra due liste di punteggi
const compatibilityScore = (scores1, scores2) => {
  return 100 - scores1.reduce((sum, s1, index) => sum + Math.abs(s1 - scores2[index]), 0) / (scores1.length * 5) * 100;
};

// Genera una descrizione degli interessi comuni
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

// Trova le 3 persone più compatibili con descrizione degli interessi comuni
const findCompatiblePersons = (name, photo, data) => {
  const target = data.find(person => person.name === name && person.photo === photo);

  if (!target) return [];

  const targetScores = target.scores;

  const compatibilities = data
    .filter(person => person.name !== name) // Escludi la stessa persona
    .map(person => {
      const compatibility = compatibilityScore(targetScores, person.scores);
      let interestSummary;
      if (compatibility === 100) {
        interestSummary = "You are the same person";
      } else {
        interestSummary = generateInterestDescription(person.scores, targetScores);
      }
      return {
        name: person.name,
        photo: person.photo,
        compatibility: parseFloat(compatibility.toFixed(2)),
        interestSummary
      };
    })
    .filter(person => person.compatibility >= 50) // Filtra per compatibilità >= 50%
    .sort((a, b) => b.compatibility - a.compatibility) // Ordina per compatibilità decrescente
    .slice(0, 3); // Prendi i primi 3 risultati

  return compatibilities;
};

// Avvia il WebSocket server
const wss = new WebSocket.Server({ port: 6789 });

console.log("Server WebSocket avviato su ws://localhost:6789");

wss.on("connection", ws => {
  console.log("Nuovo client connesso");

  ws.on("message", message => {
    try {
      setInterval(() => {
        const userData = JSON.parse(message);
        const { name, photo } = userData;

        const data = loadData();
        const results = findCompatiblePersons(name, photo, data);

        ws.send(JSON.stringify(results));
      }, 1000);
    } catch (err) {
      console.error("Errore nella gestione del messaggio:", err);
      ws.send(JSON.stringify({ error: "Errore interno del server" }));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnesso");
  });
});