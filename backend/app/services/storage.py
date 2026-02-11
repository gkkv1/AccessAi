import os
import shutil
from fastapi import UploadFile
from supabase import create_client, Client
import requests
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.url: str = os.environ.get("SUPABASE_URL")
        self.key: str = os.environ.get("SUPABASE_KEY")
        self.bucket_name = "documents"
        
        if self.url and self.key:
            self.supabase: Client = create_client(self.url, self.key)
        else:
            print("Warning: SUPABASE_URL or SUPABASE_KEY not found. Storage will fail if attempted.")
            self.supabase = None

    async def upload_file(self, file: UploadFile, file_name: str) -> str:
        if not self.supabase:
            raise Exception("Supabase credentials not configured")

        # Read file content
        file_content = await file.read()
        
        # Upload to Supabase Storage
        # Note: 'file_options' might be needed depending on lib version, but basic upload should work
        try:
            # Overwrite if exists, though UUID filename makes collision unlikely
            res = self.supabase.storage.from_(self.bucket_name).upload(
                path=file_name,
                file=file_content,
                file_options={"content-type": file.content_type}
            )
            
            # Get Public URL
            # The get_public_url method returns a string URL
            public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(file_name)
            
            # Reset file pointer for subsequent reads (like local verification if needed)
            await file.seek(0)
            
            return public_url
            
        except Exception as e:
            print(f"Supabase Upload Error: {e}")
            raise e

    def download_file_to_temp(self, url: str, file_ext: str) -> str:
        """
        Downloads a file from a URL to a temporary local path.
        Returns the local path.
        """
        import tempfile
        
        # Create temp file
        fd, temp_path = tempfile.mkstemp(suffix=f".{file_ext}")
        os.close(fd) # Close file descriptor, we'll write via requests
        
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            with open(temp_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    
            return temp_path
        except Exception as e:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            raise e

storage_service = StorageService()
