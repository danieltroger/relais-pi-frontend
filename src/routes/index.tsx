import { Title } from "solid-start";
import { isServer } from "solid-js/web";
import { ErrorBoundary, JSX as solid_JSX, createSignal } from "solid-js";

export default function Home() {
  const [get_toggles, set_toggles] =
    createSignal<solid_JSX.Element>("Loading toggles…");

  if (!isServer) {
    import("~/components/hardcoded_toggles").then((module) =>
      set_toggles(module.default)
    );
  }

  return (
    <main>
      <Title>Smart home</Title>
      <h1>Smart home</h1>
      <ErrorBoundary fallback={<div>Hardcoded toggles failed</div>}>
        {get_toggles()}
      </ErrorBoundary>
    </main>
  );
}
