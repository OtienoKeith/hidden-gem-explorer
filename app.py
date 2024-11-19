import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__)

# Configuration
app.config.update(
    SECRET_KEY=os.environ.get("FLASK_SECRET_KEY", "your-secret-key"),
    SQLALCHEMY_DATABASE_URI="sqlite:///gems.db",
    GOOGLE_MAPS_API_KEY=os.environ.get("GOOGLE_MAPS_API_KEY"),
    DEBUG=True
)

db.init_app(app)

# Add caching headers
@app.after_request
def add_header(response):
    if 'Cache-Control' not in response.headers:
        response.headers['Cache-Control'] = 'public, max-age=300'
    return response

# Import models after db initialization
import models

# Initialize database tables
with app.app_context():
    try:
        db.create_all()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Error initializing database: {e}")

# Import routes after app initialization
import routes
