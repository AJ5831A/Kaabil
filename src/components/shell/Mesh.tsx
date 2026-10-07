export function Mesh() {
  return (
    <div className="mesh" aria-hidden>
      <div className="blob" style={{ width: "55vw", height: "55vw", left: "-12vw", top: "-18vw", background: "var(--blob-1)" }} />
      <div className="blob" style={{ width: "38vw", height: "38vw", right: "-8vw", top: "12vh", background: "var(--blob-2)", animationDelay: "-14s" }} />
      <div className="blob" style={{ width: "50vw", height: "50vw", left: "25vw", bottom: "-30vw", background: "var(--blob-3)", animationDelay: "-28s" }} />
      <div className="grain" />
    </div>
  );
}
