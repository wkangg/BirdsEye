let pos, addPhotoBtn;

mapboxgl.accessToken = 'pk.eyJ1Ijoid2thbmdnIiwiYSI6ImNtNjFtdGFkbjBvejQybm9rdXpiYnYwc2MifQ.b0RaasJ_7-SKrZ4ou0HSGw';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/wkangg/cm61w732800e201s2hbqi9sqa',
    center: [-79.3985, 43.664],
    zoom: 12
});

const menu = document.querySelector('#menu');
const prompt = menu.querySelector('#prompt');
const blurElement = document.querySelector('#blur');
const imgInput = document.querySelector('#imgInput');
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

const escapeHTML = str => str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#039;');

const objectIdToDate = objectId => {
    const hexTimestamp = objectId.slice(0, 8);
    const timestamp = parseInt(hexTimestamp, 16);
    return new Date(timestamp * 1000);
};

const addPhotoPressed = () => imgInput.click();
imgInput.addEventListener('input', async () => {
    if (!imgInput.files[0]) return;
    fetch('http://localhost:3000/api/upload', {
        method: 'GET'
    })
        .then(async response => {
            const data = await response.text();
            if (response.status != 200) document.body.innerHTML = data;

            fetch(data, {
                method: 'PUT',
                headers: {
                    'Content-Type': imgInput.files[0].type
                },
                body: imgInput.files[0]
            })
                .then(async response => {
                    toastError(response.ok ? 'File uploaded successfully (this is temporary)' : await response.text());
                });
        })
        .catch(error => toastError(error))
        .finally(() => imgInput.value = '');
});

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
                    prompt.innerHTML = `${escapeHTML(location.prompt)}<br><span class="text-2xl">${objectIdToDate(location._id).toLocaleDateString('en-US')}</span>`;
                    toggleMenu();

                    const bounding = customMarker.getBoundingClientRect();
                    addPhotoBtn = document.createElement('img');
                    addPhotoBtn.style.pointerEvents = 'none';
                    addPhotoBtn.style.zIndex = '30';
                    addPhotoBtn.src = '/assets/addphoto.svg';
                    addPhotoBtn.style.position = 'fixed';
                    const translation = customMarker.style.transform.match(/translate\(([^,]+),([^,]+)\)/);
                    const translationX = translation[1].slice(0, -2);
                    const translationY = translation[2].slice(0, -2);
                    addPhotoBtn.style.left = translationX - bounding.width / 2 + 'px';
                    addPhotoBtn.style.top = translationY - bounding.height / 2 + 'px';
                    addPhotoBtn.style.width = '24px';
                    addPhotoBtn.style.height = '34px';
                    document.body.append(addPhotoBtn);
                    addPhotoBtn.style.transition = 'all 0.5s ease-in-out';

                    setTimeout(() => {
                        addPhotoBtn.style.pointerEvents = 'auto';
                        addPhotoBtn.style.cursor = 'pointer';
                        addPhotoBtn.addEventListener('click', addPhotoPressed);
                    }, 500);
                    resizeAddPhotoBtn();
                });
            });
        })
        .catch(error => toastError(error));
};

const constrainToAspectRatio = (x, y, aspectRatio) => {
    const currentAspectRatio = x / y;

    if (currentAspectRatio > aspectRatio) {
        x = y * aspectRatio;
    } else if (currentAspectRatio < aspectRatio) {
        y = x / aspectRatio;
    }

    return { x, y };
};

const resizeAddPhotoBtn = () => {
    if (!addPhotoBtn) return;
    setTimeout(() => {
        const x = window.innerWidth/1.5 - window.innerWidth*0.15;
        const y = window.innerHeight/2 - window.innerHeight*0.375;
        addPhotoBtn.style.left = x + 'px';
        addPhotoBtn.style.top = y + 'px';
        const constrained = constrainToAspectRatio(window.innerWidth*0.3, window.innerHeight*0.75, 24/34);
        addPhotoBtn.style.width = constrained.x+'px';
        addPhotoBtn.style.height = constrained.y+'px';
    }, 0);
};

let timer;
const redrawDebouce = () => {
    if (!addPhotoBtn) return;
    clearTimeout(timer);
    timer = setTimeout(resizeAddPhotoBtn, 30);
};

window.addEventListener('focus', resizeAddPhotoBtn, false);
window.addEventListener('resize', redrawDebouce, false);
document.addEventListener('fullscreenchange', resizeAddPhotoBtn, false);

const toggleMenu = event => {
    if (event && (event.srcElement === imgInput || event.srcElement === addPhotoBtn)) return;
    menu.classList.toggle('-translate-x-full');
    blurElement.classList.toggle('hidden');
    if (addPhotoBtn) {
        addPhotoBtn.remove();
        addPhotoBtn = null;
    }
};
blurElement.addEventListener('click', toggleMenu);

updateMarkers();
setInterval(updateMarkers, 60000);