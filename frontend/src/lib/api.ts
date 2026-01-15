import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Automatically add auth token to all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface Document {
    id: string;
    title: string;  // Changed from 'name' to match backend
    file_type: string;  // Changed from 'type' to match backend
    status: 'processing' | 'ready' | 'error';
    created_at: string;  // Changed from 'uploaded_at' to match backend
    pages?: number;
    summary?: string;
    file_path?: string;  // Changed from 'url' to match backend
    content_text?: string;
}

export interface SearchResult {
    id: string;
    document_id: string;
    title: string;
    snippet: string;
    source: string;
    page?: number;
    relevance: number;
}

export const endpoints = {
    // Documents
    uploadDocument: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<Document>('/documents/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    getDocuments: async () => {
        const response = await api.get<Document[]>('/documents/');
        return response.data;
    },

    getDocument: async (id: string) => {
        const response = await api.get<Document>(`/documents/${id}`);
        return response.data;
    },

    // RAG Search/Simplify
    search: async (query: string) => {
        const response = await api.post<SearchResult[]>('/documents/search', { query });
        return response.data;
    },

    chatDocument: async (docId: string, query: string) => {
        const response = await api.post<{ answer: string }>(`/documents/${docId}/chat`, { query });
        return response.data;
    },

    simplify: async (text: string) => {
        const response = await api.post<{ simplified_text: string }>('/documents/simplify', { text });
        return response.data;
    },

    // --- Forms ---
    autofillForm: async (formId: string, fields: any[]) => {
        const response = await api.post('/forms/autofill', { form_id: formId, fields });
        return response.data;
    },

    submitForm: async (formId: string, data: any) => {
        const response = await api.post('/forms/submit', { form_id: formId, data });
        return response.data;
    },

    // --- Transcriptions ---
    transcribe: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<any>('/transcribe/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },


    // Forms - Handled by new methods above
};
