from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from .database import db, init_app, create_database
from .routes.register_routes import register_routes
from config import SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS, SQLALCHEMY_DATABASE_PATH
import os


def create_app():
    app = Flask(__name__)
    CORS(app)  # Enable CORS for API endpoints

    # Database configuration
    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI 
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = SQLALCHEMY_TRACK_MODIFICATIONS
    
    db.init_app(app)

    # Frontend route
    @app.route('/')
    def index():
        """Serve the frontend HTML"""
        # Redirect to companies page or render companies page directly
        return render_template('pages/companies_tab.html', active_tab='companies')

    # Favicon route to avoid 404 errors
    @app.route('/favicon.ico')
    def favicon():
        """Serve favicon or return 204 No Content"""
        return '', 204

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

    register_routes(app)
    return app


def run_app():
    app = create_app()
    app.jinja_env.cache = {}
    if not os.path.exists(SQLALCHEMY_DATABASE_PATH):
        create_database(app)
    app.run(debug=True)
