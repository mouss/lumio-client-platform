import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESSION, jetonValide } from "@/lib/session";
import { seDeconnecter } from "../login/actions";

/*
  Protection de tout l'espace /admin, sauf /admin/login qui vit hors de ce groupe de routes.
  Controle fait en runtime Node, au meme endroit que la verification du mot de passe au login :
  les deux lisent ADMIN_PASSWORD de la meme facon, donc pas de desynchronisation possible
  apres un changement de mot de passe sans reconstruction.
*/
export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const magasin = await cookies();
  const jeton = magasin.get(COOKIE_SESSION)?.value;

  if (!(await jetonValide(jeton))) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-lumio-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-6">
            <Link
              href="/admin"
              className="text-sm font-medium uppercase tracking-widest text-lumio-blue-light"
            >
              Lumio Digital
            </Link>
            <nav className="flex gap-4 text-sm text-lumio-white/60">
              <Link href="/admin" className="hover:text-lumio-white">
                Clients
              </Link>
              <Link href="/admin/clients/nouveau" className="hover:text-lumio-white">
                Nouveau client
              </Link>
            </nav>
          </div>

          <form action={seDeconnecter}>
            <button
              type="submit"
              className="text-sm text-lumio-white/50 hover:text-lumio-white"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </header>

      {children}
    </div>
  );
}
