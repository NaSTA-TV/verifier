"use client";

import { Button, Center, Group, Loader, Table } from "@mantine/core";
import { useSocketTriggeredFunction } from "@repo/lib/socket/client";
import Link from "next/link";
import { api } from "@/trpc/react";

export default function AdminPage() {
  const submissionsQuery = api.submissions.list.useQuery();

  useSocketTriggeredFunction("update:submissions", () =>
    submissionsQuery.refetch(),
  );

  if (!submissionsQuery.data)
    return (
      <Center>
        <Loader />
      </Center>
    );
  return (
    <Table striped>
      <Table.Thead>
        <Table.Tr>
          <Table.Td>Station</Table.Td>
          <Table.Td>Category</Table.Td>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {submissionsQuery.data.map((sub) => (
          <Table.Tr key={sub.id}>
            <Table.Td>{sub.station}</Table.Td>
            <Table.Td>
              <Group>
                {sub.categoryString}
                <Button
                  ml={"auto"}
                  component={Link}
                  href={`/admin/submissions/${sub.id}`}
                >
                  Go see it
                </Button>
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
