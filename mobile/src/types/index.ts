export type OnionCategory = 'healthy' | 'damaged' | 'rotten' | 'sprouted' | 'undersized';

export type QualityGrade = 'Grade A' | 'Grade B' | 'URS';

export interface CategoryCounts {
  healthy: number;
  damaged: number;
  rotten: number;
  sprouted: number;
  undersized: number;
}

export interface CategoryPercentages {
  healthy: number;
  damaged: number;
  rotten: number;
  sprouted: number;
  undersized: number;
}

export interface GradingResult {
  overall_grade: QualityGrade;
  grade_a_percentage: number;
  urs_percentage: number;
  verdict_notes: string[];
  is_acceptable: boolean;
}

export interface BoundingBox {
  id: number;
  class_name: OnionCategory;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
}

export interface AssessmentData {
  assessment_id: string;
  batch_id?: string;
  variety?: string;
  notes?: string;
  timestamp: string;
  total_count: number;
  total_onions: number;
  counts: CategoryCounts;
  percentages: CategoryPercentages;
  grade_a: number;
  urs: number;
  grading: GradingResult;
  annotated_image_url?: string;
  raw_image_url?: string;
  report_url?: string;
  detections?: BoundingBox[];
}

export interface DashboardStats {
  total_assessments: number;
  total_onions_analyzed: number;
  average_grade_a: number;
  average_urs: number;
}

export interface UserSession {
  email: string;
  name: string;
  role: string;
}

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Dashboard: undefined;
  NewAssessment: undefined;
  ImageCapture: { batchId?: string; variety?: string; notes?: string; devTestMode?: boolean };
  AIProcessing: { imageUri: string; batchId?: string; variety?: string; notes?: string; imageAsset?: any };
  QualityResults: { assessment: AssessmentData };
  DigitalReport: { assessment: AssessmentData };
  AssessmentHistory: undefined;
  AssessmentDetails: { assessmentId: string };
};
