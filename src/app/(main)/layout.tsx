import { RequireOnboardingComplete } from "@/components/RequireOnboardingComplete";
import { RequireSignedIn } from "@/components/RequireSignedIn";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireSignedIn>
      <RequireOnboardingComplete>{children}</RequireOnboardingComplete>
    </RequireSignedIn>
  );
}
