"use client";

import { AppShell, Title } from "@mantine/core";
import type { ReactNode } from "react";

export function AppLayout(props: { children: ReactNode }) {
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Title>NaSTA Submission Verifier</Title>
      </AppShell.Header>
      <AppShell.Main>{props.children}</AppShell.Main>
    </AppShell>
  );
}
