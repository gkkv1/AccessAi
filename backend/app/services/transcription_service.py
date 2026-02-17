"""
Transcription Service - Handles audio transcription and AI-powered analysis.

This service integrates with:
1. OpenAI Whisper API for high-quality speech-to-text transcription
2. OpenAI GPT models for intelligent analysis (summaries, action items, sentiment)
"""

import os
import traceback
import requests
import tempfile
from typing import Dict, List, Optional
from openai import OpenAI, AzureOpenAI
from sqlalchemy.orm import Session
from app.models.models import Transcription, User
from app.core.config import settings


class TranscriptionService:
    def __init__(self):
        """Initialize separate clients for Whisper and GPT with provider-based routing."""
        
        provider = settings.MODEL_PROVIDER
        
        # Whisper Client - Azure or OpenAI based on provider
        if provider == "azure_openai":
            # Use Azure Whisper
            azure_key = settings.AZURE_OPENAI_API_KEY
            azure_endpoint = settings.AZURE_OPENAI_ENDPOINT
            azure_version = settings.AZURE_OPENAI_API_VERSION
            
            if azure_key and azure_endpoint:
                self.whisper_client = AzureOpenAI(
                    api_key=azure_key,
                    azure_endpoint=azure_endpoint,
                    api_version=azure_version
                )
                print(f"Whisper: Using Azure OpenAI - {settings.AZURE_WHISPER_DEPLOYMENT}")
            else:
                self.whisper_client = None
                print("WARNING: Azure OpenAI configuration incomplete - Whisper transcription unavailable")
        else:
            # Use OpenAI Whisper
            openai_key = os.getenv("OPENAI_API_KEY")
            
            if openai_key and not openai_key.startswith("sk-or-"):
                self.whisper_client = OpenAI(api_key=openai_key)
                print("Whisper: Using OpenAI")
            else:
                self.whisper_client = None
                if openai_key and openai_key.startswith("sk-or-"):
                    print("WARNING: OpenRouter key detected - Whisper unavailable")
                else:
                    print("WARNING: OPENAI_API_KEY not found - Whisper unavailable")
        
        # GPT Client - Provider-based routing
        provider = settings.MODEL_PROVIDER
        
        if provider == "azure_openai":
            azure_key = settings.AZURE_OPENAI_API_KEY
            azure_endpoint = settings.AZURE_OPENAI_ENDPOINT
            azure_version = settings.AZURE_OPENAI_API_VERSION
            
            if not azure_key or not azure_endpoint:
                raise ValueError("Azure OpenAI configuration incomplete. Please set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT in .env")
            
            self.gpt_client = AzureOpenAI(
                api_key=azure_key,
                azure_endpoint=azure_endpoint,
                api_version=azure_version
            )
            print(f"GPT: Using Azure OpenAI at {azure_endpoint}")
        
        elif provider == "openrouter":
            or_key = os.getenv("OPENROUTER_API_KEY", openai_key)
            self.gpt_client = OpenAI(
                api_key=or_key,
                base_url="https://openrouter.ai/api/v1"
            )
            print("GPT: Using OpenRouter")
        
        else:  # Default to OpenAI
            self.gpt_client = OpenAI(api_key=openai_key)
            print("GPT: Using OpenAI")
    
    def _get_gpt_model_name(self) -> str:
        """Get the correct GPT model name based on provider."""
        if settings.MODEL_PROVIDER == "azure_openai":
            # For Azure, use the deployment name
            return settings.AZURE_OPENAI_DEPLOYMENT
        else:
            # For OpenAI/OpenRouter, use the model name from settings
            return settings.LLM_MODEL
    
    def transcribe_audio(self, audio_file_path: str) -> Dict:
        """
        Transcribe audio file using OpenAI Whisper API.
        
        Args:
            audio_file_path: Path to the audio file (MP3, WAV) or a URL.
        
        Returns:
            Dictionary containing:
            - transcript_text: Full text transcript
            - segments: List of timestamped segments with speaker info
        """
        temp_file_path = None
        try:
            # Check if Whisper client is available
            if not self.whisper_client:
                if settings.MODEL_PROVIDER == "azure_openai":
                    raise Exception(
                        "Azure Whisper transcription unavailable. "
                        "Please deploy the Whisper model in your Azure OpenAI resource first. "
                        "Go to Azure Portal → Your Azure OpenAI resource → Model deployments → Create deployment → Select 'whisper' model."
                    )
                else:
                    raise Exception("Whisper transcription unavailable. Please set a valid OpenAI API key in your .env file.")
            
            # Step 1: Download if it's a URL
            actual_path = audio_file_path
            if audio_file_path.startswith(("http://", "https://")):
                print(f"Downloading audio from URL: {audio_file_path}")
                
                # Ensure uploads directory exists
                uploads_dir = "uploads"
                os.makedirs(uploads_dir, exist_ok=True)
                
                # Check for YouTube URLs
                is_youtube = any(y in audio_file_path.lower() for y in ["youtube.com/", "youtu.be/", "youtube.com/shorts/"])
                
                if is_youtube:
                    print("YouTube link detected. Extracting audio stream...")
                    try:
                        import yt_dlp
                        import json
                        
                        # Generate a unique filename for the YouTube audio
                        import uuid
                        unique_id = str(uuid.uuid4())
                        outtmpl = os.path.join(uploads_dir, f"youtube_{unique_id}.%(ext)s")
                        
                        # Best audio format, constrained to sizes Whisper likes
                        ydl_opts = {
                            'format': 'bestaudio/best',
                            'noplaylist': True,
                            'quiet': True,
                            'no_warnings': True,
                            'outtmpl': outtmpl,
                        }
                        
                        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                            info = ydl.extract_info(audio_file_path, download=True)
                            final_filename = ydl.prepare_filename(info)
                            actual_path = final_filename
                            local_path = actual_path
                            print(f"YouTube audio downloaded to persistent path: {actual_path}")
                    except Exception as yt_err:
                        print(f"YouTube extraction failed: {str(yt_err)}")
                        raise Exception(f"Failed to extract audio from YouTube: {str(yt_err)}")
                
                else:
                    # Standard direct file download logic
                    response = requests.get(audio_file_path, stream=True, timeout=30)
                    if response.status_code != 200:
                        raise Exception(f"Failed to download audio from URL: {response.status_code}")
                    
                    # Determine extension from Content-Type or URL
                    content_type = response.headers.get("Content-Type", "").lower()
                    print(f"URL Content-Type: {content_type}")
                    
                    # Check for HTML content (common mistake if user pastes a UI URL)
                    if "text/html" in content_type:
                        raise Exception("The provided URL points to a web page (HTML), not a direct video or audio file. Please provide a direct link to the media file.")

                    # Map common content types to extensions
                    extension_map = {
                        "audio/mpeg": ".mp3",
                        "audio/mp3": ".mp3",
                        "audio/wav": ".wav",
                        "audio/x-wav": ".wav",
                        "audio/mp4": ".m4a",
                        "audio/x-m4a": ".m4a",
                        "audio/webm": ".webm",
                        "audio/ogg": ".ogg",
                        "video/mp4": ".mp4",
                        "video/mpeg": ".mpeg",
                        "video/webm": ".webm",
                        "application/octet-stream": None # Fallback to URL parsing
                    }
                    
                    ext = extension_map.get(content_type.split(';')[0])
                    
                    if not ext:
                        # Fallback to parsing the URL path
                        from urllib.parse import urlparse
                        path = urlparse(audio_file_path).path
                        ext = os.path.splitext(path)[1].lower()
                    
                    # Final default if still no extension
                    if not ext or len(ext) > 5:
                        ext = ".mp3"
                    
                    print(f"Detected extension: {ext}")
                    
                    import uuid
                    unique_id = str(uuid.uuid4())
                    final_filename = os.path.join(uploads_dir, f"download_{unique_id}{ext}")
                    
                    with open(final_filename, "wb") as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            if chunk:
                                f.write(chunk)
                    
                    actual_path = final_filename
                    local_path = actual_path
                    print(f"Media downloaded to persistent path: {actual_path}")

            print(f"Transcribing audio file: {actual_path}")
            
            with open(actual_path, "rb") as audio_file:
                # Use provider-specific model name
                if settings.MODEL_PROVIDER == "azure_openai":
                    model_name = settings.AZURE_WHISPER_DEPLOYMENT
                else:
                    model_name = "whisper-1"  # OpenAI Whisper model
                
                transcript = self.whisper_client.audio.transcriptions.create(
                    model=model_name,
                    file=audio_file,
                    response_format="verbose_json",  # Get detailed timestamps
                    timestamp_granularities=["segment"]  # Get segment-level timestamps
                )
            
            # Extract full text from verbose_json response
            full_text = transcript.text
            
            # Use Whisper's actual segments with REAL timestamps
            segments = []
            if hasattr(transcript, 'segments') and transcript.segments:
                print(f"Using {len(transcript.segments)} segments from Whisper with real timestamps")
                for i, seg in enumerate(transcript.segments):
                    # Handle both dict and object access
                    start = seg.get('start', 0) if isinstance(seg, dict) else getattr(seg, 'start', 0)
                    end = seg.get('end', 0) if isinstance(seg, dict) else getattr(seg, 'end', 0)
                    text = seg.get('text', '') if isinstance(seg, dict) else getattr(seg, 'text', '')
                    
                    segments.append({
                        "id": str(i),
                        "start": start,  # Real timestamp from Whisper
                        "end": end,      # Real timestamp from Whisper
                        "speaker": f"Speaker {(i % 3) + 1}",  # Will be updated by GPT analysis
                        "text": text.strip()
                    })
            else:
                # Fallback: Create simple segments from full text (shouldn't happen with verbose_json)
                print("WARNING: No segments in Whisper response, using fallback estimation")
                sentences = full_text.split('. ')
                current_time = 0.0
                
                for i, sentence in enumerate(sentences):
                    if sentence.strip():
                        word_count = len(sentence.split())
                        duration = max(2.0, word_count / 2.0)
                        
                        segments.append({
                            "id": str(i),
                            "start": current_time,
                            "end": current_time + duration,
                            "speaker": f"Speaker {(i % 3) + 1}",
                            "text": sentence.strip()
                        })
                        
                        current_time += duration
            
            print(f"Transcription complete: {len(full_text)} characters, {len(segments)} segments")
            
            return {
                "transcript_text": full_text,
                "segments": segments,
                "local_path": local_path
            }
        
        except Exception as e:
            print(f"Error in transcribe_audio: {str(e)}")
            traceback.print_exc()
            raise Exception(f"Transcription failed: {str(e)}")
        finally:
            # Cleanup temp file if created
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    print(f"Deleted temp file: {temp_file_path}")
                except:
                    pass
    
    def analyze_transcript(self, transcript_text: str, segments: List[Dict]) -> Dict:
        """
        Analyze transcript using GPT to extract insights, identify speakers, and detect emotions.
        
        Args:
            transcript_text: Full transcript text
            segments: List of timestamped segments
        
        Returns:
            Dictionary containing:
            - summary: Executive summary
            - action_items: List of action items with assignees
            - key_concepts: List of important topics discussed
            - sentiment_score: Overall sentiment (-1.0 to 1.0)
            - speakers: List of speaker info with emotions
            - segments: Updated segments with speaker and emotion tags
        """
        try:
            print("Analyzing transcript with GPT (speaker + emotion detection)...")
            
            # Format segments for analysis
            segments_text = "\n".join([
                f"[{seg.get('start', 0):.1f}s - {seg.get('end', 0):.1f}s]: {seg.get('text', '')}"
                for seg in segments
            ])
            
            # Comprehensive analysis prompt
            prompt = f"""Analyze this conversation transcript and provide:

1. **Speaker Identification**: Identify unique speakers and label them as "Speaker 1", "Speaker 2", etc.
2. **Emotion Detection**: For each segment, detect the speaker's emotion based on tone, word choice, and context.
3. **Summary**: Concise executive summary (2-3 sentences)
4. **Action Items**: Tasks mentioned with assignees (if any)
5. **Key Concepts**: Main topics discussed
6. **Overall Sentiment**: Score from -1.0 (very negative) to 1.0 (very positive)

Emotions to use: happy, sad, angry, neutral, excited, confused, frustrated, surprised, concerned, supportive

Return ONLY valid JSON in this exact format:
{{
    "summary": "...",
    "action_items": [{{"task": "...", "assignee": "...", "status": "pending"}}],
    "key_concepts": ["topic1", "topic2"],
    "sentiment_score": 0.5,
    "speakers": [
        {{
            "id": "Speaker 1",
            "dominant_emotion": "neutral",
            "segment_count": 5
        }}
    ],
    "segment_emotions": [
        {{
            "segment_id": 0,
            "speaker": "Speaker 1",
            "emotion": "happy"
        }}
    ]
}}

Transcript with timestamps:
{segments_text}

JSON Response:"""

            # Use the configured LLM model
            model_name = self._get_gpt_model_name()
            
            response = self.gpt_client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are an expert conversation analyst. Identify speakers, detect emotions, and extract insights from transcripts. Always return valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1500
            )
            
            # Extract and parse response
            analysis_text = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if analysis_text.startswith("```"):
                analysis_text = analysis_text.split("```")[1]
                if analysis_text.startswith("json"):
                    analysis_text = analysis_text[4:]
                analysis_text = analysis_text.strip()
            
            # Parse JSON
            import json
            try:
                analysis = json.loads(analysis_text)
            except Exception as parse_error:
                print(f"Warning: Could not parse GPT response as JSON: {parse_error}")
                print(f"Response: {analysis_text[:200]}...")
                analysis = {
                    "summary": analysis_text[:500] if len(analysis_text) > 0 else "Analysis failed",
                    "action_items": [],
                    "key_concepts": [],
                    "sentiment_score": 0.0,
                    "speakers": [],
                    "segment_emotions": []
                }
            
            # Update original segments with speaker and emotion data
            segment_emotions = analysis.get("segment_emotions", [])
            for i, seg in enumerate(segments):
                if i < len(segment_emotions):
                    emotion_data = segment_emotions[i]
                    seg["speaker"] = emotion_data.get("speaker", "Speaker 1")
                    seg["emotion"] = emotion_data.get("emotion", "neutral")
                else:
                    # Fallback if GPT didn't provide enough segment data
                    seg["speaker"] = "Speaker 1"
                    seg["emotion"] = "neutral"
            
            print(f"Analysis complete: {len(analysis.get('speakers', []))} speakers, {len(analysis.get('action_items', []))} action items")
            
            return {
                "summary": analysis.get("summary", ""),
                "action_items": analysis.get("action_items", []),
                "key_concepts": analysis.get("key_concepts", []),
                "sentiment_score": float(analysis.get("sentiment_score", 0.0)),
                "speakers": analysis.get("speakers", []),
                "segments": segments  # Return updated segments with speaker/emotion
            }
        
        except Exception as e:
            print(f"Error in analyze_transcript: {str(e)}")
            traceback.print_exc()
            # Return basic analysis with default speaker/emotion
            for seg in segments:
                if "speaker" not in seg:
                    seg["speaker"] = "Speaker 1"
                if "emotion" not in seg:
                    seg["emotion"] = "neutral"
            
            return {
                "summary": f"Analysis failed: {str(e)}",
                "action_items": [],
                "key_concepts": [],
                "sentiment_score": 0.0,
                "speakers": [{"id": "Speaker 1", "dominant_emotion": "neutral", "segment_count": len(segments)}],
                "segments": segments
            }
    
    def process_transcription(
        self, 
        user_id: str, 
        audio_file_path: str,
        title: Optional[str] = None,
        db: Session = None,
        transcription_id: Optional[str] = None  # NEW: Accept existing ID
    ) -> Transcription:
        """
        Full pipeline: transcribe audio → analyze → save to database.
        
        Args:
            user_id: UUID of the user
            audio_file_path: Path to uploaded audio file
            title: Optional custom title (defaults to filename)
            db: Database session
            transcription_id: Optional existing transcription ID to update
        
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
            
            # Step 3: Save to database (UPDATE existing or CREATE new)
            print(f"[3/3] Saving to database...")
            
            # Use segments from analysis (which include speaker and emotion data)
            enriched_segments = analysis_result.get("segments", transcription_result["segments"])
            
            if db and transcription_id:
                # UPDATE existing record
                transcription = db.query(Transcription).filter(
                    Transcription.id == transcription_id
                ).first()
                
                if transcription:
                    # Update existing record
                    transcription.transcript_text = transcription_result["transcript_text"]
                    transcription.segments = enriched_segments  # Use speaker-enriched segments
                    transcription.summary = analysis_result["summary"]
                    transcription.action_items = analysis_result["action_items"]
                    transcription.key_concepts = analysis_result["key_concepts"]
                    transcription.sentiment_score = analysis_result["sentiment_score"]
                    transcription.audio_file_path = transcription_result["local_path"]
                    transcription.processed = True
                    
                    db.commit()
                    db.refresh(transcription)
                    print(f"✓ Updated existing transcription: {transcription.id}")
                else:
                    # Fallback: ID not found, create new
                    print(f"WARNING: Transcription ID {transcription_id} not found, creating new record")
                    transcription = Transcription(
                        user_id=user_id,
                        title=title,
                        audio_file_path=transcription_result["local_path"],
                        transcript_text=transcription_result["transcript_text"],
                        segments=enriched_segments,
                        summary=analysis_result["summary"],
                        action_items=analysis_result["action_items"],
                        key_concepts=analysis_result["key_concepts"],
                        sentiment_score=analysis_result["sentiment_score"],
                        processed=True
                    )
                    db.add(transcription)
                    db.commit()
                    db.refresh(transcription)
            else:
                # CREATE new record (no ID provided)
                transcription = Transcription(
                    user_id=user_id,
                    title=title,
                    audio_file_path=transcription_result["local_path"],
                    transcript_text=transcription_result["transcript_text"],
                    segments=enriched_segments,
                    summary=analysis_result["summary"],
                    action_items=analysis_result["action_items"],
                    key_concepts=analysis_result["key_concepts"],
                    sentiment_score=analysis_result["sentiment_score"],
                    processed=True
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
