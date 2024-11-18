let map;
let markers = [];
let currentInfoWindow = null;
let searchBox;
let directionsService;
let directionsRenderer;

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

        // Initialize directions service
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            panel: document.getElementById('route-panel')
        });

        // Initialize search box
        const input = document.getElementById('pac-input');
        searchBox = new google.maps.places.SearchBox(input);
        
        // Bias searchBox results towards current map viewport
        map.addListener('bounds_changed', () => {
            searchBox.setBounds(map.getBounds());
        });

        // Listen for search results
        searchBox.addListener('places_changed', () => {
            const places = searchBox.getPlaces();
            if (places.length === 0) return;

            const bounds = new google.maps.LatLngBounds();
            places.forEach(place => {
                if (!place.geometry || !place.geometry.location) return;
                
                // Create a marker for the selected place
                new google.maps.Marker({
                    map,
                    title: place.name,
                    position: place.geometry.location,
                    icon: {
                        url: place.icon || '/static/img/marker.svg',
                        scaledSize: new google.maps.Size(24, 24)
                    }
                });

                bounds.extend(place.geometry.location);
            });
            map.fitBounds(bounds);
        });

        // Setup route planning
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

        // Initialize autocomplete for route inputs
        if (google.maps.places) {
            new google.maps.places.Autocomplete(document.getElementById('origin-input'));
            new google.maps.places.Autocomplete(document.getElementById('destination-input'));
        }

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
    if (!location) return;

    const isVisited = visitedLocations.has(location.id);
    
    // Use regular Marker as fallback if AdvancedMarkerElement is not available
    const MarkerClass = google.maps.marker?.AdvancedMarkerElement || google.maps.Marker;
    const marker = new MarkerClass({
        map,
        title: location.name,
        position: { lat: location.lat, lng: location.lng },
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
                    <button onclick="collectPoints(${location.id}, ${location.points})" 
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
            ${!isVisited ? `<button onclick="collectPoints(${location.id}, ${location.points})" 
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

// Initialize map when the API is loaded
window.initMap = initMap;
