import { RequireSignedIn } from "@/components/RequireSignedIn";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireSignedIn>{children}</RequireSignedIn>;
}
