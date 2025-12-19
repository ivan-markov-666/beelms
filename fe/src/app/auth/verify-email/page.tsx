import { Suspense } from "react";
import { VerifyEmailContent } from "./_components/verify-email-content";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
