from typing import List, Dict

from sqlalchemy.orm import Session
from app.models.models import FormSubmission, User
from app.services.rag_service import rag_service  # Reuse RAG for embeddings/LLM access if needed, or direct OpenAI
import json
from openai import OpenAI, AsyncOpenAI, AzureOpenAI, AsyncAzureOpenAI
from app.core.config import settings
import os

class FormService:
    def __init__(self):
        """Initialize OpenAI or Azure OpenAI clients based on MODEL_PROVIDER."""
        provider = settings.MODEL_PROVIDER
        
        if provider == "azure_openai":
            azure_key = settings.AZURE_OPENAI_API_KEY
            azure_endpoint = settings.AZURE_OPENAI_ENDPOINT
            azure_version = settings.AZURE_OPENAI_API_VERSION
            
            if not azure_key or not azure_endpoint:
                raise ValueError("Azure OpenAI configuration incomplete. Please set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT in .env")
            
            self.openai_client = AzureOpenAI(
                api_key=azure_key,
                azure_endpoint=azure_endpoint,
                api_version=azure_version
            )
            self.async_client = AsyncAzureOpenAI(
                api_key=azure_key,
                azure_endpoint=azure_endpoint,
                api_version=azure_version
            )
            print(f"Forms: Using Azure OpenAI at {azure_endpoint}")
        
        elif provider == "openrouter":
            or_key = os.getenv("OPENROUTER_API_KEY")
            if not or_key:
                or_key = os.getenv("OPENAI_API_KEY")  # Fallback
            
            self.openai_client = OpenAI(
                api_key=or_key,
                base_url="https://openrouter.ai/api/v1"
            )
            self.async_client = AsyncOpenAI(
                api_key=or_key,
                base_url="https://openrouter.ai/api/v1"
            )
            print("Forms: Using OpenRouter")
        
        else:  # Default to OpenAI
            openai_key = os.getenv("OPENAI_API_KEY")
            if not openai_key:
                print("WARNING: OPENAI_API_KEY not found")
            
            self.openai_client = OpenAI(api_key=openai_key)
            self.async_client = AsyncOpenAI(api_key=openai_key)
            print("Forms: Using OpenAI")
    async def autofill_form(self, form_id: str, fields: List[Dict], user_id: str, db: Session) -> Dict[str, str]:
        """
        Uses AI to intelligently fill form fields based on user profile and past context.
        """
        # 1. Fetch User Context
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {}

        user_context = f"""
        User Profile:
        Name: {user.full_name}
        Email: {user.email}
        Disability Type: {user.disability_type or 'None'}
        """

        # 2. Construct Prompt for GPT-4
        field_descriptions = "\n".join([f"- {f.get('id')}: {f.get('label')} ({f.get('type')})" for f in fields])
        
        system_prompt = f"""
        You are an intelligent form-filling assistant for an accessibility platform.
        Your goal is to populate a form for the user based on their known profile and context.
        
        USER CONTEXT:
        {user_context}

        FORM FIELDS TO FILL:
        {field_descriptions}

        INSTRUCTIONS:
        - Return a JSON object where keys are the field IDs and values are the inferred answers.
        - If you don't know the answer, leave the value empty.
        - Invent plausible, realistic values for 'Department', 'Manager', or 'Project' if they are standard corporate fields, to save the user time.
        - Date format should be YYYY-MM-DD.
        """

        ai_data = {}

        try:
            model_name = os.getenv("LLM_MODEL", "gpt-3.5-turbo")  # Default to cheaper model
            response = self.openai_client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": "Please autofill this form for me."}
                ],
                response_format={ "type": "json_object" },
                max_tokens=1000 # Limit output
            )
            
            content = response.choices[0].message.content
            ai_data = json.loads(content)
        except Exception as e:
            print(f"Error extracting form data (AI skipped): {e}")
            # Do NOT return empty here; fall through to heuristics
        
        # 3. Heuristic Overlay (Guarantee basic fields)
        # This now runs regardless of whether the AI call succeeded or failed.
        known_map = {
            'full_name': user.full_name,
            'name': user.full_name,
            'email': user.email,
            'employee_id': str(user.id)[:8].upper() # Mock ID format
        }
        
        for field in fields:
            fid = field.get('id')
            if fid in known_map and known_map[fid]:
                # Override/Ensure set
                ai_data[fid] = known_map[fid]

        return ai_data

    async def submit_form(self, form_id: str, data: Dict, user_id: str, db: Session):
        """
        Persists the form submission to the database.
        """
        submission = FormSubmission(
            user_id=user_id,
            form_name=form_id,  # Map form_id to form_name
            extracted_data=data,
            status="pending"
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
        
        return {
            "status": "success", 
            "message": "Form submitted successfully", 
            "reference_id": str(submission.id)
        }

    async def interactive_chat(self, form_id: str, fields: List[Dict], user_message: str, history: List[Dict] = []) -> Dict:
        """
        Process a chat message to fill the form conversationally.
        Returns updated field values and the next question.
        """
        # 1. Construct Context
        # Simplify fields for the LLM to save tokens
        field_context = []
        for f in fields:
            field_context.append({
                "id": f.get("id"),
                "label": f.get("label"),
                "current_value": f.get("value"),
                "required": f.get("required"),
                "type": f.get("type"),
                "options": f.get("options")
            })

        system_prompt = f"""
        You are a helpful, professional administrative assistant helping a user fill out a form.
        
        FORM STRUCTURE:
        {json.dumps(field_context, indent=2)}

        YOUR GOAL:
        1. Analyze the USER'S MESSAGE.
        2. EXTRACT any information that matches the form fields.
           - Be robust: If user says "it's for marketing", map it to "Department: Marketing".
           - Formatting: Convert dates to YYYY-MM-DD.
        3. IDENTIFY the next empty 'required' field.
        4. GENERATE the next question to ask the user.
           - Be conversational but concise.
           - If all required fields are filled, say: "I have gathered all the necessary information. You can now close this chat, review your details in the form, and click Submit."

        OUTPUT FORMAT (JSON):
        {{
            "extracted_updates": {{ "field_id": "value" }},
            "next_question": "The question string"
        }}
        """

        messages = [{"role": "system", "content": system_prompt}]
        
        # Add limited history context (last 2 turns)
        params = history[-4:] if history else []
        for msg in params:
             messages.append({"role": msg.get("role"), "content": msg.get("content")})

        messages.append({"role": "user", "content": user_message})

        try:
            # Using stable sync client
            model_name = os.getenv("LLM_MODEL", "gpt-3.5-turbo")
            response = self.openai_client.chat.completions.create(
                model=model_name,
                messages=messages,
                response_format={ "type": "json_object" },
                max_tokens=500  # Restrict output to save credits (User has ~500 left)
            )
            
            content = response.choices[0].message.content
            return json.loads(content)

        except Exception as e:
            import traceback
            traceback.print_exc()
            # Fallback - Return error for debug
            return {
                "extracted_updates": {},
                "next_question": f"Error: {str(e)}" 
            }

form_service = FormService()
