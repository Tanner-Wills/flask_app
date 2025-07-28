from flask import request, Blueprint, render_template
from app.routes.api_routes.companies import get_companies
from app.routes.api_routes.data_entries import get_data_entry, get_data_entries
from app.routes.api_routes.stats import get_company_stats


tabs_bp = Blueprint('tabs', __name__)

@tabs_bp.route('/load-tab/<tab_name>')
def load_tab(tab_name):
    if tab_name == 'companies':
        # Fetch company data here
        return render_template('tabs/companies_tab.html', companies=get_companies())
    elif tab_name == 'data-entries':
        return render_template('tabs/data_entries_tab.html', entries=get_companies())
    elif tab_name == 'statistics':
        companies = get_companies()  # get list of companies
        return render_template('tabs/statistics_tab.html', companies=companies)
    else:
        return "<p>Invalid tab.</p>"


@tabs_bp.route('/load-tab/statistics-data')
def load_statistics_data():
    company_id = request.args.get('company_id', type=int)
    if not company_id:
        return "<p>No company selected.</p>", 400

    stats = get_company_stats(company_id)
    return render_template('tabs/statistics_data.html', stats=stats)