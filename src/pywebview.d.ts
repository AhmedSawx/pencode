interface PyWebviewApi {
  save_project(path: string, data: string): Promise<{ success: boolean; path?: string; error?: string }>;
  save_image(path: string, data: string): Promise<{ success: boolean; path?: string; error?: string }>;
  save_brush(path: string, data: string): Promise<{ success: boolean; path?: string; error?: string }>;
  load_project(path: string): Promise<{ success: boolean; data?: string; filePath?: string; error?: string }>;
  list_projects(): Promise<{ success: boolean; files?: string[]; error?: string }>;
  show_save_as_dialog(defaultName: string, fileTypes: string[]): Promise<string | null>;
  show_open_dialog(fileTypes: string[]): Promise<string | null>;
  quit_app(): void;
  get_projects_dir(): Promise<string>;
}

interface Window {
  pywebview?: {
    api: PyWebviewApi;
  };
}
