import type { Schedule } from "../engine/types";

/** Daily recurring calendar events for the schedule (D-019: export instead of building a reminder app). */
export function scheduleToIcs(schedule: Schedule): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const events = schedule.entries.map((e, i) => {
    const [h, m] = e.time.split(":").map(Number);
    const t = `${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
    return [
      "BEGIN:VEVENT", `UID:stack-${ymd}-${i}@supplement-stack`, `DTSTAMP:${stamp}`, `DTSTART:${ymd}T${t}`, "DURATION:PT10M",
      "RRULE:FREQ=DAILY", `SUMMARY:${esc(`${e.label}: ${e.items.map((x) => x.name).join(", ")}`)}`,
      `DESCRIPTION:${esc(e.items.flatMap((x) => x.reasons).join("\n") + "\nNot medical advice.")}`, "END:VEVENT",
    ].join("\r\n");
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Supplement Stack//EN", ...events, "END:VCALENDAR"].join("\r\n");
}

export function download(filename: string, text: string, type = "text/calendar") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
