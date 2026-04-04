import { notFound } from "next/navigation";

import { ModuleShell } from "@/components/ModuleShell";
import { ModuleTrackView } from "@/components/ModuleTrackView";
import { getTrack } from "@/lib/module-routes";

export default async function ModuleTrackPage({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track: trackParam } = await params;
  const track = getTrack(trackParam);
  if (!track) notFound();

  return (
    <ModuleShell>
      <ModuleTrackView track={track} />
    </ModuleShell>
  );
}
