import { socket } from "~/utilities/socket";

export const is_client =
  typeof window !== "undefined" && !(window as any).is_fake;
