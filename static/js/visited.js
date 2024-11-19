const totalPoints = parseInt(localStorage.getItem('points')) || 0;
const visitedLocations = new Set(JSON.parse(localStorage.getItem('visitedLocations') || '[]'));
const locationDetails = JSON.parse(localStorage.getItem('locationDetails') || '{}');
let visitedMap;

function buildVisitedMarker() {
    const markerContent = document.createElement('div');
    markerContent.innerHTML = `
        <div style="cursor: pointer;">
            <img src="/static/img/marker.svg" 
                 style="width: 40px; height: 40px; opacity: 0.7;"
                 alt="Visited location marker">
        </div>
    `;
    return markerContent;
}

function updateVisitedPageStats() {
    // Update total points display in navbar
    const pointsDisplays = document.querySelectorAll('#points-display');
    pointsDisplays.forEach(display => {
        display.textContent = totalPoints;
    });
    
    // Add total points to visited places page
    const statsContainer = document.querySelector('.col-md-6:first-child');
    if (statsContainer) {
        const statsHtml = `
            <div class="d-flex align-items-center mb-3">
                <i class="fas fa-star text-warning me-2"></i>
                <h4 class="mb-0">Total Points: ${totalPoints}</h4>
            </div>
        `;
        statsContainer.insertAdjacentHTML('beforeend', statsHtml);
    }
}

function initializeViews() {
    const gridView = document.getElementById('grid-view');
    const mapView = document.getElementById('map-view');
    const viewGrid = document.getElementById('view-grid');
    const viewMap = document.getElementById('view-map');

    viewGrid?.addEventListener('click', () => {
        gridView.style.display = 'block';
        mapView.style.display = 'none';
        viewGrid.classList.add('active');
        viewMap.classList.remove('active');
    });

    viewMap?.addEventListener('click', () => {
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
                new google.maps.Marker({
                    map: visitedMap,
                    position: { lat: location.lat, lng: location.lng },
                    title: location.name,
                    icon: {
                        url: '/static/img/marker.svg',
                        scaledSize: new google.maps.Size(40, 40),
                        opacity: 0.7
                    }
                });
            }
        });
    }
}

function displayVisitedPlaces() {
    const grid = document.getElementById('visited-places-grid');
    const template = document.getElementById('place-card-template');
    if (!grid || !template) return;
    
    grid.innerHTML = '';

    const places = Object.entries(locationDetails)
        .filter(([id]) => visitedLocations.has(id))
        .map(([id, location]) => ({
            id,
            ...location,
            visitDate: location.visitDate || new Date().toISOString()
        }));

    const sortSelect = document.getElementById('sort-select');
    const sortOrder = sortSelect?.value || 'date-desc';

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
            default:
                return 0;
        }
    });

    places.forEach(place => {
        const card = template.content.cloneNode(true);
        const title = card.querySelector('.card-title');
        const description = card.querySelector('.description');
        const points = card.querySelector('.points');
        const date = card.querySelector('.date');

        if (title) title.textContent = place.name;
        if (description) description.textContent = place.description.split('Activities:')[0];
        if (points) points.textContent = `${place.points} points`;
        if (date) date.textContent = new Date(place.visitDate).toLocaleDateString();

        grid.appendChild(card);
    });
}

// Initialize views and sorting
document.addEventListener('DOMContentLoaded', () => {
    initializeViews();
    displayVisitedPlaces();
    updateVisitedPageStats();

    const sortSelect = document.getElementById('sort-select');
    sortSelect?.addEventListener('change', displayVisitedPlaces);
    
    // Listen for storage changes
    window.addEventListener('storage', (e) => {
        if (e.key === 'points' || e.key === 'visitedLocations' || e.key === 'locationDetails') {
            displayVisitedPlaces();
            updateVisitedPageStats();
        }
    });
});
