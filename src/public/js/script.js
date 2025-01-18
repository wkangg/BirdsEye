let pos;

mapboxgl.accessToken = 'pk.eyJ1Ijoid2thbmdnIiwiYSI6ImNtNjFtdGFkbjBvejQybm9rdXpiYnYwc2MifQ.b0RaasJ_7-SKrZ4ou0HSGw';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/standard',
    center: [-79.3985, 43.664],
    zoom: 12
});

const menu = document.querySelector('#menu');
const blur = document.querySelector('#blur');
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
const updateMarkers = async () => {
    fetch('/api/getMarkers')
        .then(async res => {
            const markers = await res.json();
            if (!markers) return;
            if (markers.error) return toastError(markers.error);

            existingMarkers.forEach(marker => marker?.remove());

            markers.forEach(location => {
                const customMarker = document.createElement('img');
                customMarker.src = '/assets/polaroid.svg';

                const marker = new mapboxgl.Marker({
                    element: customMarker
                })
                    .setLngLat([location.lng, location.lat])
                    .addTo(map);
                existingMarkers.push(marker);

                customMarker.addEventListener('click', () => {
                    toggleMenu();
                });

                const popupContent = document.createElement('div');
                const photo = document.createElement('img');
                // photo.src = location.photo;
                photo.style.width = '150px';

                const prompt = document.createElement('p');
                prompt.textContent = location.prompt;

                popupContent.append(photo);
                popupContent.append(prompt);

                const popup = new mapboxgl.Popup({ offset: 25 })
                    .setDOMContent(popupContent);

                marker.setPopup(popup);
            });
        })
        .catch(error => toastError(error));
};

const toggleMenu = () => {
    menu.classList.toggle('-translate-x-full');
    blur.classList.toggle('hidden');
};
blur.addEventListener('click', toggleMenu);

updateMarkers();
setInterval(updateMarkers, 60000);