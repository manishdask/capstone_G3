// Maps a status word (e.g. "Confirmed", "Pending") to a Badge color tone.
export function statusTone(status) {
  if (["Confirmed", "Ready", "Paid", "OK", "Success"].includes(status)) return "success";
  if (["Pending", "In progress", "Low"].includes(status)) return "warn";
  if (["Cancelled", "Critical", "Denied"].includes(status)) return "danger";
  return "default";
}
