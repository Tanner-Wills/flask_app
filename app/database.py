from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_app(app: Flask):
    db.init_app(app)

def create_database(app: Flask):
    """Create the database and all tables"""
    with app.app_context():
        init_app(app)
        db.create_all()
        print("Database created successfully!")
