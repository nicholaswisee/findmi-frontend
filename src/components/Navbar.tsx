import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useAuthStore } from "../store/authStore";
import { ShoppingCart, UserRound } from "lucide-react";
import { Button } from "./ui/button";

export default function Navbar() {
  const { isAuthenticated, user } = useAuthStore();

  type NavLink = {
    path: string;
    label: string;
    icon: React.ReactNode | null;
  };

  const links = useMemo<NavLink[]>(() => {
    const base: NavLink[] = [
      { path: "/catalog", label: "Catalog", icon: null },
    ];

    if (isAuthenticated) {
      base.push({
        path: "/cart",
        label: "Cart",
        icon: <ShoppingCart className="size-4 md:size-5 lg:size-6 mt-1" />,
      });
      base.push({
        path: "/profile",
        label: "Profile",
        icon: <UserRound className="size-4 md:size-5 lg:size-6 mt-1" />,
      });
    } else {
      base.push({ path: "/login", label: "Login", icon: null });
    }

    if (user && user.role?.includes("admin")) {
      base.unshift({ path: "/dashboard", label: "Admin", icon: null });
    }
    return base;
  }, [isAuthenticated, user]);

  return (
    <header className="bg-gray-200 h-fit fixed top-0 w-full z-50 flex flex-col justify-between items-center py-2 px-4">
      <h5 className="text-center">
        <Link to={"/"}>FINDMI 2026</Link>
      </h5>
      <nav className="place-self-end">
        <ul className="flex gap-4 items-center">
          {links.map((link) => (
            <li key={link.path}>
              {link.path === "/login" ? (
                <Button type="button" variant="default">
                  <Link to={link.path}>{link.label}</Link>
                </Button>
              ) : (
                <Link to={link.path}>{link.icon ? link.icon : link.label}</Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
