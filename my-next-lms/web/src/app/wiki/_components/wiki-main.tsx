import type { ReactNode } from "react";

type WikiMainProps = {
  children: ReactNode;
};

export function WikiMain({ children }: WikiMainProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10">
      {children}
    </main>
  );
}
