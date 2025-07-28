from flask import Blueprint, request, jsonify
from app.models.models import Company, DataEntry
from app.database import db
from sqlalchemy import func

bp = Blueprint('stats', __name__, url_prefix='/stats')


# GET stats for a specific company
@bp.route('/company/<int:company_id>', methods=['GET'])
def get_company_stats(company_id):
    company = Company.query.get_or_404(company_id)

    total_entries = DataEntry.query.filter_by(company_id=company_id).count()

    data_set_counts = db.session.query(
        DataEntry.data_set,
        func.count(DataEntry.id).label('count')
    ).filter_by(company_id=company_id).group_by(DataEntry.data_set).all()

    device_type_counts = db.session.query(
        DataEntry.device_type,
        func.count(DataEntry.id).label('count')
    ).filter_by(company_id=company_id).group_by(DataEntry.device_type).all()

    return jsonify({
        'company': company.to_dict(),
        'total_entries': total_entries,
        'data_set_counts': [{'data_set': ds, 'count': count} for ds, count in data_set_counts],
        'device_type_counts': [{'device_type': dt, 'count': count} for dt, count in device_type_counts]
    })


# GET count of entries by company name and data_set
@bp.route('/data-set-count', methods=['GET'])
def get_data_set_count():
    company_name = request.args.get('company_name')
    data_set = request.args.get('data_set')

    if not company_name or not data_set:
        return jsonify({'error': 'company_name and data_set parameters are required'}), 400

    count = db.session.query(func.count(DataEntry.id)).join(Company).filter(
        Company.name == company_name,
        DataEntry.data_set == data_set
    ).scalar()

    return jsonify({
        'company_name': company_name,
        'data_set': data_set,
        'count': count
    })


@bp.route('', methods=['GET'])  
def get_all_company_stats():
    """Get statistics about companies and data entries"""
    try:
        # Basic statistics
        total_companies = Company.query.count()
        total_entries = DataEntry.query.count()
        
        # Company with most entries
        company_entry_counts = db.session.query(
            Company.name,
            func.count(DataEntry.id).label('entry_count')
        ).join(DataEntry).group_by(Company.id, Company.name).order_by(
            func.count(DataEntry.id).desc()
        ).all()
        
        # Device type distribution
        device_type_counts = db.session.query(
            DataEntry.device_type,
            func.count(DataEntry.id).label('count')
        ).group_by(DataEntry.device_type).all()
        
        # Data set distribution
        data_set_counts = db.session.query(
            DataEntry.data_set,
            func.count(DataEntry.id).label('count')
        ).group_by(DataEntry.data_set).all()
        
        stats_data = {
            'total_companies': total_companies,
            'total_entries': total_entries,
            'company_entry_counts': [
                {'company': name, 'entries': count} 
                for name, count in company_entry_counts
            ],
            'device_type_distribution': [
                {'device_type': device_type or 'Unknown', 'count': count}
                for device_type, count in device_type_counts
            ],
            'data_set_distribution': [
                {'data_set': data_set or 'Unknown', 'count': count}
                for data_set, count in data_set_counts
            ]
        }
        
        return jsonify(stats_data)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

