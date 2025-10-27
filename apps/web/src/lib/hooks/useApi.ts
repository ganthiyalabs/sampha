import { useCallback, useEffect, useState } from "react";
import { type AlertsResponse, api, type HealthResponse, type LogsResponse } from "../api";

// Custom hook for fetching health data
export const useHealth = () => {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.health();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch health data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return { data, loading, error, refetch: fetchHealth };
};

// Custom hook for fetching logs
export const useLogs = () => {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.logs.getAll();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { data, loading, error, refetch: fetchLogs };
};

// Custom hook for fetching alerts
export const useAlerts = () => {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.alerts.getAll();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { data, loading, error, refetch: fetchAlerts };
};

// Generic hook for any API call
export const useApi = <T>(apiCall: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "API call failed");
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
