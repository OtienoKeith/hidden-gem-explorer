let map;
let markers = [];
let currentInfoWindow = null;
let searchBox;
let directionsService;
let directionsRenderer;

function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    if (currentInfoWindow) {
        currentInfoWindow.close();
        currentInfoWindow = null;
    }
}

async function fetchLocations(lat, lng) {
    try {
        const response = await fetch('/api/places', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lat, lng })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch locations');
        }

        const data = await response.json();
        if (!data.locations || !Array.isArray(data.locations)) {
            throw new Error('Invalid location data received');
        }

        return data;
    } catch (error) {
        console.error('Error fetching locations:', error);
        throw error;
    }
}

async function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }),
            () => reject(new Error('Unable to get location')),
            { timeout: 10000 }
        );
    });
}

// Update the initMap function to handle all initialization
async function initMap() {
    try {
        console.log('Initializing map...');
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            throw new Error('Map container not found');
        }

        map = new google.maps.Map(mapElement, {
            center: { lat: 40.7128, lng: -74.0060 },
            zoom: 12,
            mapTypeId: 'terrain',
            tilt: 45
        });

        // Initialize features after map is created
        await setupMapFeatures();
        
        // Try to get user location
        try {
            const userLocation = await getUserLocation();
            map.setCenter(userLocation);
            map.setZoom(13);

            const data = await fetchLocations(userLocation.lat, userLocation.lng);
            initializePoints(data.locations);
            data.locations.forEach(location => addMarker(location));
        } catch (error) {
            console.log('Using default New York City location:', error.message);
            // Load default location data
            const data = await fetchLocations(40.7128, -74.0060);
            initializePoints(data.locations);
            data.locations.forEach(location => addMarker(location));
        }

        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Error initializing map:', error);
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div class="alert alert-danger">
                    Error loading map: ${error.message}
                    <button onclick="window.location.reload()" class="btn btn-outline-danger btn-sm ms-2">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }
}

async function setupMapFeatures() {
    // Initialize search box
    const input = document.getElementById('pac-input');
    if (input) {
        searchBox = new google.maps.places.SearchBox(input);
        map.addListener('bounds_changed', () => {
            searchBox.setBounds(map.getBounds());
        });

        searchBox.addListener('places_changed', async () => {
            try {
                const places = searchBox.getPlaces();
                if (places.length === 0) return;

                const place = places[0];
                if (!place.geometry || !place.geometry.location) {
                    throw new Error('Invalid place selected');
                }

                clearMarkers();
                clearPoints();
                
                map.setCenter(place.geometry.location);
                map.setZoom(13);

                const locationInfo = document.getElementById('location-info');
                locationInfo.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div><p>Loading locations...</p></div>';

                const data = await fetchLocations(
                    place.geometry.location.lat(),
                    place.geometry.location.lng()
                );

                initializePoints(data.locations);
                data.locations.forEach(location => addMarker(location));

                locationInfo.innerHTML = `
                    <h4>Exploring ${place.name}</h4>
                    <p>Discover hidden gems in this area! Click on markers to learn more and collect points.</p>
                `;
            } catch (error) {
                console.error('Error:', error);
                const locationInfo = document.getElementById('location-info');
                locationInfo.innerHTML = `
                    <div class="alert alert-danger">
                        Error: ${error.message}. Please try again.
                    </div>
                `;
            }
        });
    }

    // Initialize directions service
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        panel: document.getElementById('route-panel')
    });

    // Setup other features
    setupRoutePlanning();

    // Setup map tilt
    map.addListener('zoom_changed', () => {
        if (map.getZoom() > 15) {
            map.setTilt(45);
        } else {
            map.setTilt(0);
        }
    });
}

function addMarker(location) {
    if (!location) return;

    const isVisited = visitedLocations.has(location.id);
    
    const marker = new google.maps.Marker({
        map,
        position: { lat: location.lat, lng: location.lng },
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

        const [mainDesc, activities] = parseDescription(location.description);
        
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="info-window">
                    <h5 style="color: #000000; margin-bottom: 10px;">${location.name}</h5>
                    <p style="color: #000000;">${mainDesc}</p>
                    ${activities ? `
                        <div style="color: #000000;">
                            <strong>Activities:</strong><br>
                            ${activities.split(') ').join(')<br>')}
                        </div>
                    ` : ''}
                    <button onclick="collectPoints('${location.id}', ${location.points})" 
                            class="btn btn-sm ${isVisited ? 'btn-secondary disabled' : 'btn-success'} mt-2">
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

function setupRoutePlanning() {
    const routeButton = document.getElementById('route-button');
    const toggleRoute = document.getElementById('toggle-route');
    const routePanel = document.getElementById('route-panel');
    
    toggleRoute?.addEventListener('click', () => {
        routePanel.style.display = routePanel.style.display === 'none' ? 'block' : 'none';
    });

    routeButton?.addEventListener('click', () => {
        const origin = document.getElementById('origin-input')?.value;
        const destination = document.getElementById('destination-input')?.value;

        if (!origin || !destination) {
            alert('Please enter both origin and destination');
            return;
        }

        directionsService.route({
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING
        }, (response, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(response);
            } else {
                alert('Directions request failed due to ' + status);
            }
        });
    });

    if (google.maps.places) {
        new google.maps.places.Autocomplete(document.getElementById('origin-input'));
        new google.maps.places.Autocomplete(document.getElementById('destination-input'));
    }
}

function parseDescription(description) {
    if (!description) return ['No description available', ''];
    
    const parts = description.split('Activities:');
    return parts.length > 1 ? [parts[0].trim(), parts[1].trim()] : [description, ''];
}

function updateLocationInfo(location) {
    if (!location) return;

    const isVisited = visitedLocations.has(location.id);
    const locationInfo = document.getElementById('location-info');
    
    const [mainDesc, activities] = parseDescription(location.description);

    locationInfo.innerHTML = `
        <h4>${location.name}</h4>
        <p>${mainDesc}</p>
        ${activities ? `
            <div class="mb-3">
                <strong>Activities:</strong><br>
                ${activities.split(') ').join(')<br>')}
            </div>
        ` : ''}
        <div class="d-flex justify-content-between align-items-center">
            <span class="badge ${isVisited ? 'bg-secondary' : 'bg-success'}">
                ${isVisited ? 'Visited' : `${location.points} points available`}
            </span>
            ${!isVisited ? `<button onclick="collectPoints('${location.id}', ${location.points})" 
                                class="btn btn-sm btn-success">
                Collect Points
            </button>` : ''}
        </div>
    `;
}

function getSuggestions(location) {
    if (!location || !google.maps.places) return;

    const suggestions = document.getElementById('suggestions');
    const service = new google.maps.places.PlacesService(map);
    
    const request = {
        location: { lat: location.lat, lng: location.lng },
        radius: 500,
        type: ['point_of_interest']
    };

    service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            suggestions.innerHTML = results.slice(0, 3).map(place => `
                <div class="list-group-item">
                    <h6>${place.name}</h6>
                    <small>${place.vicinity}</small>
                </div>
            `).join('');
        }
    });
}
