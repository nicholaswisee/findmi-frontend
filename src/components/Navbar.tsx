import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useAuthStore } from "../store/authStore";
import { ShoppingBasket, CircleUser } from "lucide-react";
import Button from "./shared/Button";

export default function Navbar() {
  const { isAuthenticated, user } = useAuthStore();

  type NavLink = {
    path: string;
    label: string;
    icon: React.ReactNode | React.HTMLElementType | null;
  };

  const links = useMemo<NavLink[]>(() => {
    const base: NavLink[] = [
      { path: "/catalog", label: "Catalog", icon: null },
    ];

    if (isAuthenticated) {
      base.push({
        path: "/cart",
        label: "Cart",
        icon: <ShoppingBasket className="size-5 md:size-6 lg:size-8 mt-1" />,
      });
      base.push({
        path: "/profile",
        label: "Profile",
        icon: (
          <div className=" border-2 border-[#ffd88c] bg-plain-green text-[#ffd88c] rounded-xl">
            <span className="flex items-center gap-2 py-2 px-4 bg-[#463b8b]/50 rounded-xl">
              <CircleUser className="size-5 md:size-6 lg:size-8 mt-1" />
              <p>Hi, {user?.name.trim().split(" ")[0]}</p>
            </span>
          </div>
        ),
      });
    } else {
      base.push({
        path: "/login",
        label: "Login",
        icon: null,
      });
    }

    if (user && user.role?.includes("admin")) {
      base.unshift({ path: "/dashboard", label: "Admin", icon: null });
    }
    return base;
  }, [isAuthenticated, user]);

  return (
    <div className="h-fit sticky top-0 w-full z-50 p-2 drop-shadow-2xl text-[#ffd88c]">
      <img
        src="/global/background-plain-ungu.webp"
        className="absolute inset-0 w-full h-full object-cover -z-10 pointer-events-none"
        alt="Background Image"
      />
      <header className="z-50 flex gap-3 justify-center items-center">
        <img className="h-12" src="/global/Logo.png" alt="AMI 2026" />
        <Link to={"/"}>
          <h4 className="text-center mt-2 ">FINDMI 2026</h4>
        </Link>
      </header>
      <nav className="place-self-end">
        <ul className="flex gap-4 items-center pb-1">
          {links.map((link) => (
            <li key={link.path}>
              {link.path === "/login" ? (
                <Button url={link.path} className="rounded-full" variant="blue">
                  {link.label}
                </Button>
              ) : (
                <Link className="font-semibold lead" to={link.path}>
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
