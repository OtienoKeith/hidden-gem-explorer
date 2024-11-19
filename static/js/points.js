let totalPoints = parseInt(localStorage.getItem('points')) || 0;
const visitedLocations = new Set(JSON.parse(localStorage.getItem('visitedLocations') || '[]'));
const locationDetails = JSON.parse(localStorage.getItem('locationDetails') || '{}');
let totalAvailablePoints = 0;
let allLocations = [];

function showWelcomeModal() {
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
        const welcomeModal = new bootstrap.Modal(document.getElementById('welcomeModal'));
        welcomeModal.show();
        localStorage.setItem('hasVisited', 'true');
        
        document.getElementById('getStartedBtn').addEventListener('click', () => {
            welcomeModal.hide();
        });
    }
}

function updatePointsDisplay() {
    const pointsDisplay = document.getElementById('points-display');
    const totalAvailableDisplay = document.getElementById('total-available');
    const progressBar = document.getElementById('progress-bar');
    
    if (!pointsDisplay || !totalAvailableDisplay || !progressBar) {
        console.error('Required elements not found for points display');
        return;
    }

    pointsDisplay.textContent = totalPoints;
    totalAvailableDisplay.textContent = totalAvailablePoints;
    
    const progressPercentage = (totalPoints / totalAvailablePoints) * 100 || 0;
    progressBar.style.width = `${progressPercentage}%`;
    progressBar.setAttribute('aria-valuenow', progressPercentage);
}

function clearPoints() {
    allLocations = [];
    totalAvailablePoints = 0;
    // Clear visited locations when changing area
    visitedLocations.clear();
    localStorage.setItem('visitedLocations', '[]');
    localStorage.setItem('locationDetails', '{}');
    updatePointsDisplay();
}

function initializePoints(locations) {
    allLocations = locations;
    totalAvailablePoints = locations.reduce((sum, loc) => sum + loc.points, 0);
    updatePointsDisplay();
    updateMarkerStyles();
}

function updateMarkerStyles() {
    if (window.markers) {
        window.markers.forEach((marker, index) => {
            const location = allLocations[index];
            if (location && visitedLocations.has(location.id)) {
                if (marker.setIcon) {
                    marker.setIcon({
                        url: '/static/img/marker.svg',
                        scaledSize: new google.maps.Size(30, 30),
                        opacity: 0.5
                    });
                }
            }
        });
    }
}

function celebratePoints() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

function collectPoints(locationId, points) {
    if (!visitedLocations.has(locationId)) {
        totalPoints += points;
        visitedLocations.add(locationId);
        
        // Store location details with visit date
        const location = allLocations.find(loc => loc.id === locationId);
        if (location) {
            locationDetails[locationId] = {
                ...location,
                visitDate: new Date().toISOString()
            };
        }
        
        localStorage.setItem('points', totalPoints);
        localStorage.setItem('visitedLocations', JSON.stringify([...visitedLocations]));
        localStorage.setItem('locationDetails', JSON.stringify(locationDetails));
        
        updatePointsDisplay();
        updateMarkerStyles();
        
        // Trigger celebration effects
        celebratePoints();
        
        // Show achievement notification
        const toast = document.createElement('div');
        toast.className = 'position-fixed bottom-0 end-0 p-3';
        toast.style.zIndex = 1000;
        toast.innerHTML = `
            <div class="toast show" role="alert">
                <div class="toast-header bg-success text-white">
                    <i class="fas fa-trophy me-2"></i>
                    <strong class="me-auto">Achievement Unlocked!</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-star text-warning me-2"></i>
                        <div>
                            <strong>Points Earned: ${points}</strong><br>
                            <small>Keep exploring to find more gems!</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize points display and show welcome modal
window.addEventListener('load', () => {
    updatePointsDisplay();
    showWelcomeModal();
});
