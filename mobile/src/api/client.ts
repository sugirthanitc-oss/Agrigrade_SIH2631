import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import { getBackendUrl } from './config';
import { AssessmentData, DashboardStats } from '../types';

export interface AnalyzePayload {
  imageUri: any;
  imageAsset?: any;
  image?: any;
  batchId?: string;
  variety?: string;
  notes?: string;
}

export type ErrorType = 'NETWORK_FAILURE' | 'SERVER_ERROR' | 'INVALID_IMAGE' | 'EMPTY_RESULT' | 'TIMEOUT' | 'UNKNOWN';

export class ApiError extends Error {
  type: ErrorType;
  statusCode?: number;

  constructor(message: string, type: ErrorType, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.statusCode = statusCode;
  }
}

/**
 * Sends the captured/selected onion batch image to the backend YOLO assessment service.
 * Endpoint: POST http://<BACKEND_URL>/analyze
 */
export const analyzeImageOnBackend = async (payload: AnalyzePayload): Promise<AssessmentData> => {
  const baseUrl = getBackendUrl();
  const endpoint = `${baseUrl}/analyze`;

  // Safely extract image URI whether payload.imageUri is a string or an ImagePicker asset object
  let image: { uri: string; name?: string; type?: string } = { uri: '' };

  if (typeof payload.imageUri === 'string' && payload.imageUri.trim() !== '') {
    image = { uri: payload.imageUri };
  } else if (payload.imageUri && typeof payload.imageUri === 'object') {
    image = {
      uri: payload.imageUri.uri || '',
      name: payload.imageUri.fileName || payload.imageUri.name,
      type: payload.imageUri.mimeType || payload.imageUri.type,
    };
  } else if (payload.image && typeof payload.image === 'object') {
    image = {
      uri: payload.image.uri || '',
      name: payload.image.fileName || payload.image.name,
      type: payload.image.mimeType || payload.image.type,
    };
  } else if (payload.imageAsset && typeof payload.imageAsset === 'object') {
    image = {
      uri: payload.imageAsset.uri || '',
      name: payload.imageAsset.fileName || payload.imageAsset.name,
      type: payload.imageAsset.mimeType || payload.imageAsset.type,
    };
  }

  // Validation: Ensure valid image URI exists
  if (!image.uri) {
    throw new ApiError('No image selected for analysis. Please capture or pick an image.', 'INVALID_IMAGE');
  }

  const formData = new FormData();

  // On Web, browser native FormData requires a Blob or File to avoid [object Object] upload bug.
  // On React Native (iOS / Android), the standard React Native object format is used.
  if (Platform.OS === 'web') {
    try {
      const res = await fetch(image.uri);
      const blob = await res.blob();
      formData.append('file', blob, image.name || 'upload.jpg');
    } catch {
      formData.append('file', {
        uri: image.uri,
        name: 'upload.jpg',
        type: 'image/jpeg',
      } as any);
    }
  } else {
    // Correct React Native FormData append logic
    formData.append('file', {
      uri: image.uri,
      name: 'upload.jpg',
      type: 'image/jpeg',
    } as any);
  }

  if (payload.batchId) {
    formData.append('batch_id', payload.batchId);
  }
  if (payload.variety) {
    formData.append('variety', payload.variety);
  }
  if (payload.notes) {
    formData.append('notes', payload.notes);
  }

  try {
    const response = await axios.post<any>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      timeout: 45000, // 45-second timeout for model inference
    });

    const data = response.data;

    // Check for empty or malformed AI result
    if (!data || typeof data !== 'object') {
      throw new ApiError('Backend returned an empty or unreadable response.', 'EMPTY_RESULT');
    }

    const totalCount = data.total_onions ?? data.total_count ?? 0;
    const gradeA = data.grade_a ?? data.grading?.grade_a_percentage ?? 0;
    const urs = data.urs ?? data.grading?.urs_percentage ?? 0;

    // Normalize output into strong AssessmentData contract
    const normalizedAssessment: AssessmentData = {
      assessment_id: data.assessment_id || `ASM-${Date.now()}`,
      batch_id: data.batch_id || payload.batchId || 'Inspection Batch',
      variety: data.variety || payload.variety || 'Commercial Red',
      notes: data.notes || payload.notes,
      timestamp: data.timestamp || new Date().toISOString(),
      total_count: totalCount,
      total_onions: totalCount,
      counts: {
        healthy: data.counts?.healthy ?? 0,
        damaged: data.counts?.damaged ?? 0,
        rotten: data.counts?.rotten ?? 0,
        sprouted: data.counts?.sprouted ?? 0,
        undersized: data.counts?.undersized ?? 0,
      },
      percentages: {
        healthy: data.percentages?.healthy ?? 0,
        damaged: data.percentages?.damaged ?? 0,
        rotten: data.percentages?.rotten ?? 0,
        sprouted: data.percentages?.sprouted ?? 0,
        undersized: data.percentages?.undersized ?? 0,
      },
      grade_a: gradeA,
      urs: urs,
      grading: {
        overall_grade: data.grading?.overall_grade || (gradeA >= 70 ? 'Grade A' : 'URS'),
        grade_a_percentage: gradeA,
        urs_percentage: urs,
        verdict_notes: data.grading?.verdict_notes || [],
        is_acceptable: data.grading?.is_acceptable ?? (gradeA >= 70),
      },
      annotated_image_url: data.annotated_image_url,
      raw_image_url: data.raw_image_url,
      detections: data.detections,
    };

    return normalizedAssessment;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError<any>;

      // 1. Timeout handling
      if (axiosErr.code === 'ECONNABORTED' || (axiosErr.message && axiosErr.message.toLowerCase().includes('timeout'))) {
        throw new ApiError(
          'Request timed out. The AI inference server took longer than 45 seconds to respond.',
          'TIMEOUT'
        );
      }

      // 2. Network failure (unreachable, DNS, offline)
      if (
        axiosErr.code === 'ERR_NETWORK' ||
        (axiosErr.message && axiosErr.message.toLowerCase().includes('network error')) ||
        (!axiosErr.response && axiosErr.request)
      ) {
        throw new ApiError(
          `Cannot connect to backend server at ${baseUrl}.`,
          'NETWORK_FAILURE'
        );
      }

      // 3. Server HTTP error responses (clean extraction to avoid [object Object])
      if (axiosErr.response) {
        const status = axiosErr.response.status;
        let detail = 'Server returned an error.';

        if (axiosErr.response.data) {
          const respData = axiosErr.response.data;
          if (typeof respData === 'string') {
            detail = respData;
          } else if (respData.detail) {
            if (Array.isArray(respData.detail)) {
              detail = respData.detail
                .map((d: any) => (typeof d === 'string' ? d : d.msg || d.message || 'Validation error'))
                .join(', ');
            } else if (typeof respData.detail === 'object') {
              detail = respData.detail.msg || respData.detail.message || 'Validation error';
            } else {
              detail = String(respData.detail);
            }
          } else if (respData.message) {
            detail = typeof respData.message === 'string' ? respData.message : 'Server error';
          }
        }

        if (status === 400 || status === 422) {
          throw new ApiError(detail, 'INVALID_IMAGE', status);
        } else if (status >= 500) {
          throw new ApiError(detail, 'SERVER_ERROR', status);
        } else {
          throw new ApiError(detail, 'UNKNOWN', status);
        }
      }
    }

    const cleanMsg = typeof error?.message === 'string' ? error.message : 'An unexpected error occurred.';
    throw new ApiError(cleanMsg, 'UNKNOWN');
  }
};

