let map;
let markers = [];
let currentInfoWindow = null;

async function initMap() {
    try {
        console.log('Initializing map...');
        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 40.7580, lng: -73.9855 },  // Times Square
            zoom: 12,
            mapTypeId: 'terrain',
            tilt: 45
        });
        console.log('Map initialized successfully');

        // Load locations from backend
        const response = await fetch('/api/locations');
        const locations = await response.json();
        console.log('Locations loaded:', locations);
        
        // Initialize points system with locations
        initializePoints(locations);

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

    } catch (error) {
        console.error('Error initializing map:', error);
        document.getElementById('map').innerHTML = '<div class="alert alert-danger">Error loading map. Please refresh the page.</div>';
    }
}

function addMarker(location) {
    const isVisited = visitedLocations.has(location.id);
    const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.name,
        icon: {
            url: '/static/img/marker.svg',
            scaledSize: new google.maps.Size(40, 40),
            opacity: isVisited ? 0.5 : 1
        }
    });

    marker.addListener('click', () => {
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }

        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="info-window">
                    <h5 style="color: #000000;">${location.name}</h5>
                    <p style="color: #000000;">${location.description}</p>
                    <button onclick="collectPoints(${location.id}, ${location.points})" 
                            class="btn btn-sm ${isVisited ? 'btn-secondary disabled' : 'btn-success'}">
                        ${isVisited ? 'Already Visited' : `Collect ${location.points} points`}
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
    const isVisited = visitedLocations.has(location.id);
    const locationInfo = document.getElementById('location-info');
    locationInfo.innerHTML = `
        <h4>${location.name}</h4>
        <p>${location.description}</p>
        <div class="d-flex justify-content-between align-items-center">
            <span class="badge ${isVisited ? 'bg-secondary' : 'bg-success'}">
                ${isVisited ? 'Visited' : `${location.points} points available`}
            </span>
            ${!isVisited ? `<button onclick="collectPoints(${location.id}, ${location.points})" 
                                  class="btn btn-sm btn-success">
                Collect Points
            </button>` : ''}
        </div>
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
