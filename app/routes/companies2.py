# Add these routes to your Flask app.py file

from flask import Flask, jsonify, request, render_template
from sqlalchemy import func
from models import Company, DataEntry, db

# Your existing app setup...
app = Flask(__name__)
# ... your existing configuration ...

@app.route('/')
def index():
    """Main page route"""
    return render_template('index.html')

@app.route('/api/companies', methods=['GET'])
def get_companies():
    """Get all companies"""
    try:
        companies = Company.query.all()
        companies_data = []
        
        for company in companies:
            companies_data.append({
                'id': company.id,
                'name': company.name,
                'created_at': company.created_at.isoformat() if company.created_at else None
            })
        
        return jsonify(companies_data)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data-entries', methods=['GET'])
def get_data_entries():
    """Get all data entries or filter by company"""
    try:
        company_id = request.args.get('company_id')
        
        if company_id:
            # Filter by company
            data_entries = DataEntry.query.filter_by(company_id=company_id).all()
        else:
            # Get all data entries
            data_entries = DataEntry.query.all()
        
        entries_data = []
        for entry in data_entries:
            entries_data.append({
                'id': entry.id,
                'company_id': entry.company_id,
                'device_type': entry.device_type,
                'uid': entry.uid,
                'data_type': entry.data_type,
                'data_set': entry.data_set,
                'data_going_to': entry.data_going_to,
                'created_at': entry.created_at.isoformat() if entry.created_at else None,
                'company_name': entry.company.name if entry.company else None
            })
        
        return jsonify(entries_data)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/companies/stats', methods=['GET'])  
def get_company_stats():
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

@app.route('/api/companies', methods=['POST'])
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
        
        return jsonify({
            'id': company.id,
            'name': company.name,
            'created_at': company.created_at.isoformat() if company.created_at else None,
            'message': 'Company created successfully'
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/data-entries', methods=['POST'])
def create_data_entry():
    """Create a new data entry"""
    try:
        data = request.get_json()
        
        required_fields = ['company_id', 'uid']
        for field in required_fields:
            if not data or field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if company exists
        company = Company.query.get(data['company_id'])
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Check if UID already exists
        existing_entry = DataEntry.query.filter_by(uid=data['uid']).first()
        if existing_entry:
            return jsonify({'error': 'UID already exists'}), 400
        
        # Create new data entry
        entry = DataEntry(
            company_id=data['company_id'],
            device_type=data.get('device_type'),
            uid=data['uid'],
            data_type=data.get('data_type'),
            data_set=data.get('data_set'),
            data_going_to=data.get('data_going_to')
        )
        
        db.session.add(entry)
        db.session.commit()
        
        return jsonify({
            'id': entry.id,
            'company_id': entry.company_id,
            'device_type': entry.device_type,
            'uid': entry.uid,
            'data_type': entry.data_type,
            'data_set': entry.data_set,
            'data_going_to': entry.data_going_to,
            'created_at': entry.created_at.isoformat() if entry.created_at else None,
            'message': 'Data entry created successfully'
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/companies/<int:company_id>', methods=['DELETE'])
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

@app.route('/api/data-entries/<int:entry_id>', methods=['DELETE'])
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

# Favicon route to avoid 404 errors
@app.route('/favicon.ico')
def favicon():
    """Serve favicon or return 204 No Content"""
    return '', 204

# Error handlers
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    if request.path.startswith('/api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    db.session.rollback()
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Internal server error'}), 500
    return render_template('500.html'), 500

if __name__ == '__main__':
    app.run(debug=True)