/**
 * Fetch aggregated dashboard metrics from the backend.
 */
export const fetchDashboardMetrics = async (): Promise<DashboardStats> => {
  const baseUrl = getBackendUrl();
  try {
    const response = await axios.get<DashboardStats>(`${baseUrl}/api/v1/dashboard/stats`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 10000,
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new ApiError(`Failed to fetch dashboard statistics: ${error.response.status}`, 'SERVER_ERROR', error.response.status);
    }
    throw new ApiError(`Cannot connect to backend at ${baseUrl}`, 'NETWORK_FAILURE');
  }
};

/**
 * Fetch past assessment records stored in the database.
 * Calls GET /assessments
 */
export const fetchAssessmentHistory = async (): Promise<AssessmentData[]> => {
  const baseUrl = getBackendUrl();
  try {
    const response = await axios.get<any[]>(`${baseUrl}/assessments`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 15000,
    });
    return (response.data || []).map((item) => ({
      assessment_id: item.assessment_id,
      batch_id: item.batch_id,
      variety: item.variety,
      notes: item.notes,
      timestamp: item.date || item.timestamp,
      total_count: item.total_onions ?? item.total_count ?? 0,
      total_onions: item.total_onions ?? item.total_count ?? 0,
      counts: item.counts || {
        healthy: 0,
        damaged: 0,
        rotten: 0,
        sprouted: 0,
        undersized: 0,
      },
      percentages: item.percentages || {
        healthy: item.healthy_percentage ?? 0,
        damaged: item.damaged_percentage ?? 0,
        rotten: item.rotten_percentage ?? 0,
        sprouted: item.sprouted_percentage ?? 0,
        undersized: item.undersized_percentage ?? 0,
      },
      grade_a: item.grade_a ?? 0,
      urs: item.urs ?? 0,
      grading: {
        overall_grade: item.overall_grade || (item.grade_a >= 70 ? 'Grade A' : 'URS'),
        grade_a_percentage: item.grade_a ?? 0,
        urs_percentage: item.urs ?? 0,
        verdict_notes: [],
        is_acceptable: item.overall_grade === 'Grade A',
      },
      annotated_image_url: item.annotated_image_url,
      raw_image_url: item.raw_image_url,
    }));
  } catch (error: any) {
    if (error.response) {
      throw new ApiError(`Failed to retrieve history (${error.response.status})`, 'SERVER_ERROR', error.response.status);
    }
    throw new ApiError(`Cannot connect to backend at ${baseUrl}`, 'NETWORK_FAILURE');
  }
};

