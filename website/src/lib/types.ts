export interface DayMeta {
  day: number;
  title: string;
  slug: string;
  cluster: string;
  clusterLabel: string;
  clusterColor: string;
  clusterIcon: string;
}

export interface DayData extends DayMeta {
  readme: string;
  theory: string;
  pitfalls: string;
  code: string;
}

export interface CheatsheetData {
  slug: string;
  title: string;
  content: string;
}

export interface Cluster {
  days: number[];
  color: string;
  icon: string;
  label: string;
}

export interface Manifest {
  days: DayMeta[];
  clusters: Record<string, Cluster>;
}
