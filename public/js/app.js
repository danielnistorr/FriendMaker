const socket = io(); // Connect to the server

// Replace this with the method you choose to fetch the dynamic username
const currentUserName = localStorage.getItem("username") || "Guest"; // Example: Fetch from local storage

if (currentUserName) {
    // Listen for updates specific to the current user
    socket.on(`updateMatches:${currentUserName}`, (data) => {
        console.log('Updated matches for', currentUserName, data.topMatches);
        updateMatchList(data.topMatches);
    });
} else {
    console.error("Current user name not found.");
}

// Function to render the top matches dynamically
function updateMatchList(matches) {
    const matchList = document.getElementById('match-list');
    matchList.innerHTML = ''; // Clear the existing list

    matches.forEach(match => {
        const matchElement = document.createElement('div');
        matchElement.innerHTML = `
            <h3>${match.name}</h3>
            <img src="${match.photo}" alt="${match.name}" style="width:100px;" />
            <p>Compatibility: ${match.compatibility}%</p>
        `;
        matchList.appendChild(matchElement);
    });
}
