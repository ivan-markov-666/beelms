import { Suspense } from "react";
import { LoginContent } from "./_components/login-content";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
