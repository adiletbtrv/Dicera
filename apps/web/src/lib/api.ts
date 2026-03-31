import { z } from 'zod';
import { env } from '../env.js';
const BASE_URL = env.VITE_API_URL;
class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  loadToken() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`, window.location.origin);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : null,
    });

    if (response.status === 204) return undefined as T;

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(response.status, data.error ?? 'Request failed', data.code);
    }

    return data as T;
  }

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>) {
    return this.request<T>('GET', path, undefined, params);
  }

  post<T, Req = unknown>(path: string, body?: Req, schema?: z.ZodType<Req, any, any>) {
    const parsedBody = body !== undefined && schema ? schema.parse(body) : body;
    return this.request<T>('POST', path, parsedBody);
  }

  patch<T, Req = unknown>(path: string, body?: Req, schema?: z.ZodType<Req, any, any>) {
    const parsedBody = body !== undefined && schema ? schema.parse(body) : body;
    return this.request<T>('PATCH', path, parsedBody);
  }

  delete<T = void>(path: string) {
    return this.request<T>('DELETE', path);
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = new ApiClient();
api.loadToken();
