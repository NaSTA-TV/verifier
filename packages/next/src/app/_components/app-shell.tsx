"use client";

import {
  AppShell,
  Badge,
  Burger,
  Group,
  HoverCard,
  NavLink,
  Text,
} from "@mantine/core";
import { useClipboard, useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useWebsocket } from "@repo/lib/socket/client";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ReactNode } from "react";

export function AppLayout(props: { children: ReactNode }) {
  const pathname = usePathname();

  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure();

  const queryClient = useQueryClient();

  const session = useSession();

  const { socket, isConnected, transport } = useWebsocket();

  const clipboard = useClipboard();

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: "sm",
          collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
        }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md">
            <Burger
              hiddenFrom="sm"
              onClick={toggleMobile}
              opened={mobileOpened}
              size="sm"
            />
            <Burger
              onClick={toggleDesktop}
              opened={desktopOpened}
              size="sm"
              visibleFrom="sm"
            />
            <Text>
              {session.status === "authenticated" && session.data.user.name}
            </Text>
            <Group ml={"auto"}>
              <HoverCard>
                <HoverCard.Target>
                  <Badge color={isConnected ? "green" : "red"}>
                    <Text size="xs">
                      {isConnected ? "Connected" : "Not Connected"}
                    </Text>
                  </Badge>
                </HoverCard.Target>
                <HoverCard.Dropdown>
                  <Group>
                    <Text>Socket connected:</Text>
                    <Text ml={"auto"}>{`${isConnected.valueOf()}`}</Text>
                  </Group>
                  <Group>
                    <Text>Transport:</Text>
                    <Text ml={"auto"}>{transport}</Text>
                  </Group>
                  <Group>
                    <Text>Socket ID:</Text>
                    <Text
                      c={clipboard.copied ? "green" : ""}
                      ml={"auto"}
                      onClick={() => {
                        clipboard.copy(socket.id);
                        notifications.show({
                          message: "Copied!",
                          autoClose: 2000,
                        });
                      }}
                      style={{
                        cursor: "pointer",
                      }}
                    >
                      {socket.id}
                    </Text>
                  </Group>
                </HoverCard.Dropdown>
              </HoverCard>
            </Group>
          </Group>
        </AppShell.Header>
        <AppShell.Navbar p="md">
          <NavLink
            active={pathname === "/"}
            component={Link}
            href={"/"}
            label={"Home"}
          />
          {/* <NavLink
						active={pathname === "/events"}
						component={Link}
						href={"/events"}
						label={"Events"}
					/> */}
        </AppShell.Navbar>
        <AppShell.Main>{props.children}</AppShell.Main>
      </AppShell>
    </QueryClientProvider>
  );
}
