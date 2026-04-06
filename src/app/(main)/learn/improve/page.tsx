import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { ModuleShell } from "@/components/ModuleShell";
import { Button } from "@/components/ui/button";
import { getDb, schema } from "../../../../../db/index";
import { buildLearningModesPayload } from "@/lib/workshop-mastery";
import { WORKSHOP_LABELS } from "@/lib/workshop-copy";

const { userModuleProgress, userProfiles } = schema;

export default async function LearnImprovePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const db = getDb();
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, userId))
    .limit(1);

  if (!profile) {
    redirect("/sign-in");
  }

  const pathRows = await db
    .select({
      moduleId: userModuleProgress.moduleId,
      status: userModuleProgress.status,
    })
    .from(userModuleProgress)
    .where(eq(userModuleProgress.userProfileId, profile.id));

  const completedModuleIds = new Set(
    pathRows.filter((r) => r.status === "completed").map((r) => r.moduleId),
  );

  const learningModes = await buildLearningModesPayload(
    db,
    profile.id,
    completedModuleIds,
  );

  return (
    <ModuleShell>
      <div className="mx-auto max-w-2xl space-y-8 p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {WORKSHOP_LABELS.improveQueue}
          </h1>
          <p className="text-sm text-muted-foreground">{WORKSHOP_LABELS.improveQueueHint}</p>
        </div>

        {learningModes.improveItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing to strengthen right now — take a module quiz first, and we&apos;ll queue
            concepts that need another pass.
          </p>
        ) : (
          <ul className="divide-y divide-border/30 border border-border/30 rounded-lg overflow-hidden">
            {learningModes.improveItems.map((it) => (
              <li key={it.conceptId}>
                <Link
                  href={it.href}
                  className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-white/5 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{it.conceptTitle}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{it.moduleId}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Button asChild variant="outline" className="rounded-none">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </ModuleShell>
  );
}
