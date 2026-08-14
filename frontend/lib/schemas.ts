import { z } from "zod";

export const PainPointSchema = z.object({
  id: z.string(),
  description: z.string(),
  source_input_ids: z.array(z.string()),
});

export const RequirementSchema = z.object({
  id: z.string(),
  description: z.string(),
  source_input_ids: z.array(z.string()),
});

export const GapSchema = z.object({
  id: z.string(),
  description: z.string(),
});

export const ImprovementSchema = z.object({
  id: z.string(),
  description: z.string(),
  related_pain_point_ids: z.array(z.string()),
});

export const FeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

export const UserRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

export const ScreenSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

export const FlowStepSchema = z.object({
  step_number: z.number(),
  description: z.string(),
});

export const InputItemSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  type: z.enum(["pdf", "image", "transcript", "chat", "docx", "url"]),
  filename: z.string(),
  raw_text: z.string().nullable().optional(),
  file_path: z.string().nullable().optional(),
  extracted_at: z.string().nullable().optional(),
});

export const DiscoveryDataSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  main_goal: z.string(),
  current_process: z.string(),
  pain_points: z.array(PainPointSchema),
  requirements: z.array(RequirementSchema),
  gaps: z.array(GapSchema),
  created_at: z.string(),
});

export const SolutionDataSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  improvements: z.array(ImprovementSchema),
  features: z.array(FeatureSchema),
  user_roles: z.array(UserRoleSchema),
  screens: z.array(ScreenSchema),
  flow_steps: z.array(FlowStepSchema),
  created_at: z.string(),
});

export const PocDataSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  description: z.string(),
  artifact_path: z.string(),
  generated_at: z.string(),
});

export const ProjectDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["created", "uploading", "analyzing", "completed", "error"]),
  created_at: z.string(),
  updated_at: z.string(),
  inputs: z.array(InputItemSchema),
  discovery: DiscoveryDataSchema.nullable().optional(),
  solution: SolutionDataSchema.nullable().optional(),
  poc: PocDataSchema.nullable().optional(),
});

export const ProjectListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["created", "uploading", "analyzing", "completed", "error"]),
  created_at: z.string(),
  updated_at: z.string(),
  input_count: z.number(),
});

export const SettingsDataSchema = z.object({
  llm_provider: z.enum(["gemini", "ollama"]),
  gemini_available: z.boolean(),
  ollama_available: z.boolean(),
});
