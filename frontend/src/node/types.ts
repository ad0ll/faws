//Converge w/ Types
// ClientNode now, a
//TODO probably drop or merge w/ types

export interface Node {
  name: string;
  id?: string;
  last_run?: number;
  last_success?: number;
  last_failure?: number;
  successful_runs?: number;
  failed_runs?: number;
  unanswered_runs?: number;
  gpus?: string[];
}