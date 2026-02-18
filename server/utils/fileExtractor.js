const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;

/**
 * Clean extracted text by removing unwanted symbols and formatting
 */
function cleanExtractedText(text) {
  let cleaned = text;
  
  // Remove common document artifacts
  cleaned = cleaned
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/www\.[^\s]+/gi, '')
    // Remove email addresses
    .replace(/[\w.-]+@[\w.-]+\.\w+/gi, '')
    // Remove special characters and symbols (keep basic punctuation)
    .replace(/[^\w\s.,!?;:()\-'"—–]/g, ' ')
    // Remove extra bullets and list markers
    .replace(/^[\s]*[•▪▫■□●○◆◇★☆►▸]+[\s]*/gm, '')
    .replace(/^[\s]*[\u2022\u2023\u25E6\u2043\u2219]+[\s]*/gm, '')
    // Remove page numbers and headers (numbers alone on a line)
    .replace(/^\s*\d+\s*$/gm, '')
    // Remove multiple dots/ellipsis
    .replace(/\.{2,}/g, '.')
    // Remove reference markers like [1], [2], etc.
    .replace(/\[\d+\]/g, '')
    .replace(/\(\d+\)/g, '')
    // Fix spacing around punctuation
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/([.,!?;:])\s*/g, '$1 ')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Remove multiple line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Remove spaces at start/end of lines
    .replace(/^[ \t]+|[ \t]+$/gm, '')
    .trim();
  
  // Ensure proper sentence spacing
  cleaned = cleaned.replace(/([.!?])\s*([A-Z])/g, '$1 $2');
  
  return cleaned;
}

/**
 * Extract text from uploaded files (PDF, DOCX, TXT)
 * @param {string} filePath - Path to the uploaded file
 * @param {string} fileExtension - File extension (pdf, docx, txt)
 * @returns {Promise<string>} Extracted text content
 */
async function extractTextFromFile(filePath, fileExtension) {
  try {
    const ext = fileExtension.toLowerCase().replace('.', '');

    let rawText;
    switch (ext) {
      case 'pdf':
        rawText = await extractFromPDF(filePath);
        break;
      
      case 'docx':
        rawText = await extractFromDOCX(filePath);
        break;
      
      case 'txt':
        rawText = await extractFromTXT(filePath);
        break;
      
      default:
        throw new Error(`Unsupported file format: ${fileExtension}. Supported formats: PDF, DOCX, TXT`);
    }
    
    // Clean the extracted text
    const cleanedText = cleanExtractedText(rawText);
    console.log(`🧹 Cleaned text: ${rawText.length} → ${cleanedText.length} characters`);
    
    return cleanedText;
  } catch (error) {
    console.error('File extraction error:', error);
    throw new Error(`Failed to extract text from file: ${error.message}`);
  }
}

/**
 * Extract text from PDF files
 */
async function extractFromPDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text content found in PDF file');
    }
    
    console.log(`✅ Extracted ${data.text.length} characters from PDF`);
    return data.text;
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

/**
 * Extract text from DOCX files
 */
async function extractFromDOCX(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('No text content found in DOCX file');
    }
    
    console.log(`✅ Extracted ${result.value.length} characters from DOCX`);
    return result.value;
  } catch (error) {
    throw new Error(`DOCX extraction failed: ${error.message}`);
  }
}

/**
 * Extract text from TXT files
 */
async function extractFromTXT(filePath) {
  try {
    const text = await fs.readFile(filePath, 'utf-8');
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in TXT file');
    }
    
    console.log(`✅ Extracted ${text.length} characters from TXT`);
    return text;
  } catch (error) {
    throw new Error(`TXT extraction failed: ${error.message}`);
  }
}

module.exports = {
  extractTextFromFile
};
