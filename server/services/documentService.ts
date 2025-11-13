import * as pdf from "pdf-parse";
import mammoth from "mammoth";
import { Buffer } from "buffer";
import { analyzeImage } from "./geminiService";

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface DocumentProcessingResult {
  fileName: string;
  fileType: string;
  mimeType: string;
  extractedText: string;
  textChunks: string[];
  byteSize: number;
}

const MAX_CHUNK_SIZE = 3000; // Characters per chunk
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Magic bytes for file type verification
const MAGIC_BYTES = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  docx: [0x50, 0x4B, 0x03, 0x04], // PK (ZIP format)
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG signature
  txt: null, // Plain text has no magic bytes
  md: null, // Markdown has no magic bytes
};

// Allowed MIME types (DOCX only, not legacy DOC)
const ALLOWED_MIMES = {
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  png: ["image/png"],
  txt: ["text/plain"],
  md: ["text/markdown", "text/plain"],
};

/**
 * Verify file content matches expected type using magic bytes
 */
function verifyFileSignature(buffer: Buffer, fileType: string): boolean {
  const magicBytes = MAGIC_BYTES[fileType as keyof typeof MAGIC_BYTES];
  
  // Plain text and markdown don't have magic bytes
  if (!magicBytes) {
    return true;
  }

  // Check if buffer starts with expected magic bytes
  for (let i = 0; i < magicBytes.length; i++) {
    if (buffer[i] !== magicBytes[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Validate MIME type matches file type
 */
function validateMimeType(mimeType: string, fileType: string): boolean {
  const allowedMimes = ALLOWED_MIMES[fileType as keyof typeof ALLOWED_MIMES];
  return allowedMimes && allowedMimes.includes(mimeType);
}

/**
 * Extract text from PDF file
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // @ts-expect-error - pdf-parse types are incomplete
    const data = await pdf(buffer);
    return data.text || "";
  } catch (error: any) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extract text from DOCX file
 */
async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error: any) {
    console.error("DOCX extraction error:", error);
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
}

/**
 * Extract text from plain text file (TXT, MD, etc.)
 */
function extractTextFromPlainText(buffer: Buffer): string {
  try {
    return buffer.toString("utf-8");
  } catch (error: any) {
    console.error("Text extraction error:", error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

/**
 * Extract text/description from PNG image using Gemini AI
 */
async function extractTextFromPng(buffer: Buffer): Promise<string> {
  try {
    // Convert buffer to base64
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64Data}`;
    
    // Use Gemini to analyze the image
    const result = await analyzeImage(
      dataUrl,
      "Extract and describe all text, information, and visual content from this image. If there is any text in the image, transcribe it exactly. Also describe what you see in the image including objects, people, colors, and layout."
    );
    
    return result.analysis || "";
  } catch (error: any) {
    console.error("PNG analysis error:", error);
    throw new Error(`Failed to analyze PNG image: ${error.message}`);
  }
}

/**
 * Chunk text into smaller segments for better context management
 */
function chunkText(text: string, maxChunkSize: number = MAX_CHUNK_SIZE): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      // If a single paragraph is too large, split it further
      if (paragraph.length > maxChunkSize) {
        const sentences = paragraph.split(/\. +/);
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length > maxChunkSize) {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = sentence + ". ";
          } else {
            currentChunk += sentence + ". ";
          }
        }
      } else {
        currentChunk = paragraph + "\n\n";
      }
    } else {
      currentChunk += paragraph + "\n\n";
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Determine file type from filename and MIME type
 * Falls back to MIME type if extension is missing or unknown
 */
function getFileType(filename: string, mimeType: string): string {
  const extension = filename.split(".").pop()?.toLowerCase() || "";
  
  const extensionMap: Record<string, string> = {
    pdf: "pdf",
    docx: "docx",
    png: "png",
    txt: "txt",
    md: "md",
    markdown: "md",
  };

  // Try extension first
  if (extensionMap[extension]) {
    return extensionMap[extension];
  }

  // Fall back to MIME type
  const mimeMap: Record<string, string> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "image/png": "png",
    "text/plain": "txt",
    "text/markdown": "md",
  };

  return mimeMap[mimeType] || "unknown";
}

/**
 * Process uploaded document and extract text
 */
export async function processDocument(
  file: MulterFile
): Promise<DocumentProcessingResult> {
  const { originalname, mimetype, buffer, size } = file;

  // Validate file size
  if (size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const fileType = getFileType(originalname, mimetype);
  
  if (fileType === "unknown") {
    throw new Error(`Unsupported file type. Supported formats: PDF, DOCX, PNG, TXT, MD`);
  }
  
  // Validate MIME type matches determined file type
  if (!validateMimeType(mimetype, fileType)) {
    throw new Error(`Invalid MIME type ${mimetype} for file type ${fileType}`);
  }

  // Verify file signature (magic bytes)
  if (!verifyFileSignature(buffer, fileType)) {
    throw new Error(`File content does not match declared type: ${fileType}`);
  }

  let extractedText = "";

  // Extract text based on file type
  switch (fileType) {
    case "pdf":
      extractedText = await extractTextFromPdf(buffer);
      break;
    case "docx":
      extractedText = await extractTextFromDocx(buffer);
      break;
    case "png":
      extractedText = await extractTextFromPng(buffer);
      break;
    case "txt":
    case "md":
      extractedText = extractTextFromPlainText(buffer);
      break;
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }

  // Validate extracted text
  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error("No text content could be extracted from the document");
  }

  // Chunk the text for better context management
  const textChunks = chunkText(extractedText);

  return {
    fileName: originalname,
    fileType,
    mimeType: mimetype,
    extractedText,
    textChunks,
    byteSize: size,
  };
}

/**
 * Get a summary of text chunks for display purposes
 */
export function getTextPreview(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + "...";
}
