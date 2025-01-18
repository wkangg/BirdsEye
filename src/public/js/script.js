// Firebase configuration
const firebaseConfig = {
    databaseURL: 'https://uofthacks-f093a-default-rtdb.firebaseio.com/'
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

mapboxgl.accessToken = 'pk.eyJ1Ijoid2thbmdnIiwiYSI6ImNtNjFtdGFkbjBvejQybm9rdXpiYnYwc2MifQ.b0RaasJ_7-SKrZ4ou0HSGw';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/standard',
    center: [-79.399, 43.6607],
    zoom: 15
});

const locations = [
    {
        id: 'location1',
        coordinates: [-79.399, 43.6607],
        photo: 'https://via.placeholder.com/150',
        prompt: 'This is a placeholder prompt for the first location.'
    },
    {
        id: 'location2',
        coordinates: [-79.395, 43.659],
        photo: 'https://via.placeholder.com/150',
        prompt: 'This is a placeholder prompt for the second location.'
    }
];

// Initialize votes in Firebase if not already set
locations.forEach(location => {
    db.ref(`locations/${location.id}`).once('value').then(snapshot => {
        if (!snapshot.exists()) {
            db.ref(`locations/${location.id}`).set({ votes: 0 });
        }
    });
});

function updateLeaderboard() {
    db.ref('locations').once('value', snapshot => {
        const leaderboard = document.querySelector('#leaderboard-list');
        leaderboard.innerHTML = '';

        const locationsData = [];
        snapshot.forEach(childSnapshot => {
            const data = childSnapshot.val();
            const id = childSnapshot.key;
            const location = locations.find(loc => loc.id === id);
            if (location) {
                locationsData.push({ ...location, votes: data.votes });
            }
        });

        locationsData
            .sort((a, b) => b.votes - a.votes)
            .forEach(location => {
                const li = document.createElement('li');
                li.textContent = `${location.prompt} - ${location.votes} votes`;
                leaderboard.append(li);
            });
    });
}

locations.forEach(location => {
    const marker = new mapboxgl.Marker()
        .setLngLat(location.coordinates)
        .addTo(map);

    const popupContent = document.createElement('div');
    const photo = document.createElement('img');
    photo.src = location.photo;
    photo.style.width = '150px';
    const prompt = document.createElement('p');
    prompt.textContent = location.prompt;
    const upvoteButton = document.createElement('button');
    upvoteButton.textContent = 'Upvote';

    const hasVotedKey = `hasVoted_${location.id}`;

    upvoteButton.addEventListener('click', () => {
        if (localStorage.getItem(hasVotedKey)) {
            alert('You have already voted for this location!');
        } else {
            const locationRef = db.ref(`locations/${location.id}`);
            locationRef.child('votes').transaction(currentVotes => (currentVotes || 0) + 1);
            localStorage.setItem(hasVotedKey, 'true');
        }
    });

    popupContent.append(photo);
    popupContent.append(prompt);
    popupContent.append(upvoteButton);

    const popup = new mapboxgl.Popup({ offset: 25 })
        .setDOMContent(popupContent);

    marker.setPopup(popup);
});

db.ref('locations').on('value', updateLeaderboard);
updateLeaderboard();