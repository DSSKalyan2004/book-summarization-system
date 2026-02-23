from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from bson import ObjectId
from pathlib import Path
import os
from typing import Optional

from models.book import BookResponse
from models.raw_text import RawText
from utils.auth import get_current_user
from utils.file_extractor import extract_text_from_file

router = APIRouter()

# Configure upload directory
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

def get_database():
    from main import database
    return database

@router.post("/upload", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def upload_book(
    file: UploadFile = File(...),
    title: str = Form(...),
    author: str = Form(...),
    genre: Optional[str] = Form(None),
    publication_year: Optional[int] = Form(None),
    pages: Optional[int] = Form(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Upload book file and extract text"""
    file_path = None
    try:
        # Validate file extension
        file_extension = Path(file.filename).suffix.lower()
        allowed_extensions = ['.pdf', '.docx', '.txt']
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {', '.join(allowed_extensions)} files are allowed"
            )
        
        # Validate required fields
        if not title or not author:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Title and author are required"
            )
        
        # Save uploaded file
        unique_filename = f"{int(datetime.utcnow().timestamp() * 1000)}-{file.filename}"
        file_path = UPLOAD_DIR / unique_filename
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        print(f"📄 Processing uploaded file: {file.filename}")
        
        # Extract text from file
        extracted_text = await extract_text_from_file(str(file_path), file_extension)
        
        # Create book record
        book_dict = {
            "title": title,
            "author": author,
            "uploaded_by": current_user.get("userId"),
            "upload_date": datetime.utcnow(),
            "genre": genre,
            "publication_year": publication_year,
            "pages": pages,
            "original_filename": file.filename,
            "file_size": len(content),
            "file_type": file_extension.replace('.', ''),
            "is_processed": True,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = await db.books.insert_one(book_dict)
        book_id = str(result.inserted_id)
        
        # Calculate word count
        word_count = len(extracted_text.split())
        
        # Create raw text record
        raw_text_dict = {
            "book_id": book_id,
            "full_text": extracted_text,
            "word_count": word_count,
            "extraction_method": file_extension.replace('.', ''),
            "extraction_date": datetime.utcnow(),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        await db.raw_texts.insert_one(raw_text_dict)
        
        # Clean up the uploaded file
        try:
            os.unlink(file_path)
            print(f"🗑️ Cleaned up temporary file: {unique_filename}")
        except Exception as cleanup_error:
            print(f"Warning: Failed to delete temporary file: {cleanup_error}")
        
        return BookResponse(
            id=book_id,
            title=title,
            author=author,
            upload_date=book_dict["upload_date"],
            file_size=len(content),
            word_count=word_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up file on error
        if file_path and os.path.exists(file_path):
            try:
                os.unlink(file_path)
            except:
                pass
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Book upload failed: {str(e)}"
        )

@router.get("/")
async def get_all_books(
    search: Optional[str] = None,
    sort: str = "-upload_date",
    limit: int = 50,
    page: int = 1,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all books"""
    try:
        query = {}
        
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"author": {"$regex": search, "$options": "i"}}
            ]
        
        # Parse sort parameter
        sort_field = sort.lstrip('-')
        sort_direction = -1 if sort.startswith('-') else 1
        
        skip = (page - 1) * limit
        
        books_cursor = db.books.find(query).sort(sort_field, sort_direction).skip(skip).limit(limit)
        books = await books_cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for book in books:
            book["id"] = str(book["_id"])
            book["_id"] = str(book["_id"])
            if "uploaded_by" in book:
                book["uploaded_by"] = str(book["uploaded_by"])
        
        total = await db.books.count_documents(query)
        
        return {
            "books": books,
            "pagination": {
                "total": total,
                "page": page,
                "limit": limit,
                "pages": (total + limit - 1) // limit
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch books: {str(e)}"
        )

@router.get("/my-books")
async def get_my_books(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get books uploaded by current user"""
    try:
        books_cursor = db.books.find({"uploaded_by": current_user.get("userId")}).sort("upload_date", -1)
        books = await books_cursor.to_list(length=1000)
        
        for book in books:
            book["id"] = str(book["_id"])
            book["_id"] = str(book["_id"])
            if "uploaded_by" in book:
                book["uploaded_by"] = str(book["uploaded_by"])
        
        return {
            "count": len(books),
            "books": books
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch your books: {str(e)}"
        )

@router.get("/{book_id}")
async def get_book_by_id(
    book_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get single book with details"""
    try:
        if not ObjectId.is_valid(book_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid book ID"
            )
        
        book = await db.books.find_one({"_id": ObjectId(book_id)})
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Book not found"
            )
        
        book["id"] = str(book["_id"])
        book["_id"] = str(book["_id"])
        if "uploaded_by" in book:
            book["uploaded_by"] = str(book["uploaded_by"])
        
        return book
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch book: {str(e)}"
        )

@router.get("/{book_id}/text")
async def get_book_text(
    book_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get raw text for a book"""
    try:
        if not ObjectId.is_valid(book_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid book ID"
            )
        
        raw_text = await db.raw_texts.find_one({"book_id": book_id})
        if not raw_text:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Book text not found"
            )
        
        raw_text["id"] = str(raw_text["_id"])
        raw_text["_id"] = str(raw_text["_id"])
        
        return raw_text
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch book text: {str(e)}"
        )

@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(
    book_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a book"""
    try:
        if not ObjectId.is_valid(book_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid book ID"
            )
        
        book = await db.books.find_one({"_id": ObjectId(book_id)})
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Book not found"
            )
        
        # Check if user owns the book or is admin
        if str(book["uploaded_by"]) != current_user.get("userId") and current_user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this book"
            )
        
        # Delete book, raw text, and summaries
        await db.books.delete_one({"_id": ObjectId(book_id)})
        await db.raw_texts.delete_many({"book_id": book_id})
        await db.summaries.delete_many({"book_id": book_id})
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete book: {str(e)}"
        )
