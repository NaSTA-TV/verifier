import { createContext, useContext } from "react";
import type { TSocket } from ".";

export const WebsocketContext = createContext<TSocket>(
  null as unknown as TSocket,
);

export function useWebsocket() {
  return useContext(WebsocketContext);
}
