import { apiFetch, apiDownload, toQuery } from "./api.js";

/** FR41: daily/weekly/monthly patient, revenue and appointment statistics. */
export async function getSummary(params = {}) {
  const res = await apiFetch(`/reports/summary${toQuery(params)}`);
  return res.data;
}

/** FR41/FR43: day-by-day series powering the trend charts. */
export async function getTrend(params = {}) {
  const res = await apiFetch(`/reports/trend${toQuery(params)}`);
  return res.data;
}

/** FR44: department (specialization) performance comparison. */
export async function getDepartmentComparison(params = {}) {
  const res = await apiFetch(`/reports/department-comparison${toQuery(params)}`);
  return res.data;
}

/** FR42: export as CSV or PDF. */
export async function exportCsv(params = {}) {
  return apiDownload(`/reports/export.csv${toQuery(params)}`, "sgh-report.csv");
}

export async function exportPdf(params = {}) {
  return apiDownload(`/reports/export.pdf${toQuery(params)}`, "sgh-statistical-report.pdf");
}
