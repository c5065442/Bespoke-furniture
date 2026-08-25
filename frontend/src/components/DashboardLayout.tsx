import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Orders", end: true },
  { to: "/dashboard/delivery-planning", label: "Delivery Planning" },
  { to: "/dashboard/customers", label: "Customers" },
  { to: "/dashboard/products", label: "Products" },
];

export function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            {link.label}
          </NavLink>
        ))}
      </aside>
      <div className="dashboard-content">
        <Outlet />
      </div>
    </div>
  );
}
