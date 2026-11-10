"use client";

import { AppShell, Group, Title } from "@mantine/core";
import type { ReactNode } from "react";

export function AppLayout(props: { children: ReactNode }) {
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md">
          <Title>NaSTA Submission Verifier</Title>
        </Group>
      </AppShell.Header>
      <AppShell.Main>{props.children}</AppShell.Main>
    </AppShell>
  );
}
