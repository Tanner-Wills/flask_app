from flask import request, Blueprint, render_template
from app.routes.api_routes.companies import get_companies, fetch_companies
from app.routes.api_routes.data_entries import get_data_entry, get_data_entries
from app.routes.api_routes.stats import get_company_stats


pages_bp = Blueprint('pages', __name__, url_prefix='/pages')


@pages_bp.route('/companies')
def show_companies():
    return render_template('pages/companies_tab.html', active_tab='companies', companies=get_companies())


@pages_bp.route('/data-entries')
def show_data_entries():
    return render_template('pages/data_entries_tab.html', active_tab='data_entries', entries=get_companies())


@pages_bp.route('/statistics')
def show_statistics():
    return render_template('pages/statistics_tab.html', active_tab='statistics', companies=fetch_companies())

