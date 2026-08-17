/** TypeScript interfaces ensuring strict type safety across frontend */

export type ProjectStatus = "created" | "uploading" | "analyzing" | "completed" | "error";

export type InputType = "pdf" | "image" | "transcript" | "chat" | "docx" | "url";

export type LLMProvider = "gemini" | "ollama";

export interface PainPoint {
  id: string;
  description: string;
  source_input_ids: string[];
}

export interface Requirement {
  id: string;
  description: string;
  source_input_ids: string[];
}

export interface Gap {
  id: string;
  description: string;
}

export interface Improvement {
  id: string;
  description: string;
  related_pain_point_ids: string[];
}

export interface Feature {
  id: string;
  name: string;
  description: string;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
}

export interface Screen {
  id: string;
  name: string;
  description: string;
}

export interface FlowStep {
  step_number: number;
  description: string;
}

export interface InputItem {
  id: string;
  project_id: string;
  type: InputType;
  filename: string;
  raw_text?: string | null;
  file_path?: string | null;
  extracted_at?: string | null;
}

export interface DiscoveryData {
  id: string;
  project_id: string;
  main_goal: string;
  current_process: string;
  pain_points: PainPoint[];
  requirements: Requirement[];
  gaps: Gap[];
  created_at: string;
}

export interface SolutionData {
  id: string;
  project_id: string;
  improvements: Improvement[];
  features: Feature[];
  user_roles: UserRole[];
  screens: Screen[];
  flow_steps: FlowStep[];
  created_at: string;
}

export interface PocData {
  id: string;
  project_id: string;
  description: string;
  artifact_path: string;
  generated_at: string;
}

export interface ProjectDetail {
  id: string;
  name: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  inputs: InputItem[];
  discovery?: DiscoveryData | null;
  solution?: SolutionData | null;
  poc?: PocData | null;
}

export interface ProjectListItem {
  id: string;
  name: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  input_count: number;
}

export interface SettingsData {
  llm_provider: LLMProvider;
  gemini_available: boolean;
  ollama_available: boolean;
  gemini_model?: string;
  ollama_model?: string;
}

export interface PipelineProgressEvent {
  stage: string;
  status: "pending" | "running" | "complete" | "error";
  message: string;
  progress: number;
  total_stages: number;
  timestamp: string;
}
