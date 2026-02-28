import PyPDF2
from docx import Document
import re
from pathlib import Path

def clean_extracted_text(text: str) -> str:
    """Clean extracted text by removing unwanted symbols and formatting"""
    cleaned = text
    
    # Remove URLs
    cleaned = re.sub(r'https?://[^\s]+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'www\.[^\s]+', '', cleaned, flags=re.IGNORECASE)
    
    # Remove email addresses
    cleaned = re.sub(r'[\w.-]+@[\w.-]+\.\w+', '', cleaned, flags=re.IGNORECASE)
    
    # Remove special characters and symbols (keep basic punctuation)
    cleaned = re.sub(r'[^\w\s.,!?;:()\-\'"—–]', ' ', cleaned)
    
    # Remove bullets and list markers
    cleaned = re.sub(r'^[\s]*[•▪▫■□●○◆◇★☆►▸]+[\s]*', '', cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r'^[\s]*[\u2022\u2023\u25E6\u2043\u2219]+[\s]*', '', cleaned, flags=re.MULTILINE)
    
    # Remove page numbers (numbers alone on a line)
    cleaned = re.sub(r'^\s*\d+\s*$', '', cleaned, flags=re.MULTILINE)
    
    # Remove multiple dots/ellipsis
    cleaned = re.sub(r'\.{2,}', '.', cleaned)
    
    # Remove reference markers like [1], [2], etc.
    cleaned = re.sub(r'\[\d+\]', '', cleaned)
    cleaned = re.sub(r'\(\d+\)', '', cleaned)
    
    # Fix spacing around punctuation
    cleaned = re.sub(r'\s+([.,!?;:])', r'\1', cleaned)
    cleaned = re.sub(r'([.,!?;:])\s*', r'\1 ', cleaned)
    
    # Remove multiple spaces
    cleaned = re.sub(r'\s+', ' ', cleaned)
    
    # Remove multiple line breaks
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    
    # Remove spaces at start/end of lines
    cleaned = re.sub(r'^[ \t]+|[ \t]+$', '', cleaned, flags=re.MULTILINE)
    
    # Ensure proper sentence spacing
    cleaned = re.sub(r'([.!?])\s*([A-Z])', r'\1 \2', cleaned)
    
    return cleaned.strip()

async def extract_text_from_file(file_path: str, file_extension: str) -> str:
    """
    Extract text from uploaded files (PDF, DOCX, TXT)
    
    Args:
        file_path: Path to the uploaded file
        file_extension: File extension (pdf, docx, txt)
    
    Returns:
        Extracted and cleaned text content
    """
    ext = file_extension.lower().replace('.', '')
    
    if ext == 'pdf':
        raw_text = await extract_from_pdf(file_path)
    elif ext == 'docx':
        raw_text = await extract_from_docx(file_path)
    elif ext == 'txt':
        raw_text = await extract_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file format: {file_extension}. Supported formats: PDF, DOCX, TXT")
    
    # Clean the extracted text
    cleaned_text = clean_extracted_text(raw_text)
    print(f"🧹 Cleaned text: {len(raw_text)} → {len(cleaned_text)} characters")
    
    return cleaned_text

async def extract_from_pdf(file_path: str) -> str:
    """Extract text from PDF files"""
    try:
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        
        if not text or text.strip() == "":
            raise ValueError("No text content found in PDF file")
        
        print(f"✅ Extracted {len(text)} characters from PDF")
        return text
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")

async def extract_from_docx(file_path: str) -> str:
    """Extract text from DOCX files"""
    try:
        doc = Document(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        
        if not text or text.strip() == "":
            raise ValueError("No text content found in DOCX file")
        
        print(f"✅ Extracted {len(text)} characters from DOCX")
        return text
    except Exception as e:
        raise ValueError(f"Failed to extract text from DOCX: {str(e)}")

async def extract_from_txt(file_path: str) -> str:
    """Extract text from TXT files"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            text = file.read()
        
        if not text or text.strip() == "":
            # Try different encodings
            try:
                with open(file_path, 'r', encoding='latin-1') as file:
                    text = file.read()
            except:
                raise ValueError("No text content found in TXT file")
        
        print(f"✅ Extracted {len(text)} characters from TXT")
        return text
    except Exception as e:
        raise ValueError(f"Failed to extract text from TXT: {str(e)}")
