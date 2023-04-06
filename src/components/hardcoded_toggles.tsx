import {
  Accessor,
  createComputed,
  createMemo,
  createSignal,
  For,
  getOwner,
  Index,
  JSX as solid_JSX,
  runWithOwner,
  Setter,
  Signal,
} from "solid-js";
import { get_backend_synced_signal } from "~/utilities/get_backend_synced_signal";
import { socket } from "~/utilities/socket";
import {
  catchify,
  make_random_classname,
  random_string,
} from "@depict-ai/utilishared";
import { GPIOObj } from "~/routes/gpio";
import {
  createTheme,
  FormControlLabel,
  Switch,
  ThemeProvider,
  List,
  ListItem,
  IconButton,
} from "@suid/material";
import { Schedule, Delete, Add } from "@suid/icons-material";

type Config = {
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
                          set_extra_list_item();
                        } else {
                          runWithOwner(owner, () =>
                            set_extra_list_item(
                              <ListItem>
                                <SetSchedule
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

function SetSchedule({
  switch_key,
  get_config,
  set_config,
}: {
  switch_key: string;
  get_config: Accessor<Config | undefined>;
  set_config:
    | ((new_value: Config) => Promise<boolean>)
    | Setter<Config | undefined>;
}) {
  // TODO: what if there already is a schedule in this time
  const schedules = createMemo(() => get_config()?.schedules[switch_key] || []);
  createComputed(() => console.log("Config", schedules()));

  return (
    <div class="set_schedule">
      <div class="header">
        Schedule for <b>{switch_key}</b>
      </div>
      <div class="toggles">
        <Index each={schedules()}>
          {(schedule) => {
            const start_time = createMemo(
              () =>
                `${schedule().start_time.hour}:${schedule().start_time.minute}`
            );
            const end_time = createMemo(
              () => `${schedule().end_time.hour}:${schedule().end_time.minute}`
            );
            const start_id = make_random_classname();
            const end_id = make_random_classname();
            let start_input: HTMLInputElement;
            let end_input: HTMLInputElement;

            return (
              <div class="row">
                <IconButton>
                  <Delete />
                </IconButton>
                <div class="toggle_section">
                  <label for={start_id}>Start time</label>
                  <input
                    type="time"
                    id={start_id}
                    value={start_time()}
                    ref={(el) => (start_input = el)}
                    onInput={catchify(() => {
                      console.log(start_input.value);
                    })}
                  />
                </div>
                <div class="toggle_section">
                  <label for={end_id}>End time</label>
                  <input
                    type="time"
                    id={end_id}
                    value={end_time()}
                    ref={(el) => (end_input = el)}
                    onInput={catchify(() => {})}
                  />
                </div>
              </div>
            );
          }}
        </Index>
      </div>
      <div class="button">
        <IconButton>
          <Add />
        </IconButton>
      </div>
    </div>
  );
}
