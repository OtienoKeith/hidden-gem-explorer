import os
import googlemaps
from flask import render_template, jsonify, request
from app import app

# Initialize Google Maps client
gmaps = googlemaps.Client(key=os.environ.get('GOOGLE_MAPS_API_KEY'))

def generate_locations_from_places(lat, lng):
    try:
        # Search for places near the given coordinates
        places_result = gmaps.places_nearby(
            location=(lat, lng),
            radius=1000,  # Search within 1km
            type='point_of_interest'
        )

        locations = []
        if places_result.get('results'):
            # Take up to 5 places
            for i, place in enumerate(places_result['results'][:5]):
                # Get detailed place information
                place_details = gmaps.place(place['place_id'], fields=['name', 'formatted_address', 'rating'])
                if place_details.get('result'):
                    details = place_details['result']
                    
                    # Calculate points based on rating if available
                    rating = details.get('rating', 3.0)
                    points = int(min(max(rating * 20, 50), 150))  # Points between 50-150
                    
                    locations.append({
                        "id": f"loc_{i}",
                        "name": details.get('name', f"Hidden Gem #{i}"),
                        "lat": place['geometry']['location']['lat'],
                        "lng": place['geometry']['location']['lng'],
                        "description": f"{details.get('name')} - {details.get('formatted_address', '')}. Activities: " +
                                     "1) Explore the surroundings and take photos " +
                                     "2) Learn about local history and culture " +
                                     "3) Meet locals and discover their stories " +
                                     "4) Try local cuisine and experiences",
                        "points": points
                    })

        # If no places found or error occurred, generate some backup locations
        if not locations:
            locations = [
                {
                    "id": f"loc_{i}",
                    "name": f"Interesting Location #{i}",
                    "lat": lat + ((-1 + i) * 0.002),
                    "lng": lng + ((-1 + i) * 0.002),
                    "description": f"A fascinating spot near {lat:.4f}, {lng:.4f}. Activities: " +
                                 "1) Take photos of the surroundings " +
                                 "2) Learn about local history " +
                                 "3) Meet locals and learn about their culture " +
                                 "4) Try local cuisine",
                    "points": 100
                }
                for i in range(5)
            ]

        return locations
    except Exception as e:
        print(f"Error generating locations: {e}")
        # Return backup locations in case of API error
        return [
            {
                "id": f"loc_{i}",
                "name": f"Hidden Gem #{i}",
                "lat": lat + ((-1 + i) * 0.002),
                "lng": lng + ((-1 + i) * 0.002),
                "description": f"A fascinating location near {lat:.4f}, {lng:.4f}. Activities: " +
                             "1) Take photos of the surroundings " +
                             "2) Learn about local history " +
                             "3) Meet locals and learn about their culture " +
                             "4) Try local cuisine",
                "points": 100
            }
            for i in range(5)
        ]

@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/explore')
def explore():
    return render_template('explore.html', api_key=app.config["GOOGLE_MAPS_API_KEY"])

@app.route('/visited')
def visited():
    return render_template('visited.html', api_key=app.config["GOOGLE_MAPS_API_KEY"])

@app.route('/api/places', methods=['POST'])
def get_places():
    data = request.get_json()
    lat = data.get('lat')
    lng = data.get('lng')
    
    if not lat or not lng:
        return jsonify({'error': 'Missing coordinates'}), 400
    
    # Return nearby attractions as potential point-earning locations
    return jsonify({
        'locations': generate_locations_from_places(lat, lng)
    })
