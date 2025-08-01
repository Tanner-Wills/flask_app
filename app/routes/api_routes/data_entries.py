from flask import Blueprint, request, jsonify
from app.models.models import Company, DataEntry
from app.database import db
from sqlalchemy import func
import csv
import io

bp = Blueprint('data_entries', __name__, url_prefix='/data-entries')


def create_data_entry_from_dict(data):
    required_fields = ['company_id', 'uid']
    for field in required_fields:
        if not data or field not in data:
            return {'error': f'{field} is required'}, 400

    company = Company.query.get(data['company_id'])
    if not company:
        return {'error': 'Company not found'}, 404

    existing_entry = DataEntry.query.filter_by(uid=data['uid']).first()
    if existing_entry:
        return {'error': 'UID already exists'}, 400

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

    return data_entry.to_dict(), 201


@bp.route('/upload-csv', methods=['POST'])
def upload_csv():
    if 'csv_file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['csv_file']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'File is not a CSV'}), 400

    try:
        stream = io.StringIO(file.stream.read().decode('utf-8'))
        reader = csv.DictReader(stream)

        imported = 0
        errors = []

        for row in reader:
            try:
                print("Processing row:", row)

                if 'company' in row and not row.get('company_id'):
                    company = Company.query.filter_by(name=row['company'].strip()).first()
                    if not company:
                        raise ValueError(f"Company '{row['company']}' not found")
                    row['company_id'] = company.id

                response, status = create_data_entry_from_dict(row)
                print("Response:", response, "Status:", status)

                if status == 201:
                    imported += 1
                else:
                    errors.append(response['error'])

            except Exception as e:
                errors.append(str(e))

        return jsonify({
            'message': f'Imported {imported} entries.',
            'errors': errors
        })

    except Exception as e:
        return jsonify({'error': f'Failed to process file: {str(e)}'}), 500


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
    response, status = create_data_entry_from_dict(data)
    return jsonify(response), status


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
    """Delete a data entry"""
    try:
        entry = DataEntry.query.get_or_404(entry_id)
        db.session.delete(entry)
        db.session.commit()
        return jsonify({'message': 'Data entry deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

