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
    # Sample location data
    locations = [
        {
            "id": 1,
            "name": "Hidden Waterfall",
            "lat": 40.7128,
            "lng": -74.0060,
            "description": "A beautiful waterfall hidden in the city",
            "points": 100
        },
        {
            "id": 2,
            "name": "Secret Garden",
            "lat": 40.7580,
            "lng": -73.9855,
            "description": "A peaceful garden away from the bustle",
            "points": 150
        }
    ]
    return jsonify(locations)

with app.app_context():
    import models
    db.create_all()
