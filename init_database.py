#!/usr/bin/env python3
"""
Database initialization script using direct SQL schema
Run this to create the database and optionally populate it with sample data
"""

import os
import sys
import sqlite3
from datetime import datetime

# Add the parent directory to Python path to import our models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def create_database_with_schema():
    """Create the database using direct SQL schema"""
    db_path = os.path.join(os.path.dirname(__file__), 'app.db')
    
    # Remove existing database file if it exists
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed existing database: {db_path}")
    
    # Create database and tables using direct SQL
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Create companies table
        cursor.execute('''
        CREATE TABLE companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Create data_entries table
        cursor.execute('''
        CREATE TABLE data_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL,
            device_type TEXT,
            uid TEXT NOT NULL UNIQUE,
            data_type TEXT,
            data_set TEXT,
            data_going_to TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
        )
        ''')
        
        # Create indexes
        indexes = [
            "CREATE INDEX idx_company_id ON data_entries(company_id)",
            "CREATE INDEX idx_uid ON data_entries(uid)",
            "CREATE INDEX idx_data_set ON data_entries(data_set)",
            "CREATE INDEX idx_company_data_set ON data_entries(company_id, data_set)",
            "CREATE INDEX idx_uid_company ON data_entries(uid, company_id)",
            "CREATE INDEX idx_device_type ON data_entries(device_type)"
        ]
        
        for index_sql in indexes:
            cursor.execute(index_sql)
        
        conn.commit()
        print("Database created successfully!")
        
        # Verify tables were created
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"Tables created: {tables}")
        
        # Verify indexes were created
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'")
        indexes = [row[0] for row in cursor.fetchall()]
        print(f"Indexes created: {indexes}")
        
        return True
        
    except sqlite3.Error as e:
        print(f"Error creating database: {e}")
        return False
    finally:
        conn.close()

def populate_sample_data():
    """Populate the database with sample data using direct SQL"""
    db_path = os.path.join(os.path.dirname(__file__), 'app.db')
    
    if not os.path.exists(db_path):
        print("Database file not found!")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Insert sample companies
        companies_data = [
            "Company XYZ",
            "TechCorp Inc", 
            "DataSystems Ltd",
            "InnovateTech",
            "GlobalData Corp"
        ]
        
        for company_name in companies_data:
            cursor.execute("INSERT INTO companies (name) VALUES (?)", (company_name,))
        
        conn.commit()
        print(f"Created {len(companies_data)} companies")
        
        # Get company IDs for reference
        cursor.execute("SELECT id, name FROM companies")
        companies_dict = {name: id for id, name in cursor.fetchall()}
        
        # Insert sample data entries
        sample_entries = [
            {
                'company_name': 'Company XYZ',
                'device_type': 'sensor',
                'uid': 'xyz_sensor_001',
                'data_type': 'temperature',
                'data_set': 'production_data',
                'data_going_to': 'analytics_server'
            },
            {
                'company_name': 'Company XYZ',
                'device_type': 'sensor',
                'uid': 'xyz_sensor_002',
                'data_type': 'humidity',
                'data_set': 'production_data',
                'data_going_to': 'analytics_server'
            },
            {
                'company_name': 'Company XYZ',
                'device_type': 'gateway',
                'uid': 'xyz_gateway_001',
                'data_type': 'network',
                'data_set': 'network_logs',
                'data_going_to': 'monitoring_system'
            },
            {
                'company_name': 'TechCorp Inc',
                'device_type': 'camera',
                'uid': 'tech_cam_001',
                'data_type': 'video',
                'data_set': 'security_feed',
                'data_going_to': 'security_server'
            },
            {
                'company_name': 'TechCorp Inc',
                'device_type': 'sensor',
                'uid': 'tech_sensor_001',
                'data_type': 'motion',
                'data_set': 'security_feed',
                'data_going_to': 'security_server'
            },
            {
                'company_name': 'DataSystems Ltd',
                'device_type': 'server',
                'uid': 'ds_server_001',
                'data_type': 'logs',
                'data_set': 'system_logs',
                'data_going_to': 'log_aggregator'
            }
        ]
        
        entries_created = 0
        for entry_data in sample_entries:
            company_id = companies_dict.get(entry_data['company_name'])
            if company_id:
                cursor.execute('''
                INSERT INTO data_entries 
                (company_id, device_type, uid, data_type, data_set, data_going_to)
                VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    company_id,
                    entry_data['device_type'],
                    entry_data['uid'],
                    entry_data['data_type'],
                    entry_data['data_set'],
                    entry_data['data_going_to']
                ))
                entries_created += 1
        
        conn.commit()
        print(f"Created {entries_created} data entries")
        
        # Verify data was inserted
        cursor.execute("SELECT COUNT(*) FROM companies")
        company_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM data_entries")
        entry_count = cursor.fetchone()[0]
        
        print(f"Database now contains: {company_count} companies, {entry_count} data entries")
        
        return True
        
    except sqlite3.Error as e:
        print(f"Error populating database: {e}")
        return False
    finally:
        conn.close()

def verify_flask_compatibility():
    """Verify that the database works with Flask-SQLAlchemy"""
    try:
        from app import app, db
        from models import Company, DataEntry
        
        with app.app_context():
            # Test if Flask-SQLAlchemy can read the database
            company_count = Company.query.count()
            entry_count = DataEntry.query.count()
            
            print(f"Flask-SQLAlchemy verification:")
            print(f"- Can read companies: {company_count} found")
            print(f"- Can read data entries: {entry_count} found")
            
            # Test a simple query
            first_company = Company.query.first()
            if first_company:
                print(f"- First company: {first_company.name}")
            
            return True
            
    except Exception as e:
        print(f"Flask-SQLAlchemy verification failed: {e}")
        print("The database was created but there might be model compatibility issues.")
        return False

def main():
    """Main function"""
    print("Database Initialization Script (Direct Schema)")
    print("=" * 50)
    
    # Create database with direct SQL
    if not create_database_with_schema():
        print("Failed to create database!")
        return
    
    # Ask if user wants sample data
    while True:
        response = input("\nDo you want to populate the database with sample data? (y/n): ").lower().strip()
        if response in ['y', 'yes']:
            if populate_sample_data():
                print("Sample data populated successfully!")
            else:
                print("Failed to populate sample data!")
            break
        elif response in ['n', 'no']:
            print("Database created without sample data")
            break
        else:
            print("Please enter 'y' or 'n'")
    
    # Verify Flask compatibility
    print("\nVerifying Flask-SQLAlchemy compatibility...")
    verify_flask_compatibility()
    
    db_path = os.path.join(os.path.dirname(__file__), 'app.db')
    print(f"\nDatabase file location: {db_path}")
    print("You can now run your Flask application!")

if __name__ == '__main__':
    main()