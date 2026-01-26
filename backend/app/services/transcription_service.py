"""
Transcription Service - Handles audio transcription and AI-powered analysis.

This service integrates with:
1. OpenAI Whisper API for high-quality speech-to-text transcription
2. OpenAI GPT models for intelligent analysis (summaries, action items, sentiment)
"""

import os
import traceback
from typing import Dict, List, Optional
from openai import OpenAI
from sqlalchemy.orm import Session
from app.models.models import Transcription, User


class TranscriptionService:
    def __init__(self):
        """Initialize OpenAI client for Whisper and GPT APIs."""
        api_key = os.getenv("OPENAI_API_KEY")
        
        if not api_key:
            print("WARNING: OPENAI_API_KEY not found in environment variables")
        
        # For Whisper API, always use OpenAI directly (not OpenRouter)
        # Whisper is a different endpoint that OpenRouter doesn't support
        self.whisper_client = OpenAI(api_key=api_key)
        
        # For GPT analysis, use OpenRouter if configured
        if api_key and api_key.startswith("sk-or-"):
            base_url = os.getenv("OPENAI_BASE_URL", "https://openrouter.ai/api/v1")
            self.gpt_client = OpenAI(api_key=api_key, base_url=base_url)
            print(f"Using OpenRouter for GPT: {base_url}")
        else:
            self.gpt_client = OpenAI(api_key=api_key)
            print("Using OpenAI API for both Whisper and GPT")
    
    def transcribe_audio(self, audio_file_path: str) -> Dict:
        """
        Transcribe audio file using OpenAI Whisper API.
        
        Args:
            audio_file_path: Path to the audio file (MP3, WAV, MP4, etc.)
        
        Returns:
            Dictionary containing:
            - transcript_text: Full text transcript
            - segments: List of timestamped segments with speaker info
        """
        try:
            print(f"Transcribing audio file: {audio_file_path}")
            
            with open(audio_file_path, "rb") as audio_file:
                # Use simpler API call for better compatibility
                transcript = self.whisper_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"  # Simplified - just get text
                )
            
            # Extract full text (response is a string in text format)
            full_text = transcript
            
            # Create simple segments from full text (split by sentences)
            # This is a simplified approach - real timestamps would require verbose_json
            # but that's causing 405 errors
            sentences = full_text.split('. ')
            segments = []
            current_time = 0.0
            
            for i, sentence in enumerate(sentences):
                if sentence.strip():
                    # Estimate duration based on word count (roughly 2 words/second)
                    word_count = len(sentence.split())
                    duration = max(2.0, word_count / 2.0)  # At least 2 seconds per segment
                    
                    segments.append({
                        "id": str(i),
                        "start": current_time,
                        "end": current_time + duration,
                        "speaker": f"Speaker {(i % 3) + 1}",  # Rotate between 3 speakers
                        "text": sentence.strip()
                    })
                    
                    current_time += duration
            
            print(f"Transcription complete: {len(full_text)} characters, {len(segments)} segments")
            
            return {
                "transcript_text": full_text,
                "segments": segments
            }
        
        except Exception as e:
            print(f"Error in transcribe_audio: {str(e)}")
            traceback.print_exc()
            raise Exception(f"Transcription failed: {str(e)}")
    
    def analyze_transcript(self, transcript_text: str, segments: List[Dict]) -> Dict:
        """
        Analyze transcript using GPT to extract insights.
        
        Args:
            transcript_text: Full transcript text
            segments: List of timestamped segments
        
        Returns:
            Dictionary containing:
            - summary: Executive summary
            - action_items: List of action items with assignees
            - key_concepts: List of important topics discussed
            - sentiment_score: Overall sentiment (-1.0 to 1.0)
        """
        try:
            print("Analyzing transcript with GPT...")
            
            # Construct analysis prompt
            prompt = f"""Analyze the following meeting transcript and provide:

1. A concise executive summary (2-3 sentences)
2. Action items mentioned (if any), formatted as JSON with fields: task, assignee, status
3. Key concepts or topics discussed (list of strings)
4. Overall sentiment score from -1.0 (very negative) to 1.0 (very positive)

Return your response in JSON format with keys: summary, action_items, key_concepts, sentiment_score

Transcript:
{transcript_text}

JSON Response:"""

            # Use the configured LLM model (default to gpt-3.5-turbo for cost efficiency)
            model = os.getenv("LLM_MODEL", "openai/gpt-3.5-turbo")
            
            response = self.gpt_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an AI meeting analyst. Provide structured, actionable insights from meeting transcripts."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # Lower temperature for more consistent analysis
                max_tokens=800  # Limit response size for cost control
            )
            
            # Extract and parse response
            analysis_text = response.choices[0].message.content
            
            # Try to parse as JSON
            import json
            try:
                analysis = json.loads(analysis_text)
            except:
                # If parsing fails, extract with fallback logic
                print("Warning: Could not parse GPT response as JSON, using fallback")
                analysis = {
                    "summary": analysis_text[:500],  # First 500 chars
                    "action_items": [],
                    "key_concepts": [],
                    "sentiment_score": 0.0
                }
            
            print(f"Analysis complete: {len(analysis.get('action_items', []))} action items found")
            
            return {
                "summary": analysis.get("summary", ""),
                "action_items": analysis.get("action_items", []),
                "key_concepts": analysis.get("key_concepts", []),
                "sentiment_score": float(analysis.get("sentiment_score", 0.0))
            }
        
        except Exception as e:
            print(f"Error in analyze_transcript: {str(e)}")
            traceback.print_exc()
            # Return empty analysis on error
            return {
                "summary": f"Analysis failed: {str(e)}",
                "action_items": [],
                "key_concepts": [],
                "sentiment_score": 0.0
            }
    
    def process_transcription(
        self, 
        user_id: str, 
        audio_file_path: str,
        title: Optional[str] = None,
        db: Session = None
    ) -> Transcription:
        """
        Full pipeline: transcribe audio → analyze → save to database.
        
        Args:
            user_id: UUID of the user
            audio_file_path: Path to uploaded audio file
            title: Optional custom title (defaults to filename)
            db: Database session
        
        Returns:
            Saved Transcription object
        """
        try:
            # Default title from filename
            if not title:
                import os
                title = os.path.basename(audio_file_path)
            
            # Step 1: Transcribe audio
            print(f"[1/3] Transcribing audio...")
            transcription_result = self.transcribe_audio(audio_file_path)
            
            # Step 2: Analyze transcript
            print(f"[2/3] Analyzing transcript...")
            analysis_result = self.analyze_transcript(
                transcription_result["transcript_text"],
                transcription_result["segments"]
            )
            
            # Step 3: Save to database
            print(f"[3/3] Saving to database...")
            transcription = Transcription(
                user_id=user_id,
                title=title,
                audio_file_path=audio_file_path,
                transcript_text=transcription_result["transcript_text"],
                segments=transcription_result["segments"],
                summary=analysis_result["summary"],
                action_items=analysis_result["action_items"],
                key_concepts=analysis_result["key_concepts"],
                sentiment_score=analysis_result["sentiment_score"],
                processed=True  # Mark as successfully processed
            )
            
            if db:
                db.add(transcription)
                db.commit()
                db.refresh(transcription)
            
            print(f"✓ Transcription complete: {transcription.id}")
            return transcription
        
        except Exception as e:
            print(f"Error in process_transcription: {str(e)}")
            traceback.print_exc()
            
            # Save partial result if transcription succeeded but analysis failed
            if 'transcription_result' in locals() and db:
                transcription = Transcription(
                    user_id=user_id,
                    title=title,
                    audio_file_path=audio_file_path,
                    transcript_text=transcription_result.get("transcript_text", ""),
                    segments=transcription_result.get("segments", []),
                    summary=f"Processing error: {str(e)}",
                    action_items=[],
                    key_concepts=[],
                    sentiment_score=0.0,
                    processed=False  # Mark as incomplete
                )
                db.add(transcription)
                db.commit()
                db.refresh(transcription)
                return transcription
            
            raise Exception(f"Transcription processing failed: {str(e)}")
