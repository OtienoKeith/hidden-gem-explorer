let totalPoints = parseInt(localStorage.getItem('points')) || 0;
const visitedLocations = new Set(JSON.parse(localStorage.getItem('visitedLocations') || '[]'));

function updatePointsDisplay() {
    document.getElementById('points-display').textContent = totalPoints;
}

function collectPoints(locationId, points) {
    if (!visitedLocations.has(locationId)) {
        totalPoints += points;
        visitedLocations.add(locationId);
        
        localStorage.setItem('points', totalPoints);
        localStorage.setItem('visitedLocations', JSON.stringify([...visitedLocations]));
        
        updatePointsDisplay();
        
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'position-fixed bottom-0 end-0 p-3';
        toast.style.zIndex = 1000;
        toast.innerHTML = `
            <div class="toast show" role="alert">
                <div class="toast-header">
                    <strong class="me-auto">Points Collected!</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    You earned ${points} points!
                </div>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize points display
updatePointsDisplay();
