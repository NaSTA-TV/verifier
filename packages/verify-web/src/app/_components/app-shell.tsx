"use client";

import { AppShell } from "@mantine/core";
import type { ReactNode } from "react";

export function AppLayout(props: { children: ReactNode }) {
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Main>{props.children}</AppShell.Main>
    </AppShell>
  );
}
