let pos;

mapboxgl.accessToken = 'pk.eyJ1Ijoid2thbmdnIiwiYSI6ImNtNjFtdGFkbjBvejQybm9rdXpiYnYwc2MifQ.b0RaasJ_7-SKrZ4ou0HSGw';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/standard',
    center: [-79.4, 43.6],
    zoom: 12
});

const toastError = err => {
    if (!err) return;
    const message = err.stack ?? err.message ?? err;
    console.error(message);

    const toast = Toastify({
        text: message,
        gravity: 'bottom',
        position: 'left',
        duration: Math.max(3000, message.length * 100),
        style: {
            background: '#fdd',
            color: '#f00',
            borderRadius: '.625rem',
            border: '1px solid #f5c6cb'
        },
        onClick: () => toast.hideToast()
    }).showToast();
};

navigator.geolocation.getCurrentPosition(position => {
    pos = position.coords;
    if (map) {
        map.flyTo({
            center: [pos.longitude, pos.latitude],
            zoom: 15 - position.coords.accuracy / 100
        });
    }
}, error => toastError(error));

const existingMarkers = [];

let timeout;
const updateMarkers = async () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
        fetch(`/api/getMarkers?coords=${map.getCenter().lat},${map.getCenter().lng}`)
            .then(async res => {
                const markers = await res.json();
                if (!markers) return;
                if (markers.error) return toastError(markers.error);

                for (const exister of existingMarkers) {
                    if (!markers.some(marker => marker._id === exister)) {
                        const marker = document.querySelector(`#marker-${exister}`);
                        if (marker) marker.remove();
                    }
                }

                markers.forEach(location => {
                    existingMarkers.push(location._id);
                    if (existingMarkers[location._id]) return;

                    const marker = new mapboxgl.Marker()
                        .setLngLat([location.lng, location.lat])
                        .addTo(map);
                    marker._element.id = `marker-${location._id}`;

                    const popupContent = document.createElement('div');
                    const photo = document.createElement('img');
                    // photo.src = location.photo;
                    photo.style.width = '150px';

                    const prompt = document.createElement('p');
                    prompt.textContent = location.prompt;

                    const upvoteButton = document.createElement('button');
                    upvoteButton.textContent = 'Upvote';

                    popupContent.append(photo);
                    popupContent.append(prompt);
                    popupContent.append(upvoteButton);

                    const popup = new mapboxgl.Popup({ offset: 25 })
                        .setDOMContent(popupContent);

                    marker.setPopup(popup);
                });
            })
            .catch(error => toastError(error));
    }, 30);
};

updateMarkers();
map.on('move', () => updateMarkers());