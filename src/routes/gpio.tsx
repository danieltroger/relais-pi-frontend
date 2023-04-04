import { Title } from "solid-start";
import { createMemo, For, getOwner, Show, untrack } from "solid-js";
import { socket } from "~/utilities/socket";
import { random_string } from "@depict-ai/utilishared";
import { show_toast_with_message } from "~/utilities/show_toast_with_message";
import { get_backend_synced_signal } from "~/utilities/get_backend_synced_signal";

export type GPIOObj = {
  inputs: { [p: string]: 0 | 1 };
  outputs: { [p: string]: 0 | 1 };
};

export default function GPIO() {
  const [inputs] = get_backend_synced_signal<GPIOObj, true>("gpio", {
    inputs: {},
    outputs: {},
  });
  const keys_l1 = createMemo(() => Object.keys(inputs()));

  return (
    <main>
      <Title>GPIO</Title>
      <h1>GPIO</h1>
      <div class="gpio">
        <For each={keys_l1() as any}>
          {(key: "inputs" | "outputs") => {
            const things = createMemo(() => inputs()[key]);
            const keys = createMemo(() => Object.keys(things()));
            const is_outputs = key === "outputs";

            return (
              <div class="io_section" classList={{ [key]: true }}>
                <table>
                  <tbody>
                    <tr>
                      <th>Key</th>
                      <th>Value</th>
                    </tr>
                    <For each={keys()}>
                      {(io_key) => {
                        const value = createMemo(() => things()[io_key]);
                        const owner = getOwner()!;

                        return (
                          <tr>
                            <td>{io_key}</td>
                            <td
                              onClick={async () => {
                                if (!is_outputs) {
                                  return;
                                }
                                const target_value =
                                  untrack(value) === 0 ? 1 : 0;

                                const [result, result_json] =
                                  (await socket?.ensure_sent({
                                    id: random_string(),
                                    command: "write-gpio",
                                    value: {
                                      output: io_key,
                                      new_state: target_value,
                                    },
                                  })) as any;

                                console.log("set gpio result", result);
                                const status = result?.status;

                                await show_toast_with_message(owner, () =>
                                  status === "ok"
                                    ? "Successfully set " +
                                      io_key +
                                      " to " +
                                      target_value
                                    : result_json
                                );
                              }}
                            >
                              {value()}
                            </td>
                          </tr>
                        );
                      }}
                    </For>
                  </tbody>
                </table>
                <Show when={is_outputs}>
                  <span class="hint">Click value to toggle</span>
                </Show>
                <h2>{key}</h2>
              </div>
            );
          }}
        </For>
      </div>
    </main>
  );
}
