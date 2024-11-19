let totalPoints = parseInt(localStorage.getItem('points')) || 0;
const visitedLocations = new Set(JSON.parse(localStorage.getItem('visitedLocations') || '[]'));
const locationDetails = JSON.parse(localStorage.getItem('locationDetails') || '{}');
let totalAvailablePoints = 0;
let allLocations = [];

function updateAllPointsDisplays() {
    // Update all points displays across the site
    const pointsDisplays = document.querySelectorAll('#points-display');
    pointsDisplays.forEach(display => {
        display.textContent = totalPoints;
    });
    
    // Update progress bars
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(bar => {
        const progressPercentage = (totalPoints / totalAvailablePoints) * 100 || 0;
        bar.style.width = `${progressPercentage}%`;
        bar.setAttribute('aria-valuenow', progressPercentage);
    });
}

function showWelcomeModal() {
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
        const welcomeModal = new bootstrap.Modal(document.getElementById('welcomeModal'));
        welcomeModal.show();
        localStorage.setItem('hasVisited', 'true');
        
        document.getElementById('getStartedBtn')?.addEventListener('click', () => {
            welcomeModal.hide();
        });
    }
}

function updatePointsDisplay() {
    const totalAvailableDisplay = document.getElementById('total-available');
    
    if (totalAvailableDisplay) {
        totalAvailableDisplay.textContent = totalAvailablePoints;
    }
    
    updateAllPointsDisplays();
}

function clearPoints() {
    allLocations = [];
    totalAvailablePoints = 0;
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

function showAchievementToast(points) {
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

function collectPoints(locationId, points) {
    if (!visitedLocations.has(locationId)) {
        totalPoints += points;
        visitedLocations.add(locationId);
        
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
        
        updateAllPointsDisplays();
        updateMarkerStyles();
        celebratePoints();
        
        // Show achievement notification
        showAchievementToast(points);
    }
}

// Add event listener for storage changes
window.addEventListener('storage', (e) => {
    if (e.key === 'points') {
        totalPoints = parseInt(e.newValue) || 0;
        updateAllPointsDisplays();
    }
});

// Initialize points on page load
window.addEventListener('load', () => {
    updateAllPointsDisplays();
    showWelcomeModal();
});
