import {
  createMemo,
  createSignal,
  For,
  getOwner,
  JSX as solid_JSX,
  runWithOwner,
} from "solid-js";
import { get_backend_synced_signal } from "~/utilities/get_backend_synced_signal";
import { socket } from "~/utilities/socket";
import { catchify, random_string } from "@depict-ai/utilishared";
import { GPIOObj } from "~/routes/gpio";
import {
  createTheme,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  Switch,
  ThemeProvider,
} from "@suid/material";
import { Schedule } from "@suid/icons-material";
import { Scheduler } from "~/components/scheduler";

export type Config = {
  non_reactive_gpio_state_to_persist_program_restarts: { [key: string]: 0 | 1 }; // We could type this properly to the GPIO outputs but that could risk trouble with recursive imports
  schedules: {
    [key: string]: {
      start_time: {
        hour: number;
        minute: number;
      };
      end_time: {
        hour: number;
        minute: number;
      };
    }[];
  };
}; // copy-pasted from backend code

export default function HardcodedToggles() {
  const [get_gpio] = get_backend_synced_signal<GPIOObj, true>("gpio", {
    inputs: {},
    outputs: {},
  });
  const [get_config, set_config] = get_backend_synced_signal<Config>("config");
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
              const owner = getOwner()!;
              const value = createMemo(() => outputs()[switch_key]);
              const [get_extra_list_item, set_extra_list_item] =
                createSignal<solid_JSX.Element>();

              return [
                <ListItem
                  secondaryAction={
                    <IconButton
                      aria-label="schedule"
                      onClick={catchify(() => {
                        if (get_extra_list_item()) {
                          // TODO: prompt if sure to discard changes if changing
                          set_extra_list_item();
                        } else {
                          runWithOwner(owner, () =>
                            set_extra_list_item(
                              <ListItem>
                                <Scheduler
                                  switch_key={switch_key}
                                  set_config={set_config}
                                  get_config={get_config}
                                />
                              </ListItem>
                            )
                          );
                        }
                      })}
                    >
                      <Schedule />
                    </IconButton>
                  }
                >
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
                </ListItem>,
                get_extra_list_item,
              ] as solid_JSX.Element;
            }}
          </For>
        </List>
      </div>
    </ThemeProvider>
  );
}
