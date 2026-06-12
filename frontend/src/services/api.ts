// API Service for FastAPI Backend
// Configure this URL to match your backend deployment
// In production, uses /api which is proxied by nginx to the backend

const API_BASE_URL = "/api";

// Types matching your FastAPI models
export interface ArticleCreate {
  titre: string;
  auteurs?: string;
  doi?: string;
}

export interface ArticleResponse extends ArticleCreate {
  article_id: number;
}

export interface ExperienceCreate {
  description: string;
  article_id?: number;
}

export interface ExperienceResponse extends ExperienceCreate {
  experience_id: number;
}

export interface MachineCreate {
  constructeur?: string;
  modele: string;
  type_machine?: string;
}

export interface MachineResponse extends MachineCreate {
  machine_id: number;
}

export interface ExperienceMachineCreate {
  machine_id: number;
  energy?: string;
  collimation?: string;
  settings?: string;
}

export interface ExperienceMachineResponse extends ExperienceMachineCreate {
  experience_id: number;
}

export interface DetectorCreate {
  type_detecteur?: string;
  modele?: string;
  constructeur?: string;
}

export interface DetectorResponse extends DetectorCreate {
  detecteur_id: number;
}

export interface ExperienceDetectorCreate {
  detector_id: number;
  position?: string;
  depth?: string;
  orientation?: string;
}

export interface ExperienceDetectorResponse extends ExperienceDetectorCreate {
  experience_id: number;
}

export interface PhantomCreate {
  name: string;
  phantom_type?: string;
  dimensions?: string;
  material?: string;
}

export interface PhantomResponse extends PhantomCreate {
  phantom_id: number;
}

export interface ExperiencePhantomCreate {
  phantom_id: number;
}

export interface ExperiencePhantomResponse extends ExperiencePhantomCreate {
  experience_id: number;
}

export interface DonneeCreate {
  data_type?: string;
  unit?: string;
  file_format?: string;
  description?: string;
  file_path?: string;
}

export interface DonneeResponse extends DonneeCreate {
  data_id: number;
  experience_id: number;
}

export interface ColumnMapping {
  name: string;
  description: string;
  unit?: string;
  dataType: "numeric" | "categorical" | "text" | "datetime";
}

// API Error handling
class ApiError extends Error {
  status: number;
  details: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    let errorDetails = null;

    try {
      const errorData = await response.json();
      errorDetails = errorData;
      if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      const errorText = await response.text();
      if (errorText) {
        errorMessage = errorText;
      }
    }

    console.error("API Error:", { status: response.status, message: errorMessage, details: errorDetails });
    throw new ApiError(errorMessage, response.status, errorDetails);
  }

  try {
    return await response.json();
  } catch (error) {
    console.error("Failed to parse response:", error);
    throw new ApiError("Invalid response format from server", response.status);
  }
}

