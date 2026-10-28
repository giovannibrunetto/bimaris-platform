import {redirect} from "next/navigation";

export const dynamic = "force-dynamic";

export default function LegacyB2BNetworkPage() {
  redirect("/area-operatore/network-b2b");
}
