import axios from "axios";
import type { ApiEnvelope, JsonValue } from "../types";

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? "", headers: { "Content-Type": "application/json" }, timeout: 15_000 });

export async function calculate<T extends Record<string, JsonValue>>(endpoint: string, body: Record<string, JsonValue>): Promise<ApiEnvelope<T>> {
  try {
    const response = await api.post<ApiEnvelope<T>>(endpoint, body);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.error?.detail ?? error.response?.data?.detail;
      throw new Error(typeof detail === "string" ? detail : "We could not complete that calculation. Check your inputs and try again.");
    }
    throw error;
  }
}
