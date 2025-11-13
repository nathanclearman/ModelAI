import * as pdf from "pdf-parse";
import mammoth from "mammoth";
import { Buffer } from "buffer";

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
 * Determine file type from filename
 */
function getFileType(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase() || "";
  
  const typeMap: Record<string, string> = {
    pdf: "pdf",
    docx: "docx",
    doc: "docx",
    txt: "txt",
    md: "md",
    markdown: "md",
  };

  return typeMap[extension] || "unknown";
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

  const fileType = getFileType(originalname);
  let extractedText = "";

  // Extract text based on file type
  switch (fileType) {
    case "pdf":
      extractedText = await extractTextFromPdf(buffer);
      break;
    case "docx":
      extractedText = await extractTextFromDocx(buffer);
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
