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
            "description": "World-famous 102-story landmark with observation deck offering spectacular city views. Look for the iconic spire!",
            "points": 100
        },
        {
            "id": 2,
            "name": "Central Park",
            "lat": 40.7829,
            "lng": -73.9654,
            "description": "Massive urban park with famous landmarks like Belvedere Castle and Bethesda Fountain. Start at the south entrance!",
            "points": 100
        },
        {
            "id": 3,
            "name": "Times Square",
            "lat": 40.7580,
            "lng": -73.9855,
            "description": "Bright, iconic hub of NYC. You can't miss the massive billboards and Broadway lights!",
            "points": 100
        },
        {
            "id": 4,
            "name": "Statue of Liberty",
            "lat": 40.6892,
            "lng": -74.0445,
            "description": "The famous Lady Liberty standing on Liberty Island. Best viewed from Battery Park!",
            "points": 150
        },
        {
            "id": 5,
            "name": "Brooklyn Bridge",
            "lat": 40.7061,
            "lng": -73.9969,
            "description": "Historic bridge connecting Manhattan and Brooklyn. Walk across for amazing city views!",
            "points": 100
        }
    ]
    return jsonify(locations)

with app.app_context():
    import models
    db.create_all()
