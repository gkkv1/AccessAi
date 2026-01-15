from typing import List, Dict

from sqlalchemy.orm import Session
from app.models.models import FormSubmission, User
from app.services.rag_service import rag_service  # Reuse RAG for embeddings/LLM access if needed, or direct OpenAI
import json
from openai import AsyncOpenAI
import os

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class FormService:
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
            response = await client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": "Please autofill this form for me."}
                ],
                response_format={ "type": "json_object" }
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

form_service = FormService()
