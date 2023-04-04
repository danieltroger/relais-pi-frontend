import { createMemo, For } from "solid-js";
import { get_backend_synced_signal } from "~/utilities/get_backend_synced_signal";
import { socket } from "~/utilities/socket";
import { catchify, random_string } from "@depict-ai/utilishared";
import { GPIOObj } from "~/routes/gpio";
import {
  createTheme,
  FormControlLabel,
  Switch,
  ThemeProvider,
  List,
  ListItem,
} from "@suid/material";

export function HardcodedToggles() {
  const [get_gpio] = get_backend_synced_signal<GPIOObj, true>("gpio", {
    inputs: {},
    outputs: {},
  });
  const outputs = createMemo(() => get_gpio()["outputs"]);
  const switches = createMemo(() => Object.keys(outputs()));
  const theme = createTheme({
    palette: {
      mode: "dark",
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <div class="toggles">
        <List>
          <For each={switches()}>
            {(switch_key) => {
              const value = createMemo(() => outputs()[switch_key]);

              return (
                <ListItem>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={value() === 0}
                        onChange={
                          catchify(
                            async (event: MouseEvent, value: boolean) => {
                              const [result] = (await socket?.ensure_sent({
                                id: random_string(),
                                command: "write-gpio",
                                value: {
                                  output: switch_key,
                                  new_state: value ? 0 : 1,
                                },
                              })) as any;

                              console.log("set gpio result", result);
                            }
                          ) as any
                        }
                        inputProps={{ "aria-label": "controlled" }}
                      />
                    }
                    label={switch_key}
                  />
                </ListItem>
              );
            }}
          </For>
        </List>
      </div>
    </ThemeProvider>
  );
}
