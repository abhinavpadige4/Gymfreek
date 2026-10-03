import { AuthPromo } from '@/components/auth/auth-promo';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <main className="relative flex flex-1 flex-col justify-center overflow-x-hidden px-4 py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(22_92%_49%/0.08),transparent_65%)]"
      />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_minmax(0,30rem)]">
        <AuthPromo variant="login" />
        <div className="mx-auto w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
