import { SiteHeader } from '@/components/shared/site-header';

// Layout for authentication routes: the same sticky brand bar as everywhere
// else, in logged-out form, above the centered card.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader loggedIn={false} />
      <div className="relative flex flex-1 flex-col">{children}</div>
    </div>
  );
}
