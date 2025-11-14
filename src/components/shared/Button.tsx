import React from "react";
import { Link } from "react-router-dom";

export default function Button({
  url,
  onClick,
  variant,
  className,
  children,
}: {
  url?: string;
  onClick?: () => Promise<void>;
  variant: "blue" | "red";
  className?: string;
  children: React.ReactNode;
}) {
  if (url) {
    return (
      <Link
        to={url}
        className={
          (variant === "blue"
            ? "pt-1 pb-2 px-4 rounded-full text-[#ffeabb] bg-[#5f92e0] drop-shadow-lg transition hover:drop-shadow-[#1b165e]/30 drop-shadow-[#1b165e]/20 mb-2 font-semibold"
            : "pt-1 pb-2 px-4 rounded-full text-[#ffeabb] bg-[#c62d76] drop-shadow-lg transition hover:drop-shadow-[#1b165e]/30 drop-shadow-[#1b165e]/20 mb-2 font-semibold") +
          (className ? ` ${className}` : "")
        }
      >
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        (variant === "blue"
          ? "pt-1 pb-2 px-4 rounded-full text-[#ffeabb] bg-[#5f92e0] drop-shadow-lg transition hover:drop-shadow-[#1b165e]/30 drop-shadow-[#1b165e]/20 mb-2 font-semibold cursor-pointer"
          : "pt-1 pb-2 px-4 rounded-full text-[#ffeabb] bg-[#c62d76] drop-shadow-lg transition hover:drop-shadow-[#1b165e]/30 drop-shadow-[#1b165e]/20 mb-2 font-semibold cursor-pointer") +
        (className ? ` ${className}` : "")
      }
    >
      {children}
    </button>
  );
}
