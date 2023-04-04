import { Title } from "solid-start";
import { ErrorBoundary } from "solid-js";
import { HardcodedToggles } from "~/components/hardcoded_toggles";

export default function Home() {
  return (
    <main>
      <Title>Smart home</Title>
      <h1>Smart home</h1>
      <ErrorBoundary fallback={<div>Hardcoded toggles failed</div>}>
        <HardcodedToggles />
      </ErrorBoundary>
    </main>
  );
}
