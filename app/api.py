import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import SQLALCHEMY_DATABASE_URI
from app.models.models import Company, DataEntry, Base  # Assuming you have these models set up

# Setup SQLAlchemy session
engine = create_engine(SQLALCHEMY_DATABASE_URI)
Session = sessionmaker(bind=engine)
session = Session()

def process_company_file(file_path):
    # Read the Excel file into a DataFrame
    df = pd.read_excel(file_path)
    
    # Loop through each row in the DataFrame
    for _, row in df.iterrows():
        partner_name = row['Partner']  # This corresponds to the company name
        
        # Check if the company already exists
        company = session.query(Company).filter_by(name=partner_name).first()
        if not company:
            # Insert the new company if not already present
            company = Company(name=partner_name)
            session.add(company)
            session.commit()  # Commit to get the company's id
        
        # Insert the data entry linked to the company
        data_entry = DataEntry(
            company_id=company.id,
            device_type=row['DeviceType'],
            uid=row['UID'],
            data_type=row['DataType'],
            data_set=row['DataSet'],
            data_going_to=row['Datagoingto']
        )
        session.add(data_entry)
    
    # Commit the session after all rows are processed
    session.commit()
