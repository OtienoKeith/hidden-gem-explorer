# Hidden Gems Explorer 🗺️

An interactive 3D map exploration app for discovering hidden gems with basic gamification features.

## Features

- Interactive 3D map exploration
- Points system for visiting locations
- Real-time location discovery
- Route planning capabilities
- Progress tracking
- Activity suggestions
- Responsive design

## Technology Stack

- Flask backend
- Google Maps JavaScript API
- SQLAlchemy for database
- Bootstrap for UI
- Local storage for progress tracking

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/hidden-gems-explorer.git
cd hidden-gems-explorer
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
- Create a .env file with:
```
FLASK_SECRET_KEY=your-secret-key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

4. Initialize the database:
```bash
flask db init
flask db migrate
flask db upgrade
```

5. Run the application:
```bash
python main.py
```

## Environment Variables

- `FLASK_SECRET_KEY`: Secret key for Flask session management
- `GOOGLE_MAPS_API_KEY`: Google Maps API key for map functionality

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
