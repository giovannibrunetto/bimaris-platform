import type { Metadata } from "next";
import { privateRobotsMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  robots: privateRobotsMetadata,
};

export default function ProfiloLayout({children}:{children:React.ReactNode}){
 return children;
}
