"use client";

import { useEffect } from "react";

/** Fire-and-forget: attribution ran server-side on this render; forget the cookie. */
export function RefCookieClear() {
  useEffect(() => {
    if (document.cookie.includes("lazi_ref=")) {
      fetch("/api/ref/clear", { method: "POST", keepalive: true }).catch(() => {});
    }
  }, []);
  return null;
}
