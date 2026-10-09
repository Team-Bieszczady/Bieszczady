export type ColumnType = 'text' | 'money' | 'person';

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  locked: boolean;
}

export interface Position {
  id: string;
  name: string;
  values: Record<string, string | number>;
}

export interface Category {
  id: string;
  name: string;
  positions: Position[];
  expanded: boolean;
}

export interface BudgetState {
  columns: Column[];
  categories: Category[];
}

export interface BudgetVersion {
  id: string;
  label: string;
  budget: BudgetState;
}
