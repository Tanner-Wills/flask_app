from flask import Blueprint, request, jsonify
from app.models.models import Company, DataEntry
from app.database import db
from sqlalchemy import func

bp = Blueprint('data_entries', __name__, url_prefix='/data-entries')


# GET all data entries (optionally filtered)
@bp.route('', methods=['GET'])
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
@bp.route('', methods=['POST'])
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
@bp.route('/<int:entry_id>', methods=['GET'])
def get_data_entry(entry_id):
    data_entry = DataEntry.query.get_or_404(entry_id)
    return jsonify(data_entry.to_dict())


# PUT update a data entry
@bp.route('/<int:entry_id>', methods=['PUT'])
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
@bp.route('/<int:entry_id>', methods=['DELETE'])
def delete_data_entry(entry_id):
    data_entry = DataEntry.query.get_or_404(entry_id)
    db.session.delete(data_entry)
    db.session.commit()
    return jsonify({'message': 'Data entry deleted successfully'})

