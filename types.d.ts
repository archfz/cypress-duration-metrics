export type Metric = {
    total: number;
    max?: number;
    count?: number;
};
export type CommandMetric = {
    total: number;
    started: number;
    command: string;
};
