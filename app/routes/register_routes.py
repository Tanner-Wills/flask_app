from .api_routes.companies import bp as companies_bp
from .api_routes.data_entries import bp as data_entries_bp
from .api_routes.stats import bp as stats_bp
from .html_routes.tabs import tabs_bp

def register_routes(app):
    app.register_blueprint(companies_bp)
    app.register_blueprint(data_entries_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(tabs_bp)
