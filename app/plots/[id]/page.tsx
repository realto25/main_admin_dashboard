// app/plots/[id]/page.tsx
import { Suspense } from "react";
import ProjectDetailClient from "./ProjectDetailClient";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const projectId = params.id;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectDetailClient projectId={projectId} />
    </Suspense>
  );
}
