"use client";

import { useCreateSocket, WebsocketContext } from "@repo/lib/socket/client";
import type { ReactNode } from "react";

export function WebsocketProvider({ children }: { children: ReactNode }) {
  return (
    <WebsocketContext.Provider value={useCreateSocket()}>
      {children}
    </WebsocketContext.Provider>
  );
}
