import { useEffect } from "react";
import { useWebsocket } from "./context";

export function useSocketTriggeredFunction(
  path: string,
  func: (data?: unknown) => void,
) {
  const { socket } = useWebsocket();

  useEffect(() => {
    socket.on(path, func);

    return () => {
      socket.off(path, func);
    };
  });
}
