import type { Metadata } from "next";
import { privateRobotsMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  robots: privateRobotsMetadata,
};

export default function AccediLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
