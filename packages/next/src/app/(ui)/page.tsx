"use client";

import { NoSSR } from "../_components/no-ssr";
import { Verify } from "./verify";

export default function Home() {
  return (
    <NoSSR>
      <Verify />
    </NoSSR>
  );
}
