// Middleware always redirects "/" to /login or /{role} before this renders;
// this is just a safety net in case it ever falls through.
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      Redirecting…
    </main>
  );
}
