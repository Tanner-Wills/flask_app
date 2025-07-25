from .companies import bp as companies_bp
from .data_entries import bp as data_entries_bp
from .tabs import tabs_bp

def register_routes(app):
    app.register_blueprint(companies_bp)
    app.register_blueprint(data_entries_bp)
    app.register_blueprint(tabs_bp)
