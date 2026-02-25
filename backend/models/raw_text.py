from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class RawTextCreate(BaseModel):
    book_id: str
    full_text: str
    extraction_method: str

class RawText(BaseModel):
    id: Optional[str] = Field(alias="_id")
    book_id: str
    full_text: str
    word_count: int = 0
    extraction_method: str
    extraction_date: datetime
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}
        arbitrary_types_allowed = True
