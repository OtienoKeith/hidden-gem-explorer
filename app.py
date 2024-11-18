import os
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "your-secret-key"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///gems.db"
app.config["GOOGLE_MAPS_API_KEY"] = os.environ.get("GOOGLE_MAPS_API_KEY", "your-api-key")

db.init_app(app)

def generate_locations_from_places(lat, lng):
    # Generate point-earning locations based on nearby attractions
    # This is a simplified version - in production you'd want to use the Places API
    locations = [
        {
            "id": f"loc_{i}",
            "name": f"Hidden Gem #{i}",
            "lat": lat + ((-1 + i) * 0.002),  # Spread locations around the center
            "lng": lng + ((-1 + i) * 0.002),
            "description": f"A fascinating location near {lat:.4f}, {lng:.4f}. Activities: " + 
                         "1) Take photos of the surroundings 2) Learn about local history " +
                         "3) Meet locals and learn about their culture 4) Try local cuisine",
            "points": 100
        }
        for i in range(5)  # Generate 5 locations around the given coordinates
    ]
    return locations

@app.route('/')
def index():
    return render_template('index.html', 
                         api_key=app.config["GOOGLE_MAPS_API_KEY"])

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

with app.app_context():
    import models
    db.create_all()