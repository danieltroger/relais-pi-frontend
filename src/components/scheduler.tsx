import {
  Accessor,
  createMemo,
  createSignal,
  Index,
  Setter,
  JSX as solid_JSX,
  untrack,
  getOwner,
  runWithOwner,
  onCleanup,
  createRoot,
} from "solid-js";
import { IconButton } from "@suid/material";
import { Add, Cancel, Delete, Edit, Save } from "@suid/icons-material";
import { catchify, make_random_classname } from "@depict-ai/utilishared";
import { Config } from "~/components/hardcoded_toggles";

type ScheduleEntry = {
  start_time: { hour: number; minute: number };
  end_time: { hour: number; minute: number };
};

export function Scheduler({
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
  const [get_adding_section, set_adding_section] =
    createSignal<solid_JSX.Element>();
  const scheduler_owner = getOwner()!;

  return (
    <div class="set_schedule">
      <div class="header">
        Schedule for <b>{switch_key}</b>
      </div>
      <div class="list">
        <Index each={schedules()}>
          {(schedule, index) => {
            const owner = getOwner()!;
            const delete_us = (replace_with?: ScheduleEntry) => {
              const old_config = untrack(get_config)!;
              const new_schedules = [...untrack(schedules)];
              if (replace_with) {
                new_schedules.splice(index, 1, replace_with);
              } else {
                new_schedules.splice(index, 1);
              }
              const new_config = {
                ...old_config,
                schedules: {
                  ...old_config?.schedules,
                  [switch_key]: new_schedules,
                },
              };
              set_config(new_config);
            };
            const start_time = createMemo(
              () =>
                `${pad_if_needed(schedule().start_time.hour)}:${pad_if_needed(
                  schedule().start_time.minute
                )}`
            );
            const end_time = createMemo(
              () =>
                `${pad_if_needed(schedule().end_time.hour)}:${pad_if_needed(
                  schedule().end_time.minute
                )}`
            );
            const [get_override_row_contents, set_override_row_contents] =
              createSignal<solid_JSX.Element>();

            const actual_row_contents = (
              <div class="row">
                <div class="edit_section">
                  <IconButton>
                    <Edit
                      onClick={catchify(() =>
                        runWithOwner(owner, () =>
                          set_override_row_contents(
                            <EditingSection
                              start_time={untrack(start_time)}
                              end_time={untrack(end_time)}
                              on_cancel={() => {
                                set_override_row_contents();
                              }}
                              on_submit={(new_entry) => {
                                delete_us(new_entry);
                                set_override_row_contents();
                              }}
                            />
                          )
                        )
                      )}
                    />
                  </IconButton>
                  <IconButton>
                    <Delete onClick={catchify(() => delete_us())} />
                  </IconButton>
                </div>
                <div class="toggle_section">Start time: {start_time()}</div>
                <div class="toggle_section">End time: {end_time()}</div>
              </div>
            );

            return createMemo(
              () => get_override_row_contents() || actual_row_contents
            ) as unknown as solid_JSX.Element;
          }}
        </Index>
        {get_adding_section()}
      </div>
      <div class="button">
        <IconButton
          onClick={catchify(() =>
            runWithOwner(
              scheduler_owner,
              () =>
                get_adding_section() ||
                set_adding_section(
                  <EditingSection
                    on_cancel={() => set_adding_section()}
                    on_submit={catchify(async (new_entry) => {
                      const old_config = untrack(get_config)!;
                      const new_schedules = [...untrack(schedules)];
                      new_schedules.push(new_entry);
                      const new_config = {
                        ...old_config,
                        schedules: {
                          ...old_config?.schedules,
                          [switch_key]: new_schedules,
                        },
                      };
                      set_config(new_config);
                      set_adding_section();
                    })}
                  />
                )
            )
          )}
        >
          <Add />
        </IconButton>
      </div>
    </div>
  );
}

function EditingSection({
  start_time = new Date().toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }),
  end_time = "23:59",
  on_cancel,
  on_submit,
}: {
  start_time?: string;
  end_time?: string;
  on_cancel: () => void;
  on_submit: (new_entry: ScheduleEntry) => void;
}) {
  const upper_owner = getOwner()!;
  return createRoot((dispose) => {
    runWithOwner(upper_owner, () => onCleanup(dispose));
    const start_id = make_random_classname();
    const end_id = make_random_classname();
    let form: HTMLFormElement;

    const handler = catchify(({ key }: KeyboardEvent) => {
      if (key === "Escape") {
        on_cancel();
        dispose();
      }
    });
    window.addEventListener("keydown", handler);
    onCleanup(() => window.removeEventListener("keydown", handler));

    return (
      <form
        class="row editing"
        ref={form!}
        onSubmit={catchify((ev) => {
          ev.preventDefault();
          on_submit(
            Object.fromEntries(
              [...new FormData(form)].map(([field, value]) => {
                const [hour, minute] = (value as string).split(":");
                // Very important to convert to numbers here since backend runs on numbers
                return [field as any, { hour: +hour, minute: +minute }];
              })
            )
          );
          dispose();
        })}
      >
        <div class="edit_section">
          <IconButton type="submit">
            <Save />
          </IconButton>
          <IconButton
            type="button"
            onClick={catchify(() => {
              on_cancel();
              dispose();
            })}
          >
            <Cancel />
          </IconButton>
        </div>
        <div class="toggle_section">
          <label for={start_id}>Start time</label>
          <input
            type="time"
            name="start_time"
            id={start_id}
            value={start_time}
          />
        </div>
        <div class="toggle_section">
          <label for={end_id}>End time</label>
          <input name="end_time" type="time" id={end_id} value={end_time} />
        </div>
      </form>
    );
  });
}

function pad_if_needed(number: number) {
  return number.toLocaleString(undefined, {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
}
