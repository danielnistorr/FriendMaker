
const fs = require('fs');
var friends = require('../data/friends');

module.exports = function(app, io) {
    const SIMILARITY_THRESHOLD = 75;

    function calculateSimilarity(answer1, answer2) {
        const difference = Math.abs(answer1 - answer2);
        const maxDifference = 4;
        return ((maxDifference - difference) / maxDifference) * 100;
    }

    app.post("/api/friends", function(req, res) {
        const newFriend = req.body;

        if (!newFriend.scores || !Array.isArray(newFriend.scores)) {
            return res.status(400).json({ error: "Scores are required and must be an array." });
        }

        // Check if the friend already exists
        const existingFriendIndex = friends.findIndex(friend =>
            friend.name === newFriend.name && friend.photo === newFriend.photo
        );

        if (existingFriendIndex !== -1) {
            // Update the existing friend's information
            friends[existingFriendIndex] = newFriend;
        } else {
            // Add the new friend
            friends.push(newFriend);
        }

        // Save updated friends list to file
        fs.writeFileSync(
            './data/friends.json',
            JSON.stringify(friends, null, 2),
            (err) => {
                if (err) throw err;
                console.log('Friends list updated.');
            }
        );

        // Calculate matches
        let matches = [];
        friends.forEach(friend => {
            if (friend.name === newFriend.name && friend.photo === newFriend.photo) return;

            let totalSimilarity = 0;
            friend.scores.forEach((score, i) => {
                const friendScore = parseInt(score);
                const userScore = parseInt(newFriend.scores[i]);
                totalSimilarity += calculateSimilarity(friendScore, userScore);
            });

            const compatibility = (totalSimilarity / friend.scores.length).toFixed(2);
            matches.push({
                name: friend.name,
                photo: friend.photo,
                compatibility: parseFloat(compatibility),
            });
        });

        matches.sort((a, b) => b.compatibility - a.compatibility);
        const topMatches = matches.slice(0, 3);

        // Emit updates via WebSocket
        io.emit("updateMatches", { topMatches });

        res.json({ topMatches });
    });
};
