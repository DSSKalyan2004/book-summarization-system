from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from bson import ObjectId
from pathlib import Path
import os
from typing import Optional

from models.summary import SummaryCreate, SummaryResponse
from utils.auth import get_current_user, get_current_user_optional
from utils.file_extractor import extract_text_from_file

router = APIRouter()

# Configure upload directory
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

def get_database():
    from main import database
    if database is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB is not connected. Fallback disabled."
        )
    return database

@router.post("/upload")
async def upload_file_for_summary(
    file: UploadFile = File(...),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Upload file and extract text (no auth required for text extraction)"""
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
        
        # Save uploaded file temporarily
        unique_filename = f"{int(datetime.utcnow().timestamp() * 1000)}-{file.filename}"
        file_path = UPLOAD_DIR / unique_filename
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        print(f"📄 Processing uploaded file: {file.filename}")
        
        # Extract text from file
        extracted_text = await extract_text_from_file(str(file_path), file_extension)
        
        # Clean up the uploaded file
        try:
            os.unlink(file_path)
            print(f"🗑️ Cleaned up temporary file: {unique_filename}")
        except Exception as cleanup_error:
            print(f"Warning: Failed to delete temporary file: {cleanup_error}")
        
        return {
            "text": extracted_text,
            "filename": file.filename,
            "message": "File processed successfully"
        }
        
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
            detail=f"File processing failed: {str(e)}"
        )

@router.get("/")
async def get_all_summaries(
    summary_type: Optional[str] = None,
    limit: int = 50,
    page: int = 1,
    current_user: Optional[dict] = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all summaries"""
    try:
        query = {}
        
        if summary_type and summary_type in ['short', 'detailed']:
            query["summary_type"] = summary_type
        
        skip = (page - 1) * limit
        
        summaries_cursor = db.summaries.find(query).sort("generation_date", -1).skip(skip).limit(limit)
        summaries = await summaries_cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for summary in summaries:
            summary["id"] = str(summary["_id"])
            summary["_id"] = str(summary["_id"])
            if "book_id" in summary:
                summary["book_id"] = str(summary["book_id"])
            if "generated_by" in summary:
                summary["generated_by"] = str(summary["generated_by"])
        
        total = await db.summaries.count_documents(query)
        
        return {
            "summaries": summaries,
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
            detail=f"Failed to fetch summaries: {str(e)}"
        )

# ─── User History Endpoints (permanent, per-user, DB-backed) ───────────────

@router.get("/my/all")
async def get_my_history(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all saved summaries for the current authenticated user"""
    user_id = current_user.get("userId") or current_user.get("email")
    try:
        cursor = db.user_histories.find({"userId": user_id}).sort("timestamp", -1)
        items = await cursor.to_list(length=1000)
        for item in items:
            item["id"] = str(item["_id"])
            @router.post("/upload")
            async def upload_file_for_summary(
                file: UploadFile = File(...),
                current_user: Optional[dict] = Depends(get_current_user_optional),
                db: AsyncIOMotorDatabase = Depends(get_database)
            ):
                """Upload file and extract text, saving per-user upload info"""
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

                    # Save uploaded file temporarily
                    unique_filename = f"{int(datetime.utcnow().timestamp() * 1000)}-{file.filename}"
                    file_path = UPLOAD_DIR / unique_filename

                    with open(file_path, "wb") as f:
                        content = await file.read()
                        f.write(content)

                    print(f"\ud83d\udcc4 Processing uploaded file: {file.filename}")

                    # Extract text from file
                    extracted_text = await extract_text_from_file(str(file_path), file_extension)

                    # Save upload info to user_histories if user is authenticated
                    upload_record = None
                    if current_user and (current_user.get("userId") or current_user.get("email")):
                        user_id = current_user.get("userId") or current_user.get("email")
                        doc = {
                            "userId": user_id,
                            "filename": file.filename,
                            "file_type": file_extension.replace('.', ''),
                            "file_size": len(content),
                            "extracted_text": extracted_text,
                            "uploadedAt": datetime.utcnow(),
                            "savedAt": datetime.utcnow(),
                        }
                        result = await db.user_histories.insert_one(doc)
                        upload_record = str(result.inserted_id)

                    # Clean up the uploaded file
                    try:
                        os.unlink(file_path)
                        print(f"\ud83d\udd91\ufe0f Cleaned up temporary file: {unique_filename}")
                    except Exception as cleanup_error:
                        print(f"Warning: Failed to delete temporary file: {cleanup_error}")

                    return {
                        "text": extracted_text,
                        "filename": file.filename,
                        "message": "File processed successfully",
                        "upload_id": upload_record
                    }

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
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid summary ID"
            )
        
        summary = await db.summaries.find_one({"_id": ObjectId(summary_id)})
        if not summary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Summary not found"
            )
        
        summary["id"] = str(summary["_id"])
        summary["_id"] = str(summary["_id"])
        if "book_id" in summary:
            summary["book_id"] = str(summary["book_id"])
        if "generated_by" in summary:
            summary["generated_by"] = str(summary["generated_by"])
        
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch summary: {str(e)}"
        )

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_summary(
    summary_data: SummaryCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create new summary"""
    try:
        # Check if book exists (if book_id is a valid ObjectId)
        if ObjectId.is_valid(summary_data.book_id):
            book = await db.books.find_one({"_id": ObjectId(summary_data.book_id)})
            if not book:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Book not found"
                )
        
        # Calculate word count
        word_count = len(summary_data.summary_text.split())
        
        # Create summary
        summary_dict = {
            "book_id": summary_data.book_id,
            "summary_text": summary_data.summary_text,
            "summary_type": summary_data.summary_type,
            "key_insights": summary_data.key_insights or [],
            "word_count": word_count,
            "generated_by": current_user.get("userId"),
            "generation_date": datetime.utcnow(),
            "ai_model": summary_data.ai_model or "bert",
            "language": summary_data.language or "en",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = await db.summaries.insert_one(summary_dict)
        summary_id = str(result.inserted_id)
        
        # Fetch the created summary
        created_summary = await db.summaries.find_one({"_id": result.inserted_id})
        created_summary["id"] = str(created_summary["_id"])
        created_summary["_id"] = str(created_summary["_id"])
        if "book_id" in created_summary:
            created_summary["book_id"] = str(created_summary["book_id"])
        if "generated_by" in created_summary:
            created_summary["generated_by"] = str(created_summary["generated_by"])
        
        return {
            "message": "Summary created successfully",
            "summary": created_summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create summary: {str(e)}"
        )

@router.put("/{summary_id}")
async def update_summary(
    summary_id: str,
    summary_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update a summary"""
    try:
        if not ObjectId.is_valid(summary_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid summary ID"
            )
        
        summary = await db.summaries.find_one({"_id": ObjectId(summary_id)})
        if not summary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Summary not found"
            )
        
        # Check if user owns the summary or is admin
        if str(summary.get("generated_by")) != current_user.get("userId") and current_user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this summary"
            )
        
        # Update word count if summary_text is being updated
        if "summary_text" in summary_data:
            summary_data["word_count"] = len(summary_data["summary_text"].split())
        
        summary_data["updatedAt"] = datetime.utcnow()
        
        await db.summaries.update_one(
            {"_id": ObjectId(summary_id)},
            {"$set": summary_data}
        )
        
        # Fetch updated summary
        updated_summary = await db.summaries.find_one({"_id": ObjectId(summary_id)})
        updated_summary["id"] = str(updated_summary["_id"])
        updated_summary["_id"] = str(updated_summary["_id"])
        if "book_id" in updated_summary:
            updated_summary["book_id"] = str(updated_summary["book_id"])
        if "generated_by" in updated_summary:
            updated_summary["generated_by"] = str(updated_summary["generated_by"])
        
        return updated_summary
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update summary: {str(e)}"
        )

@router.delete("/{summary_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_summary(
    summary_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a summary"""
    try:
        if not ObjectId.is_valid(summary_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid summary ID"
            )
        
        summary = await db.summaries.find_one({"_id": ObjectId(summary_id)})
        if not summary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Summary not found"
            )
        
        # Check if user owns the summary or is admin
        if str(summary.get("generated_by")) != current_user.get("userId") and current_user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this summary"
            )
        
        await db.summaries.delete_one({"_id": ObjectId(summary_id)})
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete summary: {str(e)}"
        )

@router.get("/book/{book_id}")
async def get_summaries_by_book(
    book_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all summaries for a specific book"""
    try:
        summaries_cursor = db.summaries.find({"book_id": book_id}).sort("generation_date", -1)
        summaries = await summaries_cursor.to_list(length=100)
        
        for summary in summaries:
            summary["id"] = str(summary["_id"])
            summary["_id"] = str(summary["_id"])
            if "book_id" in summary:
                summary["book_id"] = str(summary["book_id"])
            if "generated_by" in summary:
                summary["generated_by"] = str(summary["generated_by"])
        
        return {
            "count": len(summaries),
            "summaries": summaries
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch summaries: {str(e)}"
        )
