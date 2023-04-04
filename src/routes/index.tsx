import { A, Title } from "solid-start";

export default function Home() {
  return (
    <main>
      <Title>Heating controls</Title>
      <h1>Heating controls</h1>
      <ol>
        <li>
          <A href="/config-editor">Config editor</A>
        </li>
        <li>
          <A href="/temperatures">Temperatures</A>
        </li>
        <li>
          <A href="/gpio">GPIO</A>
        </li>
        <li>
          <A href="/stove">Stove</A>
        </li>
      </ol>
    </main>
  );
}
