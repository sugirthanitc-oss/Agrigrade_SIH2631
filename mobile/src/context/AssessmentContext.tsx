import React, { createContext, useContext, useState, useEffect } from 'react';
import { AssessmentData, DashboardStats, UserSession } from '../types';
import { fetchAssessmentHistory, fetchDashboardMetrics } from '../api/client';
import { getBackendUrl, setBackendUrl as saveBackendUrl } from '../api/config';

interface AssessmentContextType {
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  serverUrl: string;
  updateServerUrl: (url: string) => void;
  history: AssessmentData[];
  dashboardStats: DashboardStats;
  isLoadingStats: boolean;
  statsError: string | null;
  refreshDashboard: () => Promise<void>;
  addAssessmentToCache: (assessment: AssessmentData) => void;
}

const defaultStats: DashboardStats = {
  total_assessments: 0,
  total_onions_analyzed: 0,
  average_grade_a: 0,
  average_urs: 0,
};

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>({
    name: 'மதிப்பீட்டாளர்',
    email: 'inspector@onion-quality.local',
    role: 'வெங்காய தரப் பரிசோதகர்',
  });
  const [serverUrl, setServerUrlState] = useState<string>(getBackendUrl());
  const [history, setHistory] = useState<AssessmentData[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(defaultStats);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const updateServerUrl = (url: string) => {
    saveBackendUrl(url);
    setServerUrlState(getBackendUrl());
  };

  const calculateStatsFromHistory = (items: AssessmentData[]): DashboardStats => {
    if (items.length === 0) return defaultStats;

    const totalAssessments = items.length;
    const totalOnions = items.reduce((acc, curr) => acc + (curr.total_count || 0), 0);
    const sumGradeA = items.reduce((acc, curr) => acc + (curr.grading?.grade_a_percentage || 0), 0);
    const sumURS = items.reduce((acc, curr) => acc + (curr.grading?.urs_percentage || 0), 0);

    return {
      total_assessments: totalAssessments,
      total_onions_analyzed: totalOnions,
      average_grade_a: parseFloat((sumGradeA / totalAssessments).toFixed(1)),
      average_urs: parseFloat((sumURS / totalAssessments).toFixed(1)),
    };
  };

  const refreshDashboard = async () => {
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      // Attempt to load aggregated stats from backend
      try {
        const stats = await fetchDashboardMetrics();
        setDashboardStats(stats);
      } catch {
        // Fallback: derive stats from history endpoint
        const historyItems = await fetchAssessmentHistory();
        setHistory(historyItems);
        setDashboardStats(calculateStatsFromHistory(historyItems));
      }
    } catch (err: any) {
      setStatsError(err.message || 'Failed to sync with backend');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const addAssessmentToCache = (newAssessment: AssessmentData) => {
    setHistory((prev) => {
      const updated = [newAssessment, ...prev.filter((a) => a.assessment_id !== newAssessment.assessment_id)];
      setDashboardStats(calculateStatsFromHistory(updated));
      return updated;
    });
  };

  return (
    <AssessmentContext.Provider
      value={{
        user,
        setUser,
        serverUrl,
        updateServerUrl,
        history,
        dashboardStats,
        isLoadingStats,
        statsError,
        refreshDashboard,
        addAssessmentToCache,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = (): AssessmentContextType => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};
