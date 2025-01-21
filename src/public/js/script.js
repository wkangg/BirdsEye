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
const nearme = document.querySelector('#nearme');
const nearmeList = nearme.querySelector('#nearme-list');
const photoContainer = document.querySelector('#photoContainer');
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

const isLoggedIn = document.body.dataset.loggedIn === 'true';

const measure = (lat1, lon1, lat2, lon2) => {
    const R = 6378.137; // Radius of earth in KM
    const dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
    const dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2)
      + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
      * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d * 1000; // meters
};

navigator.geolocation.getCurrentPosition(position => {
    pos = position.coords;
    if (map) {
        map.flyTo({
            center: [pos.longitude, pos.latitude],
            zoom: 15 - position.coords.accuracy / 100
        });
    }
    nearme.classList.remove('hidden');

    fetch('/api/getMarkers')
        .then(async res => {
            const markers = await res.json();
            if (!markers) return;
            if (markers.error) return toastError(markers.error);

            markers.forEach(location => {
                const distance = Math.hypot(pos.latitude - location.lat, pos.longitude - location.lng);
                location.distance = distance;
            });

            markers.sort((a, b) => a.distance - b.distance);
            markers.forEach(location => {
                const item = document.createElement('li');
                item.classList.add('p-2', 'border-b', 'border-gray-300', 'text-sm', 'cursor-pointer');
                const meters = Math.round(measure(pos.latitude, pos.longitude, location.lat, location.lng));
                item.textContent = `${location.prompt} - ${meters > 1000 ? meters/1000 : meters} ${meters > 1000 ? 'kilo' : ''}metres`;

                item.addEventListener('click', () => {
                    map.flyTo({
                        center: [location.lng, location.lat],
                        zoom: 15
                    });
                });

                nearmeList.append(item);
            });
        });
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

const formatDate = date => {
    const options = {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    };

    const currentYear = new Date().getFullYear();
    const year = date.getFullYear();

    if (year !== currentYear) {
        options.year = 'numeric';
    }

    return date.toLocaleString('en-US', options);
};

const addPhotoPressed = () => {
    if (!isLoggedIn) return toastError('You must be logged in to upload photos');
    imgInput.click();
};
imgInput.addEventListener('input', async () => {
    if (!imgInput.files[0]) return;
    fetch(`/api/upload?marker=${lastClickedMarker?._id ?? ''}`, {
        method: 'GET'
    })
        .then(async response => {
            const data = await response.text();
            if (!response.ok) return toastError(data);

            fetch(data, {
                method: 'PUT',
                headers: {
                    'Content-Type': imgInput.files[0].type
                },
                body: imgInput.files[0]
            })
                .then(async response => {
                    if (!response.ok) return toastError(await response.text());
                    refreshPhotoContainer(lastClickedMarker._id);
                });
        })
        .catch(error => toastError(error))
        .finally(() => imgInput.value = '');
});

const constrainToAspectRatio = (x, y, aspectRatio) => {
    const currentAspectRatio = x / y;

    if (currentAspectRatio > aspectRatio) {
        x = y * aspectRatio;
    } else if (currentAspectRatio < aspectRatio) {
        y = x / aspectRatio;
    }

    return { x, y };
};

const refreshPhotoContainer = markerID => {
    fetch(`/api/getMarkerSubmissions?marker=${markerID}`)
        .then(async res => {
            photoContainer.innerHTML = "No one's posted yet, maybe you can be the first!";

            const photos = await res.json();
            if (!photos || photos.subs.length === 0 || !res.ok) return;

            photoContainer.innerHTML = '';
            for (const photo of photos.subs) {
                const polaroidBg = document.createElement('div');
                polaroidBg.classList.add('relative', 'flex', 'flex-col', 'items-center', 'bg-white', 'shadow-lg', 'rounded-lg', 'overflow-hidden', 'p-4');

                const uploader = document.createElement('p');
                uploader.classList.add('text-center', 'text-lg', 'font-semibold', 'text-black', 'w-full');
                uploader.innerHTML = escapeHTML(photo.username);
                polaroidBg.append(uploader);

                const polaroidContainer = document.createElement('div');
                polaroidContainer.classList.add('relative', 'bg-gray-200', 'overflow-hidden');
                polaroidBg.append(polaroidContainer);

                const img = document.createElement('img');
                img.loading = 'lazy';
                polaroidBg.style.width = '200px';
                polaroidBg.style.height = '200px';
                img.classList.add('w-auto', 'h-auto', 'max-w-full', 'max-h-full');
                const contSize = photoContainer.getBoundingClientRect();
                img.addEventListener('load', async () => {
                    const constrained = constrainToAspectRatio(Math.min(contSize.width/3.35, img.naturalWidth), Math.min(contSize.height/2, img.naturalHeight), img.naturalWidth / img.naturalHeight);
                    polaroidBg.style.width = `${constrained.x}px`;
                    polaroidBg.style.height = `${constrained.y + 20}px`;
                });
                img.src = `https://cdn.wkang.ca/${photo.photoID}`;
                polaroidContainer.append(img);

                const likeContainer = document.createElement('div');

                const likeCount = document.createElement('p');
                likeCount.classList.add('mt-2', 'text-left', 'text-lg', 'font-semibold', 'text-black', 'w-full');
                likeCount.innerHTML = `${formatDate(objectIdToDate(photo._id))} (${photo.likes.length} like${photo.likes.length === 1 ? '' : 's'})`;
                likeContainer.append(likeCount);

                const likeBtn = document.createElement('img');
                likeBtn.classList.add('absolute', 'bottom-0', 'right-0', 'w-8', 'h-8', 'm-4', 'cursor-pointer');
                likeBtn.src = photo.likes?.includes(photos.me) ? '/assets/hearted.svg' : '/assets/unhearted.svg';
                likeBtn.addEventListener('click', () => {
                    fetch(`/api/likeSub?ID=${photo._id}`, {
                        method: 'POST'
                    })
                        .then(async response => {
                            const data = await response.text();
                            if (!response.ok) return toastError(data);

                            const [likes, liked] = data.split(',');
                            likeBtn.src = liked == 'true' ? '/assets/hearted.svg' : '/assets/unhearted.svg';
                            likeCount.innerHTML = `${formatDate(objectIdToDate(photo._id))} (${likes} like${likes == '1' ? '' : 's'})`;
                        })
                        .catch(error => toastError(error));
                });
                likeContainer.append(likeBtn);

                polaroidBg.append(likeContainer);
                photoContainer.append(polaroidBg);
            }
        });
};

let lastClickedMarker;
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
                location.element = marker;

                const popup = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false
                }).setText(location.prompt);

                customMarker.addEventListener('mouseenter', () => {
                    const popups = document.querySelectorAll('.mapboxgl-popup');
                    for (const old of popups) old.remove();
                    popup.setLngLat([location.lng, location.lat]).addTo(map);
                });
                customMarker.addEventListener('mouseleave', () => popup.remove());
                customMarker.addEventListener('click', async () => {
                    lastClickedMarker = location;
                    prompt.innerHTML = `${escapeHTML(location.prompt)}<br><span class="text-2xl">${formatDate(objectIdToDate(location._id))}</span>`;

                    toggleMenu();
                    refreshPhotoContainer(location._id);

                    addPhotoBtn = document.createElement('img');
                    addPhotoBtn.classList.add('addBtnPurge', 'cursor-pointer', 'z-30', 'fixed', 'transition-all', 'duration-[400ms]', 'ease-in-out');
                    addPhotoBtn.src = '/assets/addphoto.svg';
                    const translation = customMarker.style.transform.match(/translate\(([^,]+),([^,]+)\)/);
                    const translationX = translation[1].slice(0, -2);
                    const translationY = translation[2].slice(0, -2);
                    const bounding = customMarker.getBoundingClientRect();
                    addPhotoBtn.style.left = translationX - bounding.width / 2 + 'px';
                    addPhotoBtn.style.top = translationY - bounding.height / 2 + 'px';
                    addPhotoBtn.style.width = '24px';
                    addPhotoBtn.style.height = '34px';
                    document.body.append(addPhotoBtn);

                    setTimeout(() => {
                        addPhotoBtn.addEventListener('click', addPhotoPressed);
                    }, 400);
                    resizeAddPhotoBtn();
                });
            });
        })
        .catch(error => toastError(error));
};

