import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#050505] p-6">
      <SignUp />
    </div>
  );
}
