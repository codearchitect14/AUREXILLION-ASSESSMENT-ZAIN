import { Link, Navigate, NavLink, Outlet, Route, Routes } from "react-router-dom";
import TicketListPage from "./pages/TicketListPage";
import TicketDetailsPage from "./pages/TicketDetailsPage";
import CreateTicketPage from "./pages/CreateTicketPage";
import BoardPage from "./pages/BoardPage";
import LoginPage from "./pages/LoginPage";
import { ToastProvider } from "./components/Toast";
import { AuthProvider, useAuth } from "./auth";

function RequireAuth() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="app-logo">
          Support Tickets
        </Link>
        {user && (
          <nav className="app-nav">
            <NavLink to="/" end>
              List
            </NavLink>
            <NavLink to="/board">Board</NavLink>
            <Link to="/new" className="btn btn-primary">
              New Ticket
            </Link>
            <span className="app-user" title={user.email}>
              {user.name}
            </span>
            <button className="btn" onClick={logout}>
              Log out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/" element={<TicketListPage />} />
              <Route path="/board" element={<BoardPage />} />
              <Route path="/new" element={<CreateTicketPage />} />
              <Route path="/tickets/:id" element={<TicketDetailsPage />} />
            </Route>
            <Route path="*" element={<p className="state-message">Page not found.</p>} />
          </Routes>
        </main>
      </ToastProvider>
    </AuthProvider>
  );
}
