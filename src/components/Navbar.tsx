import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useAuthStore } from "../store/authStore";

export default function Navbar() {
  const { isAuthenticated, user } = useAuthStore();

  const links = useMemo<{ path: string; label: string }[]>(() => {
    const base: { path: string; label: string }[] = [
      { path: "/", label: "Home" },
      { path: "/catalog", label: "Catalog" },
    ];

    if (isAuthenticated) {
      base.push({ path: "/cart", label: "Cart" });
      base.push({ path: "/profile", label: "Profile" });
    } else {
      base.push({ path: "/login", label: "Login" });
    }

    if (user && user.role?.includes("admin")) {
      base.push({ path: "/admin", label: "Admin" });
    }
    return base;
  }, [isAuthenticated]);

  return (
    <nav
      className={`flex gap-4 p-4 bg-white fixed top-0 w-full h-14 sm:h-16 md:h-18 lg:h-20`}
    >
      {links.map((link) => (
        <Link key={link.path} to={link.path}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
