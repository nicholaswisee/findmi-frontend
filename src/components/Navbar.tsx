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
      base.unshift({ path: "/admin", label: "Admin", icon: null });
    }
    return base;
  }, [isAuthenticated, user]);

  return (
    <div className="h-fit sticky top-0 w-full z-50 p-2 drop-shadow-2xl">
      <img
        src="/global/background-plain-ungu.webp"
        className="absolute inset-0 w-full h-full object-cover -z-10 pointer-events-none"
        alt="Background Image"
      />
      <header className="z-50 flex gap-3 justify-center items-center">
        <img className="h-12" src="/global/Logo.png" alt="AMI 2026" />
        <Link to={"/"}>
          <h4 className="text-center mt-2">FINDMI 2026</h4>
        </Link>
      </header>
      <nav className="place-self-end">
        <ul className="flex gap-4 items-center">
          {links.map((link) => (
            <li key={link.path}>
              {link.path === "/login" ? (
                <Button
                  type="button"
                  variant="default"
                  className="bg-[#5f92e0] hover:bg-[#76abe8]  text-[#ffeabb] rounded-full"
                >
                  <Link className="font-semibold px-2" to={link.path}>
                    {link.label}
                  </Link>
                </Button>
              ) : (
                <Link className="font-semibold" to={link.path}>
                  {link.icon ? link.icon : link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
