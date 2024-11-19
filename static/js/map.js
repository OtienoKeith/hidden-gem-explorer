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

async function initMap() {
    try {
        console.log('Initializing map...');
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            throw new Error('Map container not found');
        }

        map = new google.maps.Map(mapElement, {
            center: { lat: 40.7128, lng: -74.0060 },
            zoom: 18, // Closer zoom for better 3D view
            mapTypeId: 'satellite',
            tilt: 45,
            heading: 0,
            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
            },
            // Enable all controls for better 3D navigation
            streetViewControl: true,
            rotateControl: true,
            scaleControl: true,
            fullscreenControl: true
        });

        // Add tilt button
        const tiltButton = document.createElement('button');
        tiltButton.classList.add('custom-map-control');
        tiltButton.innerHTML = '<i class="fas fa-cube"></i>';
        tiltButton.title = 'Toggle Tilt';
        map.controls[google.maps.ControlPosition.RIGHT_TOP].push(tiltButton);

        let isTilted = true;
        tiltButton.addEventListener('click', () => {
            isTilted = !isTilted;
            map.setTilt(isTilted ? 45 : 0);
            tiltButton.classList.toggle('active', isTilted);
        });

        // Add rotation control
        const rotateButton = document.createElement('button');
        rotateButton.classList.add('custom-map-control');
        rotateButton.innerHTML = '<i class="fas fa-sync"></i>';
        rotateButton.title = 'Rotate Map';
        map.controls[google.maps.ControlPosition.RIGHT_TOP].push(rotateButton);

        let heading = 0;
        rotateButton.addEventListener('click', () => {
            heading = (heading + 90) % 360;
            map.setHeading(heading);
        });

        // Initialize features after map is created
        await setupMapFeatures();
        
        // Try to get user location
        try {
            const userLocation = await getUserLocation();
            map.setCenter(userLocation);
            map.setZoom(18);
            map.setTilt(45);

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
    // Initialize search box with error handling
    try {
        const input = document.getElementById('pac-input');
        if (!input) throw new Error('Search input not found');

        // Create SearchBox with proper options
        searchBox = new google.maps.places.Autocomplete(input, {
            types: ['(cities)'],
            fields: ['geometry', 'name', 'formatted_address']
        });

        // Bind to map bounds
        map.addListener('bounds_changed', () => {
            searchBox.setBounds(map.getBounds());
        });

        // Listen for place selection
        searchBox.addListener('place_changed', async () => {
            try {
                const place = searchBox.getPlace();
                if (!place.geometry) throw new Error('Place has no geometry');

                clearMarkers();
                clearPoints();
                
                // Smooth transition to new location
                map.setZoom(18);
                map.setCenter(place.geometry.location);
                map.setTilt(45);

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
    } catch (error) {
        console.error('Error setting up search:', error);
        const searchContainer = document.querySelector('.card-body');
        if (searchContainer) {
            searchContainer.innerHTML += `
                <div class="alert alert-danger mt-2">
                    Search functionality unavailable: ${error.message}
                </div>
            `;
        }
    }

    // Initialize route planning with error handling
    try {
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            map,
            panel: document.getElementById('route-panel')
        });

        const originInput = document.getElementById('origin-input');
        const destInput = document.getElementById('destination-input');
        
        if (originInput && destInput) {
            new google.maps.places.Autocomplete(originInput);
            new google.maps.places.Autocomplete(destInput);
        }

        setupRoutePlanning();
    } catch (error) {
        console.error('Error setting up navigation:', error);
    }
}

function setupRoutePlanning() {
    const routeButton = document.getElementById('route-button');
    const toggleRoute = document.getElementById('toggle-route');
    const routePanel = document.getElementById('route-panel');
    
    if (toggleRoute && routePanel) {
        toggleRoute.addEventListener('click', () => {
            const isHidden = routePanel.style.display === 'none';
            routePanel.style.display = isHidden ? 'block' : 'none';
            toggleRoute.textContent = isHidden ? 'Hide Route Planner' : 'Show Route Planner';
        });
    }

    if (routeButton) {
        routeButton.addEventListener('click', () => {
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
                    // Clear existing markers when showing route
                    clearMarkers();
                } else {
                    alert('Could not calculate directions: ' + status);
                }
            });
        });
    }
}

function addMarker(location) {
    if (!location) return;

    const isVisited = visitedLocations.has(location.id);
    
    const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: location.lat, lng: location.lng },
        title: location.name,
        content: buildMarkerContent(location, isVisited)
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

function buildMarkerContent(location, isVisited) {
    const markerElement = document.createElement('div');
    markerElement.innerHTML = `
        <div style="cursor: pointer;">
            <img src="/static/img/marker.svg" 
                 style="width: 40px; height: 40px; opacity: ${isVisited ? '0.5' : '1'}"
                 alt="Location marker">
        </div>
    `;
    return markerElement;
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