/**
 * Fetch a single assessment by ID.
 * Calls GET /assessments/{id}
 */
export const fetchAssessmentById = async (id: string): Promise<AssessmentData> => {
  const baseUrl = getBackendUrl();
  try {
    const response = await axios.get<any>(`${baseUrl}/assessments/${id}`, {
      timeout: 15000,
    });
    const item = response.data;
    return {
      assessment_id: item.assessment_id,
      batch_id: item.batch_id,
      variety: item.variety,
      notes: item.notes,
      timestamp: item.date || item.timestamp,
      total_count: item.total_onions ?? item.total_count ?? 0,
      total_onions: item.total_onions ?? item.total_count ?? 0,
      counts: item.counts || {
        healthy: 0,
        damaged: 0,
        rotten: 0,
        sprouted: 0,
        undersized: 0,
      },
      percentages: item.percentages || {
        healthy: item.healthy_percentage ?? 0,
        damaged: item.damaged_percentage ?? 0,
        rotten: item.rotten_percentage ?? 0,
        sprouted: item.sprouted_percentage ?? 0,
        undersized: item.undersized_percentage ?? 0,
      },
      grade_a: item.grade_a ?? 0,
      urs: item.urs ?? 0,
      grading: {
        overall_grade: item.overall_grade || (item.grade_a >= 70 ? 'Grade A' : 'URS'),
        grade_a_percentage: item.grade_a ?? 0,
        urs_percentage: item.urs ?? 0,
        verdict_notes: [],
        is_acceptable: item.overall_grade === 'Grade A',
      },
      annotated_image_url: item.annotated_image_url,
      raw_image_url: item.raw_image_url,
    };
  } catch (error: any) {
    if (error.response) {
      throw new ApiError(`Assessment #${id} not found`, 'SERVER_ERROR', error.response.status);
    }
    throw new ApiError(`Cannot connect to backend at ${baseUrl}`, 'NETWORK_FAILURE');
  }
};
