import { Suspense } from "react";
import { RegisterContent } from "./_components/register-content";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
