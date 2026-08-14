"""File ingestion service - extracts text from various file types.

Supports: PDF, images (OCR), text/transcripts, DOCX, and URL scraping.
"""

import asyncio
import logging
import re
from pathlib import Path

import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from docx import Document
from bs4 import BeautifulSoup
import httpx

from app.constants import InputType

logger = logging.getLogger(__name__)


async def extract_text(file_path: str, input_type: InputType) -> str:
    """Extract text from a file based on its type.

    Args:
        file_path: Path to the file on disk.
        input_type: The classified type of the input.

    Returns:
        Extracted plain text content.
    """
    extractors: dict[InputType, callable] = {
        InputType.PDF: _extract_pdf,
        InputType.IMAGE: _extract_image_ocr,
        InputType.TRANSCRIPT: _extract_text_file,
        InputType.CHAT: _extract_text_file,
        InputType.DOCX: _extract_docx,
    }

    extractor = extractors.get(input_type)
    if extractor is None:
        logger.warning(f"No extractor for input type: {input_type}")
        return ""

    try:
        return await asyncio.to_thread(extractor, file_path)
    except Exception as e:
        logger.error(f"Error extracting text from {file_path} (type={input_type}): {e}")
        return f"[Extraction error: {e}]"


async def extract_url(url: str) -> str:
    """Scrape and extract text content from a URL.

    Args:
        url: The URL to scrape.

    Returns:
        Extracted plain text from the page.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # Remove script and style elements
        for element in soup(["script", "style", "nav", "footer", "header"]):
            element.decompose()

        text = soup.get_text(separator="\n", strip=True)

        # Clean up excessive whitespace
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r" {2,}", " ", text)

        return text.strip()
    except Exception as e:
        logger.error(f"Error scraping URL {url}: {e}")
        return f"[URL scraping error: {e}]"


def _extract_pdf(file_path: str) -> str:
    """Extract text from a PDF file using PyMuPDF."""
    doc = fitz.open(file_path)
    text_parts: list[str] = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        if text.strip():
            text_parts.append(f"--- Page {page_num + 1} ---\n{text.strip()}")

    doc.close()
    return "\n\n".join(text_parts) if text_parts else "[No text found in PDF]"


def _extract_image_ocr(file_path: str) -> str:
    """Extract text from an image using Tesseract OCR."""
    image = Image.open(file_path)
    text = pytesseract.image_to_string(image)

    if not text.strip():
        return "[No text detected in image - OCR returned empty result]"

    return text.strip()


def _extract_text_file(file_path: str) -> str:
    """Read and return text file content with chat/transcript detection."""
    path = Path(file_path)
    content = path.read_text(encoding="utf-8", errors="replace")
    return content.strip()


def _extract_docx(file_path: str) -> str:
    """Extract text from a Word document."""
    doc = Document(file_path)
    paragraphs: list[str] = []

    for paragraph in doc.paragraphs:
        if paragraph.text.strip():
            paragraphs.append(paragraph.text.strip())

    return "\n\n".join(paragraphs) if paragraphs else "[No text found in document]"


def detect_input_type(filename: str) -> InputType:
    """Detect input type from filename extension.

    Also detects chat/WhatsApp exports by filename patterns.

    Args:
        filename: The original filename.

    Returns:
        The detected InputType.
    """
    from app.constants import EXTENSION_TO_INPUT_TYPE

    ext = Path(filename).suffix.lower()
    input_type = EXTENSION_TO_INPUT_TYPE.get(ext, InputType.TRANSCRIPT)

    # Detect chat exports by filename pattern
    if input_type == InputType.TRANSCRIPT:
        lower_name = filename.lower()
        chat_indicators = ["whatsapp", "chat", "export", "message"]
        if any(indicator in lower_name for indicator in chat_indicators):
            return InputType.CHAT

    return input_type
