from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create the SQLAlchemy engine
# pool_pre_ping=True helps prevent connection dropping issues
engine = create_engine(
    settings.DATABASE_URL, 
    pool_pre_ping=True
)

# Create a SessionLocal class
# Each instance of this class will be a database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Dependency to get a database session for API requests.
    Closes the session automatically after the request is done.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
