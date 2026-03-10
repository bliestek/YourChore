"use client";

import { useState, useCallback } from "react";

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function useFetch<T>() {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (url: string, options?: RequestInit): Promise<T | null> => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await fetch(url, {
          headers: { "Content-Type": "application/json", ...options?.headers },
          ...options,
        });
        const json = await res.json();
        if (!res.ok) {
          setState({ data: null, loading: false, error: json.error || "Request failed" });
          return null;
        }
        setState({ data: json, loading: false, error: null });
        return json;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Request failed";
        setState({ data: null, loading: false, error: msg });
        return null;
      }
    },
    []
  );

  return { ...state, execute };
}

// Simple helper for API calls
export async function api<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
    });
    const json = await res.json();
    if (!res.ok) {
      return { data: null, error: json.error || "Request failed" };
    }
    return { data: json as T, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Request failed" };
  }
}
