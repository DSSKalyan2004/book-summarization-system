from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
import re

class SummaryCreate(BaseModel):
    book_id: str
    summary_text: str = Field(..., min_length=10)
    summary_type: str
    key_insights: Optional[List[str]] = []
    ai_model: Optional[str] = "bert"
    language: Optional[str] = "en"
    
    @validator('summary_type')
    def validate_summary_type(cls, v):
        if not re.match(r'^(short|detailed)$', v):
            raise ValueError('summary_type must be either "short" or "detailed"')
        return v

class Summary(BaseModel):
    id: Optional[str] = Field(alias="_id")
    book_id: str
    summary_text: str
    summary_type: str
    key_insights: List[str] = []
    word_count: int = 0
    generated_by: Optional[str] = None
    generation_date: datetime
    ai_model: str = "bert"
    language: str = "en"
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}
        arbitrary_types_allowed = True

class SummaryResponse(BaseModel):
    message: str
    summary: dict
