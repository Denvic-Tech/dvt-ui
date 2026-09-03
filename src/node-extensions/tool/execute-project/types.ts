export type ExecuteProjectValues = {
  target_project_id?: string;
  target_project_name?: string;
  wait_for_completion?: boolean;
  timeout_sec?: number;
  cancel_on_timeout?: boolean;
  force_exec?: boolean;
  unresolved_variables_policy?: 'error' | 'skip';
  system_variables_policy?: 'error' | 'skip' | 'include';
};
