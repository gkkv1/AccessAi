from fastapi import UploadFile

class SpeechService:
    async def transcribe_audio(self, file: UploadFile):
        # Stub for Whisper API
        print(f"Transcribing audio: {file.filename}")
        
        # Mock Response matching frontend expectations
        return {
            "transcript": [
                { "id": '1', "start": 0, "end": 15, "speaker": 'Facilitator', "text": 'Welcome everyone to our quarterly compliance training.' },
                { "id": '2', "start": 15, "end": 35, "speaker": 'Facilitator', "text": 'We are discussing accessibility today.' }
            ],
            "action_items": [
                { "id": '1', "text": 'Review the new policy', "completed": False }
            ]
        }

speech_service = SpeechService()
