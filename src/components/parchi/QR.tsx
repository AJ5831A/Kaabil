"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Inline SVG QR code (prints crisply on thermal and laser printers). */
export function QR({ value, size, label }: { value: string; size: string; label: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let alive = true;
    QRCode.toString(value, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff00" } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(""));
    return () => {
      alive = false;
    };
  }, [value]);
  return <div role="img" aria-label={label} style={{ width: size, height: size }} className="[&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />;
}
