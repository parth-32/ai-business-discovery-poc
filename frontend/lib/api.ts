import { API_BASE_URL } from "./constants";
import {
  ProjectDetailSchema,
  ProjectListItemSchema,
  SettingsDataSchema,
  InputItemSchema,
} from "./schemas";
import type {
  ProjectDetail,
  ProjectListItem,
  SettingsData,
  InputItem,
  LLMProvider,
} from "./types";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorJson.message || errorDetail;
    } catch {
      // Ignore JSON parse error on error response
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Projects
  async getProjects(): Promise<ProjectListItem[]> {
    const data = await fetchJson<unknown>(`${API_BASE_URL}/projects`);
    return ProjectListItemSchema.array().parse(data);
  },

  async createProject(name: string): Promise<ProjectDetail> {
    const data = await fetchJson<unknown>(`${API_BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return ProjectDetailSchema.parse(data);
  },

  async getProject(id: string): Promise<ProjectDetail> {
    const data = await fetchJson<unknown>(`${API_BASE_URL}/projects/${id}`);
    return ProjectDetailSchema.parse(data);
  },

  async deleteProject(id: string): Promise<void> {
    await fetch(`${API_BASE_URL}/projects/${id}`, { method: "DELETE" });
  },

  // Inputs
  async uploadFiles(projectId: string, files: File[]): Promise<InputItem[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const data = await fetchJson<unknown>(`${API_BASE_URL}/projects/${projectId}/inputs`, {
      method: "POST",
      body: formData,
    });
    return InputItemSchema.array().parse(data);
  },

  async addUrlInput(projectId: string, url: string): Promise<InputItem> {
    const data = await fetchJson<unknown>(`${API_BASE_URL}/projects/${projectId}/inputs/url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    return InputItemSchema.parse(data);
  },

  async deleteInput(projectId: string, inputId: string): Promise<void> {
    await fetch(`${API_BASE_URL}/projects/${projectId}/inputs/${inputId}`, {
      method: "DELETE",
    });
  },

  async loadSampleData(projectId: string, scenario: string): Promise<InputItem[]> {
    const data = await fetchJson<unknown>(
      `${API_BASE_URL}/projects/${projectId}/load-sample/${scenario}`,
      { method: "POST" }
    );
    return InputItemSchema.array().parse(data);
  },

  // Settings
  async getSettings(): Promise<SettingsData> {
    const data = await fetchJson<unknown>(`${API_BASE_URL}/settings`);
    return SettingsDataSchema.parse(data);
  },

  async updateSettings(llm_provider: LLMProvider): Promise<SettingsData> {
    const data = await fetchJson<unknown>(`${API_BASE_URL}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ llm_provider }),
    });
    return SettingsDataSchema.parse(data);
  },

  // Analysis
  async startAnalysis(projectId: string, provider?: LLMProvider): Promise<{ message: string }> {
    return fetchJson(`${API_BASE_URL}/projects/${projectId}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ llm_provider: provider }),
    });
  },
};
