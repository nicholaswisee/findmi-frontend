import { Link } from "react-router-dom";

const navLinks = [
  { path: "/", label: "Home" },
  { path: "/catalog", label: "Catalog" },
  { path: "/cart", label: "Cart" },
  { path: "/checkout", label: "Checkout" },
  { path: "/auth", label: "Login" },
  { path: "/profile", label: "Profile" },
  { path: "/profile/history", label: "Order History" },
];

export default function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        gap: "1rem",
        padding: "1rem",
        background: "#f4f4f4",
      }}
    >
      {navLinks.map((link) => (
        <Link key={link.path} to={link.path}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
