from flask import Blueprint, request, jsonify
from app.models import Company, DataEntry
from app.database import db
from sqlalchemy import func

bp = Blueprint('data_entries', __name__, url_prefix='')


# GET all data entries (optionally filtered)
@bp.route('/data-entries', methods=['GET'])
def get_data_entries():
    company_name = request.args.get('company_name')
    uid = request.args.get('uid')
    data_set = request.args.get('data_set')

    query = DataEntry.query.join(Company)

    if company_name:
        query = query.filter(Company.name == company_name)
    if uid:
        query = query.filter(DataEntry.uid == uid)
    if data_set:
        query = query.filter(DataEntry.data_set == data_set)

    data_entries = query.all()
    return jsonify([entry.to_dict() for entry in data_entries])


# POST a new data entry
@bp.route('/data-entries', methods=['POST'])
def create_data_entry():
    data = request.get_json()

    if not data or 'company_id' not in data:
        return jsonify({'error': 'company_id is required'}), 400

    company = Company.query.get(data['company_id'])
    if not company:
        return jsonify({'error': 'Company not found'}), 404

    data_entry = DataEntry(
        company_id=data['company_id'],
        device_type=data.get('device_type'),
        uid=data.get('uid'),
        data_type=data.get('data_type'),
        data_set=data.get('data_set'),
        data_going_to=data.get('data_going_to')
    )

    db.session.add(data_entry)
    db.session.commit()

    return jsonify(data_entry.to_dict()), 201


# GET a specific data entry
@bp.route('/data-entries/<int:entry_id>', methods=['GET'])
def get_data_entry(entry_id):
    data_entry = DataEntry.query.get_or_404(entry_id)
    return jsonify(data_entry.to_dict())


# PUT update a data entry
@bp.route('/data-entries/<int:entry_id>', methods=['PUT'])
def update_data_entry(entry_id):
    data_entry = DataEntry.query.get_or_404(entry_id)
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'device_type' in data:
        data_entry.device_type = data['device_type']
    if 'uid' in data:
        data_entry.uid = data['uid']
    if 'data_type' in data:
        data_entry.data_type = data['data_type']
    if 'data_set' in data:
        data_entry.data_set = data['data_set']
    if 'data_going_to' in data:
        data_entry.data_going_to = data['data_going_to']

    db.session.commit()
    return jsonify(data_entry.to_dict())


# DELETE a data entry
@bp.route('/data-entries/<int:entry_id>', methods=['DELETE'])
def delete_data_entry(entry_id):
    data_entry = DataEntry.query.get_or_404(entry_id)
    db.session.delete(data_entry)
    db.session.commit()
    return jsonify({'message': 'Data entry deleted successfully'})


# GET stats for a specific company
@bp.route('/stats/company/<int:company_id>', methods=['GET'])
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
@bp.route('/stats/data-set-count', methods=['GET'])
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
