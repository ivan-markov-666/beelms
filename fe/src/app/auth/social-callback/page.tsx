import { Suspense } from "react";
import { SocialCallbackContent } from "./_components/social-callback-content";

export default function SocialCallbackPage() {
  return (
    <Suspense fallback={null}>
      <SocialCallbackContent />
    </Suspense>
  );
}
