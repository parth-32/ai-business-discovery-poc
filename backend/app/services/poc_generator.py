"""POC Generator service - creates self-contained HTML applications.

Uses the LLM to generate a single HTML file with embedded CSS and JavaScript
that demonstrates the core proposed feature from the solution outline.
"""

import logging
import re

from app.services.llm import invoke_raw

logger = logging.getLogger(__name__)

INTER_FONT_LINKS = """
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body, button, input, select, textarea, td, th {
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }
    </style>
"""


async def generate_poc_html(
    discovery_summary: str,
    solution_summary: str,
    primary_provider: str,
    reference_context: str = "",
) -> tuple[str, str]:
    """Generate a self-contained POC HTML application.

    Args:
        discovery_summary: Summary of the business discovery (goal, pain points).
        solution_summary: Summary of the proposed solution (features, screens, flow).
        primary_provider: LLM provider to use.
        reference_context: Optional raw text from screenshot OCR / URL inputs for reference data.

    Returns:
        Tuple of (description, html_content).
    """
    reference_section = ""
    if reference_context.strip():
        reference_section = f"\n## Reference Inputs (OCR Screenshots / Website Data)\n{reference_context[:3000]}\n"

    prompt = f"""You are an expert UI/UX designer and frontend developer creating a prototype POC application.

Based on the following business analysis, solution outline, and reference inputs (including OCR extracted from screenshots and web pages), create a COMPLETE, HIGHLY POLISHED, SELF-CONTAINED HTML file that demonstrates the MOST IMPORTANT proposed feature.

## Business Discovery
{discovery_summary}

## Proposed Solution
{solution_summary}
{reference_section}
## Requirements for the POC HTML file:
1. It MUST be a single, complete HTML file with ALL CSS and JavaScript embedded inline.
2. Use Google Font 'Inter' in <head>:
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
3. Apply Inter typography across ALL elements: `font-family: 'Inter', system-ui, -apple-system, sans-serif;`
4. INHERIT DOMAIN FIELDS & DATA: Use actual column names, data fields, and terminology found in the Reference Inputs (e.g. screenshot OCR text or website content) to make the prototype feel realistic to the client's existing workflow.
5. DESIGN AESTHETICS (CRITICAL - PREMIUM & MODERN UI):
   - **Color Palette**: Use sleek, modern color schemes (e.g. slate dark `#0f172a` or crisp light `#f8fafc` background, `#1e293b` cards, `#6366f1` / `#10b981` accents). AVOID generic harsh primary blue (`#007bff`) or neon green.
   - **Card & Layout**: Modern card designs with subtle borders (`border: 1px solid #e2e8f0`), rounded corners (`border-radius: 12px`), elegant padding (`1.5rem`), and soft box shadows (`box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05)`).
   - **Header**: Create an elegant top navigation header with clean typography, subtitle, and badges.
   - **Buttons**: Styled rounded buttons (`border-radius: 8px`), hover states (`transition: all 0.2s ease`).
6. Fully functional with working interactive state, mock data tables/cards, filters, and form actions.
7. Output ONLY the raw HTML starting with <!DOCTYPE html> and ending with </html>. No code fences, no markdown."""

    html_content = await invoke_raw(prompt, primary_provider)

    # Clean up and ensure Inter font is properly injected
    html_content = _clean_html_output(html_content)

    # Generate a brief description
    description_prompt = f"""Based on this business context, write ONE sentence describing what the POC demonstrates:

Business Goal: {discovery_summary[:500]}

Respond with only the sentence, nothing else."""

    description = await invoke_raw(description_prompt, primary_provider)
    description = description.strip().strip('"').strip("'")

    return description, html_content


def _clean_html_output(html: str) -> str:
    """Clean LLM output to extract pure HTML content and ensure Inter font injection.

    Args:
        html: Raw LLM output.

    Returns:
        Cleaned HTML string with Inter font guaranteed.
    """
    # Remove markdown code fences
    if "```html" in html:
        html = html.split("```html", 1)[1]
        if "```" in html:
            html = html.rsplit("```", 1)[0]
    elif "```" in html:
        parts = html.split("```")
        if len(parts) >= 3:
            html = parts[1]

    # Find the actual HTML content
    doctype_idx = html.lower().find("<!doctype")
    html_start_idx = html.lower().find("<html")
    start_idx = min(
        idx for idx in [doctype_idx, html_start_idx] if idx >= 0
    ) if any(idx >= 0 for idx in [doctype_idx, html_start_idx]) else 0

    html_end_idx = html.lower().rfind("</html>")
    if html_end_idx >= 0:
        html = html[start_idx:html_end_idx + 7]
    elif start_idx > 0:
        html = html[start_idx:]

    cleaned = html.strip()

    # Ensure Inter Google font is injected into <head>
    if "fonts.googleapis.com" not in cleaned:
        if "<head>" in cleaned:
            cleaned = cleaned.replace("<head>", f"<head>\n{INTER_FONT_LINKS}", 1)
        elif "<HEAD>" in cleaned:
            cleaned = cleaned.replace("<HEAD>", f"<HEAD>\n{INTER_FONT_LINKS}", 1)
        elif "<html>" in cleaned:
            cleaned = cleaned.replace("<html>", f"<html>\n<head>{INTER_FONT_LINKS}</head>", 1)

    return cleaned
