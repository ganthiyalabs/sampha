import axios, { type AxiosInstance, type AxiosResponse } from "axios";

// API Response Types
export interface ApiResponse<T = unknown> {
	data: T;
	message?: string;
	status: number;
}

// Hello World Response Type
export interface HelloWorldResponse {
	message: string;
}

// Health Response Type
export interface HealthResponse {
	status: string;
	timestamp: string;
	uptime: number;
}

// Log Entry Type
export interface LogEntry {
	id: string;
	level: string;
	message: string;
	timestamp: string;
	source: string;
}

// Logs Response Type
export interface LogsResponse {
	logs: LogEntry[];
	total: number;
	page: number;
	limit: number;
}

// Alert Type
export interface Alert {
	id: string;
	title: string;
	description: string;
	severity: "low" | "medium" | "high" | "critical";
	status: "active" | "resolved" | "dismissed";
	createdAt: string;
	updatedAt: string;
}

// Alerts Response Type
export interface AlertsResponse {
	alerts: Alert[];
	total: number;
	page: number;
	limit: number;
}

// API Client Configuration
const API_BASE_URL =
	process.env.NODE_ENV === "production" ? "/api" : "http://localhost:8080/api";

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
	headers: {
		"Content-Type": "application/json",
	},
});

// Request interceptor for logging and authentication
apiClient.interceptors.request.use(
	(config) => {
		// Add auth token if available
		const token = localStorage.getItem("auth_token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
	(response: AxiosResponse) => {
		return response;
	},
	(error) => {
		// Handle common errors
		if (error.response?.status === 401) {
			// Handle unauthorized access
			localStorage.removeItem("auth_token");
			window.location.href = "/login";
		}

		// Log error for debugging
		console.error("API Error:", error.response?.data || error.message);

		return Promise.reject(error);
	},
);

// API Methods
export const api = {
	// Hello world endpoint
	hello: async (): Promise<HelloWorldResponse> => {
		const response = await apiClient.get<HelloWorldResponse>("/");
		return response.data;
	},

	// Health endpoint
	health: async (): Promise<HealthResponse> => {
		const response = await apiClient.get<HealthResponse>("/health");
		return response.data;
	},

	// Logs endpoints
	logs: {
		getAll: async (): Promise<LogsResponse> => {
			const response = await apiClient.get<LogsResponse>("/logs");
			return response.data;
		},
	},

	// Alerts endpoints
	alerts: {
		getAll: async (): Promise<AlertsResponse> => {
			const response = await apiClient.get<AlertsResponse>("/alerts");
			return response.data;
		},
	},
};

// Export the axios instance for custom requests
export { apiClient };
