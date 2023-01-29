export type Metric = { total: number, max?: number, count?: number }
export type CommandMetric = { total: number, started: number, command: string }

export const initMetric = () => ({total: 0, max: 0, count: 0});
export const registerOnMetric = (total: number, metric: Metric) => {
  metric.total += total;
  metric.max = Math.max(metric.max || 0, total);
  metric.count = (metric.count || 0) + 1;
};
export const mergeMetrics = (inMetric: Metric, outMetric: Metric) => {
  outMetric.total += inMetric.total;
  outMetric.max = Math.max(inMetric.max || 0, outMetric.max || 0);
  outMetric.count = (inMetric.count || 0) + (outMetric.count || 0);
};
