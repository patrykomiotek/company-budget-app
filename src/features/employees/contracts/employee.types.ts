export interface EmployeeOption {
  id: string;
  name: string;
}

export interface EmployeeItem {
  id: string;
  name: string;
  displayName: string | null;
  departmentName: string;
  transactionCount: number;
}
