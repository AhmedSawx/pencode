export type BrushType = 'standard' | 'spray' | 'marker' | 'custom' | 'image';
export type BrushRotate = 'none' | 'natural' | 'random';
export type PressureType = 'standard' | 'custom';

export interface Brush {
  name: string;
  type: BrushType;
  weight: number;
  opacity: number;
  spacing: number;
  blend: boolean;
  rotate: BrushRotate;
  status?: 'discarded';
  
  // Type-specific properties
  vibration?: number;     // For standard, spray, marker, custom
  definition?: number | null;    // For standard, spray
  quality?: number | null;       // For standard, spray
  tip?: string | null;           // For custom
  image?: { src: string }; // For image

  pressure: {
    type: PressureType;
    min_max: [number, number];
    curve: [number, number] | string; // Array for 'standard', string for 'custom'
  };
}

export interface Project {
  id: string;
  title: string;
  code?: string;
  canvasImage?: string; // base64 encoded
  canvasSize: { width: number; height: number };
  createdAt: string; // ISO 8601
  lastModified: string; // ISO 8601
  status: 'draft' | 'saved';
  hasUnsavedChanges?: boolean;
  filePath?: string; // For desktop app
  brushes?: Brush[];
}
