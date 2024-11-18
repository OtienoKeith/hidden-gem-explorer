import os
from flask import Flask, render_template, jsonify
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

@app.route('/')
def index():
    return render_template('index.html', 
                         api_key=app.config["GOOGLE_MAPS_API_KEY"])

@app.route('/api/locations')
def get_locations():
    locations = [
        {
            "id": 1,
            "name": "Empire State Building",
            "lat": 40.7484,
            "lng": -73.9857,
            "description": "World-famous 102-story landmark. Activities: 1) Visit the observation deck on the 86th floor for stunning city views 2) Experience the art deco lobby 3) Take sunset photos from the viewing platform 4) Visit the Dare to Dream exhibit about the building's construction",
            "points": 100
        },
        {
            "id": 2,
            "name": "Central Park",
            "lat": 40.7829,
            "lng": -73.9654,
            "description": "Massive urban park with endless activities: 1) Row boats at Loeb Boathouse 2) Visit Belvedere Castle for views 3) Explore the Central Park Zoo 4) Picnic in Sheep Meadow 5) Ice skating at Wollman Rink (winter)",
            "points": 100
        },
        {
            "id": 3,
            "name": "Times Square",
            "lat": 40.7580,
            "lng": -73.9855,
            "description": "The heart of NYC entertainment. Must-do activities: 1) Watch street performers 2) Visit TKTS booth for Broadway show tickets 3) Experience the lights at night 4) Visit M&M's World and Disney Store 5) Take photos with costumed characters",
            "points": 100
        },
        {
            "id": 4,
            "name": "Statue of Liberty",
            "lat": 40.6892,
            "lng": -74.0445,
            "description": "Iconic symbol of freedom. Activities: 1) Take the ferry to Liberty Island 2) Climb to the crown (book in advance!) 3) Visit the museum on Liberty Island 4) Join a ranger-led tour 5) Take photos from Battery Park",
            "points": 150
        },
        {
            "id": 5,
            "name": "Brooklyn Bridge",
            "lat": 40.7061,
            "lng": -73.9969,
            "description": "Historic bridge with amazing views. Activities: 1) Walk across the bridge at sunset 2) Visit DUMBO for photos 3) Enjoy Brooklyn Bridge Park 4) Try grimaldi's Pizza nearby 5) Take the water taxi for bridge views",
            "points": 100
        }
    ]
    return jsonify(locations)

with app.app_context():
    import models
    db.create_all()
