from .api_routes.companies import bp as companies_bp
from .api_routes.data_entries import bp as data_entries_bp
from .api_routes.stats import bp as stats_bp
from .html_routes.pages import pages_bp

def register_routes(app):
    #API Routes
    app.register_blueprint(companies_bp)
    app.register_blueprint(data_entries_bp)
    app.register_blueprint(stats_bp)

    #HTML Routes
    app.register_blueprint(pages_bp)
