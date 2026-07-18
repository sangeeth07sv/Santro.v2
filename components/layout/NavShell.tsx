import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { getCurrentUser } from "@/actions/auth";
import { getCart } from "@/actions/cart";

export async function NavShell() {
  const [auth, { items }] = await Promise.all([getCurrentUser(), getCart()]);
  const cartCount = items.reduce((n: number, i: any) => n + i.quantity, 0);

  return (
    <>
      <Navbar
        isLoggedIn={!!auth}
        isAdmin={auth?.profile?.role === "admin"}
        role={auth?.profile?.role}
        cartCount={cartCount}
      />
      <BottomNav isLoggedIn={!!auth} role={auth?.profile?.role} cartCount={cartCount} />
    </>
  );
}

/** Static fallback shown instantly while NavShell resolves — same height, no layout shift. */
export function NavShellSkeleton() {
  return (
    <header className="sticky top-0 z-40 bg-indigo-800">
      <div className="mx-auto flex max-w-7xl items-center px-4 py-3">
        <span className="font-display text-xl font-bold tracking-tight text-white">SANTRO</span>
      </div>
    </header>
  );
}
