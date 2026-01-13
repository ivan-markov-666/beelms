import { Suspense } from "react";
import { TwoFactorContent } from "./_components/two-factor-content";

export default function TwoFactorPage() {
  return (
    <Suspense fallback={null}>
      <TwoFactorContent />
    </Suspense>
  );
}
