from flask import Blueprint, request, jsonify
from app.models.models import Company
from app.database import db

bp = Blueprint('companies', __name__, url_prefix='/companies')

# API Routes
def fetch_companies():
    companies = Company.query.all()
    return [company.to_dict() for company in companies]

@bp.route('', methods=['GET'])
def get_companies():
    """Get all companies"""
    try:
        return jsonify(fetch_companies())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('', methods=['POST'])
def create_company():
    """Create a new company"""
    try:
        data = request.get_json()
        
        if not data or 'name' not in data:
            return jsonify({'error': 'Company name is required'}), 400
        
        # Check if company already exists
        existing_company = Company.query.filter_by(name=data['name']).first()
        if existing_company:
            return jsonify({'error': 'Company already exists'}), 400
        
        # Create new company
        company = Company(name=data['name'])
        db.session.add(company)
        db.session.commit()
        
        # return jsonify(company.to_dict()), 201
        return jsonify({
            'id': company.id,
            'name': company.name,
            'created_at': company.created_at.isoformat() if company.created_at else None,
            'message': 'Company created successfully'
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    

@bp.route('/<int:company_id>', methods=['GET'])
def get_company(company_id):
    """Get a specific company"""
    company = Company.query.get_or_404(company_id)
    return jsonify(company.to_dict())


@bp.route('/<int:company_id>', methods=['DELETE'])
def delete_company(company_id):
    """Delete a company and all its data entries"""
    try:
        company = Company.query.get_or_404(company_id)
        
        # Due to CASCADE, related data entries will be deleted automatically
        db.session.delete(company)
        db.session.commit()
        
        return jsonify({'message': 'Company deleted successfully'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

