/** Typed axios client. Injects X-Device-Id on every request. */
import axios, { AxiosInstance } from "axios";
import Constants from "expo-constants";

import { peekDeviceId } from "./device";

const apiUrl =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://10.0.2.2:8000/api/v1";

export const api: AxiosInstance = axios.create({
  baseURL: apiUrl,
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const id = await peekDeviceId();
  if (id) {
    config.headers = config.headers ?? {};
    config.headers["X-Device-Id"] = id;
  }
  return config;
});

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const detail =
      (err.response?.data as { detail?: string } | undefined)?.detail ??
      err.message;
    return new ApiError(detail, status);
  }
  return new ApiError(String(err));
}
