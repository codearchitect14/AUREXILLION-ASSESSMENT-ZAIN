import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CreateTicketPage from "../pages/CreateTicketPage";
import { ToastProvider } from "../components/Toast";

function renderPage() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <CreateTicketPage />
      </MemoryRouter>
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("CreateTicketPage form validation", () => {
  it("shows validation errors for empty required fields and does not call the API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: /create ticket/i }));

    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Description is required.")).toBeInTheDocument();
    expect(screen.getByText("Customer name is required.")).toBeInTheDocument();
    expect(screen.getByText("Customer email is required.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows an error for an invalid email format", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderPage();

    await userEvent.type(screen.getByLabelText(/title/i), "Payment fails");
    await userEvent.type(screen.getByLabelText(/description/i), "Error on checkout.");
    await userEvent.type(screen.getByLabelText(/customer name/i), "Jane Smith");
    await userEvent.type(screen.getByLabelText(/customer email/i), "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: /create ticket/i }));

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("submits a valid ticket to the API", async () => {
    const createdTicket = {
      id: 42,
      title: "Payment fails",
      description: "Error on checkout.",
      customerName: "Jane Smith",
      customerEmail: "jane@example.com",
      status: "open",
      priority: "high",
      createdAt: "2026-07-13T12:00:00.000Z",
    };
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(createdTicket), { status: 201 }));

    renderPage();

    await userEvent.type(screen.getByLabelText(/title/i), "Payment fails");
    await userEvent.type(screen.getByLabelText(/description/i), "Error on checkout.");
    await userEvent.type(screen.getByLabelText(/customer name/i), "Jane Smith");
    await userEvent.type(screen.getByLabelText(/customer email/i), "jane@example.com");
    await userEvent.selectOptions(screen.getByLabelText(/priority/i), "high");
    await userEvent.click(screen.getByRole("button", { name: /create ticket/i }));

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/tickets",
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({
      title: "Payment fails",
      description: "Error on checkout.",
      customerName: "Jane Smith",
      customerEmail: "jane@example.com",
      priority: "high",
    });
  });
});
