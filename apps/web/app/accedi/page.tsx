import { redirect } from "next/navigation";
import AccessGateway from "./AccessGateway";
import { getOperatorDestination } from "./operator-destination";

export default async function AccessPage({ searchParams }: {
  searchParams: Promise<{ next?: string }>;
}) {
  const destination = getOperatorDestination((await searchParams).next);
  if (destination) redirect(`/accedi/operatore?next=${encodeURIComponent(destination)}`);
  return <AccessGateway />;
}
