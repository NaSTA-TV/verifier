"use client";

import { Button, Center, Group, Loader, Table, Text } from "@mantine/core";
import Link from "next/link";
import { api } from "@/trpc/react";

export function PossibilitiesTable(props: { submissionId: string }) {
  const possibilitiesQuery = api.submissions.listPossibilities.useQuery({
    submissionId: props.submissionId,
  });

  if (!possibilitiesQuery.data)
    return (
      <Center>
        <Loader />
      </Center>
    );
  return (
    <Table striped>
      <Table.Thead>
        <Table.Tr>
          <Table.Td>File Name</Table.Td>
          <Table.Td>ID</Table.Td>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {possibilitiesQuery.data.map((poss) => (
          <Table.Tr key={poss.id}>
            <Table.Td>{poss.name}</Table.Td>
            <Table.Td>
              <Group>
                <Text c="dimmed">{poss.id}</Text>
                <Button ml={"auto"} disabled>
                  Confirm
                </Button>
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
