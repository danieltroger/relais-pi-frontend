import { is_client } from "~/utilities/is_client";
import { Accessor, createSignal, getOwner, onCleanup, Signal } from "solid-js";
import { socket } from "~/utilities/socket";
import { random_string } from "@depict-ai/utilishared";
import { show_toast_with_message } from "~/utilities/show_toast_with_message";

export function get_backend_synced_signal<
  T,
  default_value_was_provided extends boolean = false
>(key: string, default_value?: T) {
  const signal = createSignal<T>(default_value!);
  if (!is_client) {
    return signal as default_value_was_provided extends true
      ? Signal<T>
      : Signal<T | undefined>;
  }

  const [get_value, set_actual_signal] = signal;
  const owner = getOwner()!;
  const message_handler = ({ data }: MessageEvent) => {
    const decoded = JSON.parse(data);
    if (decoded.type === "change" && decoded.key === key) {
      set_actual_signal(decoded.value);
    }
  };
  socket?.addEventListener("message", message_handler as any);
  onCleanup(() =>
    socket?.removeEventListener("message", message_handler as any)
  );

  (async () => {
    const [response, response_json] = (await socket?.ensure_sent({
      id: random_string(),
      command: "read",
      key,
    })) as [
      {
        id: string;
        status: "ok" | "not-ok";
        value: any;
      },
      string
    ];
    if (response.status === "ok") {
      set_actual_signal(response.value);
    } else {
      console.error(response);
      await show_toast_with_message(
        owner,
        () => `Error reading ${key}: ${response_json}`
      );
    }
  })();

  return [
    get_value as default_value_was_provided extends true
      ? Accessor<T>
      : Accessor<T | undefined>,
    async (new_value: T) => {
      set_actual_signal(() => new_value); // set the signal immediately, since that's what's expected of a signal and we kind of want to emulate that
      try {
        const [response] = (await socket?.ensure_sent({
          id: random_string(),
          command: "write",
          key,
          value: new_value,
        })) as [
          {
            id: string;
            status: "ok" | "not-ok";
            value: any;
            message?: string;
          },
          string
        ];
        if (response.status === "ok") {
          return true;
        }
        console.error(response);
        throw response.message;
      } catch (e) {
        console.error(e);
        await show_toast_with_message(
          owner,
          () => `Error writing ${key}: ${e}`
        );
      }
      return false;
    },
  ] as const;
}