const resizeAddPhotoBtn = () => {
    if (!addPhotoBtn) return;
    setTimeout(() => {
        const x = window.innerWidth/1.42;
        const y = window.innerHeight/7;
        addPhotoBtn.style.left = x + 'px';
        addPhotoBtn.style.top = y + 'px';
        const constrained = constrainToAspectRatio(window.innerWidth*0.3, window.innerHeight*0.725, 24/34);
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
    nearme.classList.toggle('translate-x-[120%]');
    blurElement.classList.toggle('hidden');
    if (addPhotoBtn) {
        setTimeout(() => {
            addPhotoBtn.classList.replace('duration-[400ms]', 'duration-300');
            const bounding = lastClickedMarker.element._element.getBoundingClientRect();
            const translation = lastClickedMarker.element._element.style.transform.match(/translate\(([^,]+),([^,]+)\)/);
            const translationX = translation[1].slice(0, -2);
            const translationY = translation[2].slice(0, -2);
            addPhotoBtn.style.left = translationX - bounding.width / 2 + 'px';
            addPhotoBtn.style.top = translationY - bounding.height / 2 + 'px';
            addPhotoBtn.style.width = '24px';
            addPhotoBtn.style.height = '34px';
            lastClickedMarker = null;
        }, 0);
        setTimeout(() => {
            addPhotoBtn.remove();
            addPhotoBtn = null;
            for (const child of document.querySelectorAll('.addBtnPurge'))
                child.remove();
        }, 300);
    }
};
blurElement.addEventListener('click', toggleMenu);

map.on('load', updateMarkers);
setInterval(updateMarkers, 60000);