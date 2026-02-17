from app.db.session import SessionLocal
from app.models.models import Transcription
from sqlalchemy import desc

db = SessionLocal()
try:
    transcriptions = db.query(Transcription).order_by(desc(Transcription.created_at)).limit(3).all()
    for t in transcriptions:
        print(f"ID: {t.id}")
        print(f"Title: {t.title}")
        print(f"Source URL: {t.source_url}")
        print(f"Audio Path: {t.audio_file_path}")
        print(f"Processed: {t.processed}")
        print("-" * 50)
finally:
    db.close()
