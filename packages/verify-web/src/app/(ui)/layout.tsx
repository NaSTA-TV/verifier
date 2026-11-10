import "@/styles/globals.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import type { Metadata } from "next";
import { AppLayout } from "@/app/_components/app-shell";

export const metadata: Metadata = {
  title: "NaSTA Verifier",
  description: "Hopefully making submissions easier",
  // icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <link rel="icon" href="/nasta-black.png" type="image/png" />
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto">
          <ModalsProvider>
            <AppLayout>{children}</AppLayout>
            <Notifications />
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
