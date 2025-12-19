import { Suspense } from "react";
import { AdminHomeContent } from "./_components/admin-home-content";

export default function AdminHomePage() {
  return (
    <Suspense fallback={null}>
      <AdminHomeContent />
    </Suspense>
  );
}
