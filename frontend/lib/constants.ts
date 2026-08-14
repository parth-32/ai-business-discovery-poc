/** Single source of truth for frontend static data and configuration */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const INPUT_TYPE_LABELS: Record<string, { label: string; badgeColor: string }> = {
  pdf: { label: "PDF Document", badgeColor: "bg-red-500/10 text-red-600 border-red-200" },
  image: { label: "Screenshot / Image", badgeColor: "bg-blue-500/10 text-blue-600 border-blue-200" },
  transcript: { label: "Meeting Transcript", badgeColor: "bg-purple-500/10 text-purple-600 border-purple-200" },
  chat: { label: "WhatsApp / Chat Export", badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  docx: { label: "Word Document", badgeColor: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
  url: { label: "Website URL", badgeColor: "bg-amber-500/10 text-amber-600 border-amber-200" },
};

export const PIPELINE_STAGES = [
  { id: "ingest", title: "1. Ingestion", description: "Extracting text from files & URLs" },
  { id: "extract", title: "2. Business Discovery", description: "Analyzing goals, process & pain points" },
  { id: "synthesize", title: "3. Synthesis", description: "Mapping improvements to pain points" },
  { id: "outline", title: "4. Solution Outline", description: "Designing features, roles & flow" },
  { id: "poc", title: "5. POC Generation", description: "Building single-file HTML prototype" },
] as const;

export const SAMPLE_SCENARIOS = [
  {
    id: "logistics",
    name: "QuickShip Logistics",
    description: "Courier company tracking deliveries via spreadsheets and WhatsApp messages.",
    badge: "Logistics / Operations",
  },
  {
    id: "clinic",
    name: "Bright Smile Dental Clinic",
    description: "Healthcare clinic experiencing double-bookings and no-shows with paper calendars.",
    badge: "Healthcare / Scheduling",
  },
  {
    id: "restaurant",
    name: "Bella Cucina Restaurant",
    description: "Multi-branch restaurant struggling with ingredient stockouts and manual ordering.",
    badge: "Retail / Food & Beverage",
  },
] as const;
