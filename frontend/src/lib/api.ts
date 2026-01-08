import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Document {
    id: string;
    name: string;
    type: string;
    status: 'processing' | 'ready' | 'error';
    uploaded_at: string;
    pages?: number;
    summary?: string;
    url?: string;
}

export interface SearchResult {
    id: string;
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

    // Chat/Search
    search: async (query: string) => {
        const response = await api.get<SearchResult[]>('/chat/search', {
            params: { q: query },
        });
        return response.data;
    },

    simplify: async (text: string) => {
        const response = await api.post<{ simplified: string }>('/chat/simplify', null, {
            params: { text },
        });
        return response.data;
    },

    transcribe: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<any>('/transcribe/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // Forms
    autofillForm: async () => {
        // For demo, we might not send context, or send a dummy one
        const response = await api.post<Record<string, string>>('/forms/autofill', { context: "demo" });
        return response.data;
    },

    submitForm: async (data: any) => {
        const response = await api.post('/forms/submit', data);
        return response.data;
    }
};
