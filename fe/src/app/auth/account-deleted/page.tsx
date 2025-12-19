import { Suspense } from "react";
import { AccountDeletedContent } from "./_components/account-deleted-content";

export default function AccountDeletedPage() {
  return (
    <Suspense fallback={null}>
      <AccountDeletedContent />
    </Suspense>
  );
}
