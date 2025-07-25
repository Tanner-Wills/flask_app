from flask import Blueprint, request, jsonify
from app.models import Company
from app.database import db

bp = Blueprint('companies', __name__, url_prefix='/companies')

# API Routes
@bp.route('', methods=['GET'])
def get_companies():
    """Get all companies"""
    return jsonify([c.to_dict() for c in Company.query.all()])

@bp.route('', methods=['POST'])
def create_company():
    """Create a new company"""
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({'error': 'Company name is required'}), 400
    if Company.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Company already exists'}), 409
    company = Company(name=data['name'])
    db.session.add(company)
    db.session.commit()
    return jsonify(company.to_dict()), 201

@bp.route('/<int:company_id>', methods=['GET'])
def get_company(company_id):
    """Get a specific company"""
    company = Company.query.get_or_404(company_id)
    return jsonify(company.to_dict())
