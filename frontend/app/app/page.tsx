import type { Metadata } from "next";

import { InspectionWorkspace } from "./InspectionWorkspace";

export const metadata: Metadata = {
  title: "New inspection — SiteSight",
  description: "Upload workplace media and review a structured 5S action log.",
};

export default function InspectionPage() {
  return <InspectionWorkspace />;
}
