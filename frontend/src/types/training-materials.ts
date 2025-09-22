
export type TrainingMaterialType = 'document' | 'video' | 'presentation' | 'interactive' | 'assessment';

export interface TrainingMaterial {
  id: string;
  title: string;
  description: string;
  material_type: TrainingMaterialType;
  category: string;
  tags: string[];
  is_public: boolean;
  file_path: string;
  file_size: number;
  file_type: string;
  file_name: string;
  center_id: string;
  created_at: string;
  updated_at: string;
}
