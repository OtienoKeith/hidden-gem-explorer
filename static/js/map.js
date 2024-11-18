let map;
let markers = [];
let currentInfoWindow = null;

async function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 13,
        mapTypeId: 'terrain',
        tilt: 45
    });

    // Load locations from backend
    const response = await fetch('/api/locations');
    const locations = await response.json();

    locations.forEach(location => {
        addMarker(location);
    });

    // Enable tilt when zoomed in
    map.addListener('zoom_changed', () => {
        if (map.getZoom() > 15) {
            map.setTilt(45);
        } else {
            map.setTilt(0);
        }
    });
}

function addMarker(location) {
    const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.name,
        icon: {
            url: '/static/img/marker.svg',
            scaledSize: new google.maps.Size(30, 30)
        }
    });

    marker.addListener('click', () => {
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }

        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="info-window">
                    <h5>${location.name}</h5>
                    <p>${location.description}</p>
                    <button onclick="collectPoints(${location.id}, ${location.points})" 
                            class="btn btn-sm btn-success">
                        Collect ${location.points} points
                    </button>
                </div>
            `
        });

        infoWindow.open(map, marker);
        currentInfoWindow = infoWindow;
        
        updateLocationInfo(location);
        getSuggestions(location);
    });

    markers.push(marker);
}

function updateLocationInfo(location) {
    const locationInfo = document.getElementById('location-info');
    locationInfo.innerHTML = `
        <h4>${location.name}</h4>
        <p>${location.description}</p>
        <p><strong>Points available:</strong> ${location.points}</p>
    `;
}

function getSuggestions(location) {
    const suggestions = document.getElementById('suggestions');
    const service = new google.maps.places.PlacesService(map);
    
    const request = {
        location: { lat: location.lat, lng: location.lng },
        radius: 500,
        type: ['point_of_interest']
    };

    service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            suggestions.innerHTML = results.slice(0, 3).map(place => `
                <div class="list-group-item">
                    <h6>${place.name}</h6>
                    <small>${place.vicinity}</small>
                </div>
            `).join('');
        }
    });
}

window.onload = initMap;