import { Fragment } from "react";

/** Renders `*emphasis*` in copy as serif italic gold, and `\n` as line breaks. */
export function Rich({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, li) => (
        <Fragment key={li}>
          {line.split(/(\*[^*]+\*)/g).map((part, i) =>
            part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
              <em key={i}>{part.slice(1, -1)}</em>
            ) : (
              <Fragment key={i}>{part}</Fragment>
            ),
          )}
          {li < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}

export function plain(text: string) {
  return text.replace(/\*/g, "");
}
