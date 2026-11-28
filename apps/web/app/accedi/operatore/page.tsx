import AccessGateway from "../AccessGateway";
import { getOperatorDestination } from "../operator-destination";

export default async function OperatorAccessPage({ searchParams }: {
  searchParams: Promise<{ next?: string }>;
}) {
  const destination = getOperatorDestination((await searchParams).next) ?? "/area-operatore";
  return <AccessGateway operatorDestination={destination} />;
}
