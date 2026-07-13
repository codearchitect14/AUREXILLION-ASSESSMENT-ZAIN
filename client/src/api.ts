import { clearStoredAuth, getStoredAuth, type StoredAuth } from "./authStorage";
import { appUrl } from "./config";
import type { NewTicket, Ticket, TicketPriority, TicketStatus } from "./types";

const BASE_URL = "/api/tickets";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let message = `Request failed with status ${res.status}`;
  try {
    const body = (await res.json()) as { error?: string };
    if (body.error) message = body.error;
  } catch {
    // response had no JSON body; keep the generic message
  }
  return new ApiError(message, res.status);
}

async function authedRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredAuth()?.token;
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...init, headers });

  if (res.status === 401) {
    // Session expired or token invalid: clear it and send the user to login.
    clearStoredAuth();
    window.location.assign(`${appUrl}/login`);
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

export async function loginRequest(email: string, password: string): Promise<StoredAuth> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as StoredAuth;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
}

export async function fetchTickets(filters: TicketFilters = {}): Promise<Ticket[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  const qs = params.toString();
  return authedRequest<Ticket[]>(qs ? `${BASE_URL}?${qs}` : BASE_URL);
}

export async function fetchTicket(id: number): Promise<Ticket> {
  return authedRequest<Ticket>(`${BASE_URL}/${id}`);
}

export async function createTicket(ticket: NewTicket): Promise<Ticket> {
  return authedRequest<Ticket>(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ticket),
  });
}

export async function updateTicketStatus(id: number, status: TicketStatus): Promise<Ticket> {
  return authedRequest<Ticket>(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
