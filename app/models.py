from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from .database import db


# Models
class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    data_entries = db.relationship('DataEntry', backref='company', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class DataEntry(db.Model):
    __tablename__ = 'data_entries'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    device_type = db.Column(db.String(100))
    uid = db.Column(db.String(255))
    data_type = db.Column(db.String(100))
    data_set = db.Column(db.String(255))
    data_going_to = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Indexes are created automatically by SQLAlchemy for foreign keys
    __table_args__ = (
        db.Index('idx_uid', 'uid'),
        db.Index('idx_data_set', 'data_set'),
        db.Index('idx_company_data_set', 'company_id', 'data_set'),
        db.Index('idx_uid_company', 'uid', 'company_id'),
        db.Index('idx_device_type', 'device_type'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'company_name': self.company.name if self.company else None,
            'device_type': self.device_type,
            'uid': self.uid,
            'data_type': self.data_type,
            'data_set': self.data_set,
            'data_going_to': self.data_going_to,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
