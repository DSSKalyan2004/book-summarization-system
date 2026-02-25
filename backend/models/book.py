from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from bson import ObjectId

class BookCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    author: str = Field(..., max_length=200)
    genre: Optional[str] = Field(None, max_length=100)
    publication_year: Optional[int] = None
    pages: Optional[int] = Field(None, ge=1)

    @validator('publication_year')
    def validate_year(cls, v):
        if v is not None:
            current_year = datetime.now().year
            if v < 1000 or v > current_year + 1:
                raise ValueError(f'Publication year must be between 1000 and {current_year + 1}')
        return v

class Book(BaseModel):
    id: Optional[str] = Field(alias="_id")
    title: str
    author: str
    uploaded_by: str
    upload_date: datetime
    genre: Optional[str] = None
    publication_year: Optional[int] = None
    pages: Optional[int] = None
    original_filename: Optional[str] = None
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    is_processed: bool = False
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}
        arbitrary_types_allowed = True

class BookResponse(BaseModel):
    id: str
    title: str
    author: str
    upload_date: datetime
    file_size: Optional[int] = None
    word_count: Optional[int] = None
