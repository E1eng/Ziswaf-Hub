import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-lg">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">Z</span>
            </div>
            ZISWAF Hub
          </Link>
          <h1 className="text-2xl font-bold">Masuk</h1>
          <p className="text-sm text-muted-foreground">
            Masuk ke dashboard lembaga Anda
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Daftar Lembaga
          </Link>
        </p>
      </div>
    </div>
  );
}
