import os

basedir = os.path.abspath(os.path.dirname(__file__))

SQLALCHEMY_DATABASE_PATH = os.path.join(basedir, "app.db")
SQLALCHEMY_DATABASE_URI = f'sqlite:///{SQLALCHEMY_DATABASE_PATH}'
SQLALCHEMY_TRACK_MODIFICATIONS = False