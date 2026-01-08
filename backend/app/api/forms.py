from fastapi import APIRouter, Body
from typing import Dict
from app.services.form_service import form_service

router = APIRouter()

@router.post("/autofill", response_model=Dict[str, str])
async def autofill_form(context: str = Body(..., embed=True)):
    return await form_service.autofill_form(context)

@router.post("/submit")
async def submit_form(data: Dict[str, str]):
    return await form_service.submit_form(data)
