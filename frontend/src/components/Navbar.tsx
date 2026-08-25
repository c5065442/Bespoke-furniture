import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Navbar() {
  const { user, isStaff, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Bespoke Furniture Creations</Link>
      </div>
      <div className="navbar-links">
        <Link to="/products">Products</Link>
        {isStaff && <Link to="/dashboard">Staff Dashboard</Link>}
        {user && !isStaff && <Link to="/my-orders">My Orders</Link>}
        {user ? (
          <>
            <span className="navbar-user">{user.first_name || user.username}</span>
            <button onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
