import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary";
  className?: string;
};

const BASE =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors";

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-lumio-blue-light text-lumio-black hover:bg-lumio-blue hover:text-lumio-white",
  secondary:
    "border border-lumio-blue-light/40 text-lumio-blue-light hover:border-lumio-blue-light hover:bg-lumio-blue-light/10",
};

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes}>
      {children}
    </button>
  );
}
