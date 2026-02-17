import type { Metadata } from "next";
import { auth, signIn } from "@/server/auth";

export const metadata: Metadata = {
  title: "Admin - NaSTA Verifier",
  description: "Super top secret page",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session) {
    return signIn();
  }

  return children;
}
