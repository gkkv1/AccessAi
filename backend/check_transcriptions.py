from app.db.session import SessionLocal
from app.models.models import Transcription
from sqlalchemy import desc

db = SessionLocal()
try:
    transcriptions = db.query(Transcription).order_by(desc(Transcription.created_at)).limit(5).all()
    print(f"{'ID':<38} | {'Title':<20} | {'Source URL':<30} | {'Audio Path':<30} | {'Processed'}")
    print("-" * 130)
    for t in transcriptions:
        print(f"{str(t.id):<38} | {str(t.title)[:20]:<20} | {str(t.source_url)[:30]:<30} | {str(t.audio_file_path)[:30]:<30} | {t.processed}")
finally:
    db.close()
