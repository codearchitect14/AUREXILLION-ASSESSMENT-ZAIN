import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TicketListPage from "../pages/TicketListPage";
import { ToastProvider } from "../components/Toast";
import type { Ticket } from "../types";

const tickets: Ticket[] = [
  {
    id: 1,
    title: "Unable to complete payment",
    description: "Error after submitting the payment form.",
    customerName: "Jane Smith",
    customerEmail: "jane@example.com",
    status: "open",
    priority: "high",
    createdAt: "2026-07-10T10:30:00.000Z",
  },
  {
    id: 2,
    title: "Password reset email not arriving",
    description: "Reset email never arrives.",
    customerName: "Carlos Rivera",
    customerEmail: "carlos@example.com",
    status: "in_progress",
    priority: "medium",
    createdAt: "2026-07-09T14:05:00.000Z",
  },
];

function renderPage() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <TicketListPage />
      </MemoryRouter>
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("TicketListPage", () => {
  it("renders tickets returned by the API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(tickets), { status: 200 })
    );

    renderPage();

    expect(screen.getByText(/loading tickets/i)).toBeInTheDocument();

    expect(await screen.findByText("Unable to complete payment")).toBeInTheDocument();
    expect(screen.getByText("Password reset email not arriving")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Carlos Rivera")).toBeInTheDocument();
  });

  it("shows an empty state when there are no tickets", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    );

    renderPage();

    expect(await screen.findByText(/no tickets yet/i)).toBeInTheDocument();
  });

  it("shows an error state when the API is unreachable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    renderPage();

    expect(await screen.findByText(/could not load tickets/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
