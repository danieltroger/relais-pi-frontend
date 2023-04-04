import { createComputed, getOwner } from "solid-js";
import "./ConfigEditorComponent.css";
import { get_backend_synced_signal } from "~/utilities/get_backend_synced_signal";
import { show_toast_with_message } from "~/utilities/show_toast_with_message";

export default function ConfigEditorComponent() {
  let textarea: HTMLTextAreaElement;
  let button: HTMLButtonElement;
  const [get_config, set_config] = get_backend_synced_signal<{
    [key: string]: any;
  }>("config");
  const owner = getOwner()!;

  return (
    <div class="config-editor">
      <textarea
        ref={(el) => {
          textarea = el;
          createComputed(() => {
            const config_value = get_config();
            if (typeof config_value === "object") {
              el.value = JSON.stringify(config_value, undefined, 2);
            } else {
              el.value = "Loading…";
            }
          });
        }}
      ></textarea>
      <br />
      <button
        class="save-button"
        ref={button!}
        onClick={async () => {
          if (!set_config) {
            return;
          }
          let object_contents: { [key: string]: any } | undefined;
          try {
            object_contents = JSON.parse(textarea.value);
          } catch (e) {
            console.error(e);
            await show_toast_with_message(
              owner,
              () => "Error parsing JSON: " + e
            );
          }
          const success =
            object_contents === undefined
              ? false
              : await set_config(object_contents);
          button.animate(
            [
              { backgroundColor: success ? "green" : "red", offset: 0.2 },
              { backgroundColor: success ? "green" : "red", offset: 0.8 },
            ],
            {
              // chrome bug: this doesn't work when no initial background is set via css
              duration: 2000,
            }
          );
        }}
      >
        Save
      </button>
    </div>
  );
}