// API Methods
export const api = {
  // Articles
  async createArticle(data: ArticleCreate): Promise<ArticleResponse> {
    const response = await fetch(`${API_BASE_URL}/articles/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<ArticleResponse>(response);
  },

  async getArticles(): Promise<ArticleResponse[]> {
    const response = await fetch(`${API_BASE_URL}/articles/`);
    return handleResponse<ArticleResponse[]>(response);
  },

  async getArticle(id: number): Promise<ArticleResponse> {
    const response = await fetch(`${API_BASE_URL}/articles/${id}`);
    return handleResponse<ArticleResponse>(response);
  },

  async getArticleExperiences(articleId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/articles/${articleId}/experiences`);
    return handleResponse<any>(response);
  },

  // Experiences
  async createExperience(data: ExperienceCreate): Promise<ExperienceResponse> {
    const response = await fetch(`${API_BASE_URL}/experiences/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<ExperienceResponse>(response);
  },

  async getExperiences(): Promise<ExperienceResponse[]> {
    const response = await fetch(`${API_BASE_URL}/experiences/`);
    return handleResponse<ExperienceResponse[]>(response);
  },

  getDownloadUrl(experienceId: number, dataIndex: number): string {
    return `${API_BASE_URL}/experiences/${experienceId}/download/${dataIndex}`;
  },

  // Machines
  async createMachine(data: MachineCreate): Promise<MachineResponse> {
    const response = await fetch(`${API_BASE_URL}/machines/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<MachineResponse>(response);
  },

  async getMachines(): Promise<MachineResponse[]> {
    const response = await fetch(`${API_BASE_URL}/machines/`);
    return handleResponse<MachineResponse[]>(response);
  },

  // Link Machine to Experience
  async linkMachineToExperience(
    experienceId: number,
    data: ExperienceMachineCreate
  ): Promise<ExperienceMachineResponse> {
    const response = await fetch(
      `${API_BASE_URL}/experiences/${experienceId}/machines`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return handleResponse<ExperienceMachineResponse>(response);
  },

  // Detectors
  async createDetector(data: DetectorCreate): Promise<DetectorResponse> {
    const response = await fetch(`${API_BASE_URL}/detectors/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<DetectorResponse>(response);
  },

  async getDetectors(): Promise<DetectorResponse[]> {
    const response = await fetch(`${API_BASE_URL}/detectors/`);
    return handleResponse<DetectorResponse[]>(response);
  },

  // Link Detector to Experience
  async linkDetectorToExperience(
    experienceId: number,
    data: ExperienceDetectorCreate
  ): Promise<ExperienceDetectorResponse> {
    const response = await fetch(
      `${API_BASE_URL}/experiences/${experienceId}/detectors`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return handleResponse<ExperienceDetectorResponse>(response);
  },

  // Phantoms
  async createPhantom(data: PhantomCreate): Promise<PhantomResponse> {
    const response = await fetch(`${API_BASE_URL}/phantoms/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<PhantomResponse>(response);
  },

  async getPhantoms(): Promise<PhantomResponse[]> {
    const response = await fetch(`${API_BASE_URL}/phantoms/`);
    return handleResponse<PhantomResponse[]>(response);
  },

  // Link Phantom to Experience
  async linkPhantomToExperience(
    experienceId: number,
    data: ExperiencePhantomCreate
  ): Promise<ExperiencePhantomResponse> {
    const response = await fetch(
      `${API_BASE_URL}/experiences/${experienceId}/phantoms`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return handleResponse<ExperiencePhantomResponse>(response);
  },

  // Donnees (Data)
  async uploadDonnee(
    experienceId: number,
    file: File,
    data: {
      data_type: string;
      unit?: string;
      description?: string;
      columnMapping?: any[];
    }
  ): Promise<DonneeResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("data_type", data.data_type);
    if (data.unit) formData.append("unit", data.unit);
    if (data.description) formData.append("description", data.description);
    if (data.columnMapping && data.columnMapping.length > 0) {
      formData.append("columnMapping", JSON.stringify(data.columnMapping));
    }

    const response = await fetch(
      `${API_BASE_URL}/donnees/upload/${experienceId}`,
      {
        method: "POST",
        body: formData,
      }
    );
    return handleResponse<DonneeResponse>(response);
  },

// Complete submission - atomic transaction
  async submitCompleteExperiment(formData: {
    title: string;
    authors: string;
    doi?: string;
    experience_description: string;
    machines: any[];
    detectors: any[];
    phantoms: any[];
    // --- NOUVEAU : On attend une liste de fichiers et des métadonnées ---
    files: File[];
    data_metadata: any[];
  }): Promise<any> {
    const data = new FormData();
    data.append("title", formData.title);
    data.append("authors", formData.authors);
    if (formData.doi) data.append("doi", formData.doi);
    data.append("experience_description", formData.experience_description);
    data.append("machines", JSON.stringify(formData.machines));
    data.append("detectors", JSON.stringify(formData.detectors));
    data.append("phantoms", JSON.stringify(formData.phantoms));
    
    // --- NOUVEAU : On injecte la liste des fichiers et le JSON des métadonnées ---
    data.append("data_metadata", JSON.stringify(formData.data_metadata));
    formData.files.forEach((file) => {
      // Dans FormData, si on append plusieurs fois avec la même clé "files",
      // ça crée automatiquement une liste/tableau que FastAPI comprendra !
      data.append("files", file); 
    });

    const response = await fetch(`${API_BASE_URL}/complete/submit`, {
      method: "POST",
      body: data,
    });
    return handleResponse<any>(response);
  },

  // Submit experience for existing article (new multi-experiment paradigm)
  async submitExperienceToArticle(articleId: number, formData: {
    experience_description: string;
    machines: any[];
    detectors: any[];
    phantoms: any[];
    // --- NOUVEAU : On attend une liste de fichiers et des métadonnées ---
    files: File[];
    data_metadata: any[];
  }): Promise<any> {
    const data = new FormData();
    data.append("experience_description", formData.experience_description);
    data.append("machines", JSON.stringify(formData.machines));
    data.append("detectors", JSON.stringify(formData.detectors));
    data.append("phantoms", JSON.stringify(formData.phantoms));
    
    // --- NOUVEAU : On injecte la liste des fichiers et le JSON des métadonnées ---
    data.append("data_metadata", JSON.stringify(formData.data_metadata));
    formData.files.forEach((file) => {
      data.append("files", file); 
    });

    const response = await fetch(`${API_BASE_URL}/complete/submit-experience/${articleId}`, {
      method: "POST",
      body: data,
    });
    return handleResponse<any>(response);
  },

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse<{ status: string }>(response);
  },
};

export { ApiError };
