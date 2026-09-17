import Link from "next/link";
import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  title?: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
};

export function Card({
  children,
  title,
  href,
  hrefLabel = "Ouvrir",
  className = "",
}: CardProps) {
  return (
    <section
      className={`rounded-lg border border-lumio-blue-light/20 bg-white/[0.02] p-6 ${className}`.trim()}
    >
      {title ? (
        <h2 className="mb-2 text-lg font-medium text-lumio-white">{title}</h2>
      ) : null}

      <div className="text-sm leading-relaxed text-lumio-white/70">
        {children}
      </div>

      {href ? (
        <p className="mt-4">
          <Link
            href={href}
            className="text-sm font-medium text-lumio-blue-light hover:underline"
          >
            {hrefLabel}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
