let visitedMap;
const visitedLocations = new Set(JSON.parse(localStorage.getItem('visitedLocations') || '[]'));
const locationDetails = JSON.parse(localStorage.getItem('locationDetails') || '{}');

function initializeViews() {
    const gridView = document.getElementById('grid-view');
    const mapView = document.getElementById('map-view');
    const viewGrid = document.getElementById('view-grid');
    const viewMap = document.getElementById('view-map');

    viewGrid.addEventListener('click', () => {
        gridView.style.display = 'block';
        mapView.style.display = 'none';
        viewGrid.classList.add('active');
        viewMap.classList.remove('active');
    });

    viewMap.addEventListener('click', () => {
        gridView.style.display = 'none';
        mapView.style.display = 'block';
        viewMap.classList.add('active');
        viewGrid.classList.remove('active');
        initMap();
    });
}

function initMap() {
    if (!visitedMap) {
        visitedMap = new google.maps.Map(document.getElementById('visited-map'), {
            center: { lat: 0, lng: 0 },
            zoom: 2
        });

        // Add markers for all visited locations
        Object.entries(locationDetails).forEach(([id, location]) => {
            if (visitedLocations.has(id)) {
                new google.maps.marker.AdvancedMarkerElement({
                    map: visitedMap,
                    position: { lat: location.lat, lng: location.lng },
                    title: location.name,
                    content: new google.maps.marker.PinElement({
                        glyph: "✓",
                        glyphColor: "#FFFFFF",
                        background: "#4CAF50"
                    })
                });
            }
        });
    }
}

function displayVisitedPlaces() {
    const grid = document.getElementById('visited-places-grid');
    const template = document.getElementById('place-card-template');
    grid.innerHTML = '';

    const places = Object.entries(locationDetails)
        .filter(([id]) => visitedLocations.has(id))
        .map(([id, location]) => ({
            id,
            ...location,
            visitDate: location.visitDate || new Date().toISOString()
        }));

    // Sort places based on selected option
    const sortSelect = document.getElementById('sort-select');
    const sortOrder = sortSelect.value;

    places.sort((a, b) => {
        switch (sortOrder) {
            case 'date-desc':
                return new Date(b.visitDate) - new Date(a.visitDate);
            case 'date-asc':
                return new Date(a.visitDate) - new Date(b.visitDate);
            case 'points-desc':
                return b.points - a.points;
            case 'points-asc':
                return a.points - b.points;
        }
    });

    places.forEach(place => {
        const card = template.content.cloneNode(true);
        const title = card.querySelector('.card-title');
        const description = card.querySelector('.description');
        const points = card.querySelector('.points');
        const date = card.querySelector('.date');

        title.textContent = place.name;
        description.textContent = place.description.split('Activities:')[0];
        points.textContent = `${place.points} points`;
        date.textContent = new Date(place.visitDate).toLocaleDateString();

        grid.appendChild(card);
    });
}

// Initialize views and sorting
document.addEventListener('DOMContentLoaded', () => {
    initializeViews();
    displayVisitedPlaces();

    const sortSelect = document.getElementById('sort-select');
    sortSelect.addEventListener('change', displayVisitedPlaces);
});
