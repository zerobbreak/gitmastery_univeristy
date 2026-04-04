import { ModuleShell } from "@/components/ModuleShell";
import { ModuleLessonView } from "@/components/ModuleLessonView";
import { assertLesson } from "@/lib/module-routes";

export default async function ModuleLessonPage({
  params,
}: {
  params: Promise<{ track: string; lesson: string }>;
}) {
  const { track, lesson } = await params;
  const { track: trackId, lesson: moduleDef } = assertLesson(track, lesson);

  return (
    <ModuleShell>
      <ModuleLessonView trackId={trackId} moduleDef={moduleDef} />
    </ModuleShell>
  );
}
