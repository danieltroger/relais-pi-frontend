import { Owner, runWithOwner, JSX as solid_JSX, Accessor } from "solid-js";

export async function show_toast_with_message(
  owner: Owner,
  statement: Accessor<solid_JSX.Element>
) {
  const { show_toast } = await import("@depict-ai/ui");

  runWithOwner(owner, () => {
    const { close_toast_ } = show_toast({
      children: [
        <div class="statement">{statement()}</div>,
        <div class="buttons">
          <button onClick={() => close_toast_()} class="ok major">
            OK
          </button>
        </div>,
      ],
      close_after_: 10000,
    });
  });
}
