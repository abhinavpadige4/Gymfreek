import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(22_92%_49%/0.08),transparent_65%)]"
      />
      <div className="relative w-full max-w-sm">
        <LoginForm />
      </div>
    </main>
  );
}
