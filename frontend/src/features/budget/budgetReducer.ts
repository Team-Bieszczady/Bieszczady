import type { BudgetState, Category, ColumnType, Position } from './types';
import { parseMoney } from './utils/budgetTotals';

export type BudgetAction =
  | { type: 'ADD_CATEGORY'; id: string; name: string }
  | { type: 'RENAME_CATEGORY'; categoryId: string; name: string }
  | { type: 'DELETE_CATEGORY'; categoryId: string }
  | { type: 'TOGGLE_CATEGORY'; categoryId: string }
  | { type: 'ADD_POSITION'; categoryId: string; id: string; name: string }
  | {
      type: 'RENAME_POSITION';
      categoryId: string;
      positionId: string;
      name: string;
    }
  | {
      type: 'UPDATE_CELL';
      categoryId: string;
      positionId: string;
      columnId: string;
      value: string;
    }
  | { type: 'DELETE_POSITION'; categoryId: string; positionId: string }
  | { type: 'ADD_COLUMN'; id: string; name: string; columnType: ColumnType }
  | { type: 'RENAME_COLUMN'; columnId: string; name: string }
  | { type: 'DELETE_COLUMN'; columnId: string };

function updateCategory(
  state: BudgetState,
  categoryId: string,
  update: (category: Category) => Category,
): BudgetState {
  return {
    ...state,
    categories: state.categories.map((category) =>
      category.id === categoryId ? update(category) : category,
    ),
  };
}

function updatePosition(
  state: BudgetState,
  categoryId: string,
  positionId: string,
  update: (position: Position) => Position,
): BudgetState {
  return updateCategory(state, categoryId, (category) => ({
    ...category,
    positions: category.positions.map((position) =>
      position.id === positionId ? update(position) : position,
    ),
  }));
}

function isLocked(state: BudgetState, columnId: string): boolean {
  return state.columns.some(
    (column) => column.id === columnId && column.locked,
  );
}

export function budgetReducer(
  state: BudgetState,
  action: BudgetAction,
): BudgetState {
  switch (action.type) {
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [
          ...state.categories,
          { id: action.id, name: action.name, positions: [], expanded: true },
        ],
      };

    case 'RENAME_CATEGORY':
      return updateCategory(state, action.categoryId, (category) => ({
        ...category,
        name: action.name,
      }));

    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(
          (category) => category.id !== action.categoryId,
        ),
      };

    case 'TOGGLE_CATEGORY':
      return updateCategory(state, action.categoryId, (category) => ({
        ...category,
        expanded: !category.expanded,
      }));

    case 'ADD_POSITION':
      return updateCategory(state, action.categoryId, (category) => ({
        ...category,
        expanded: true,
        positions: [
          ...category.positions,
          { id: action.id, name: action.name, values: {} },
        ],
      }));

    case 'RENAME_POSITION':
      return updatePosition(
        state,
        action.categoryId,
        action.positionId,
        (position) => ({ ...position, name: action.name }),
      );

    case 'UPDATE_CELL': {
      const column = state.columns.find(({ id }) => id === action.columnId);
      if (!column) return state;

      const trimmed = action.value.trim();
      const value =
        column.type === 'money' && trimmed !== ''
          ? parseMoney(trimmed)
          : trimmed;
      if (value === null) return state;

      return updatePosition(
        state,
        action.categoryId,
        action.positionId,
        (position) => ({
          ...position,
          values: { ...position.values, [action.columnId]: value },
        }),
      );
    }

    case 'DELETE_POSITION':
      return updateCategory(state, action.categoryId, (category) => ({
        ...category,
        positions: category.positions.filter(
          (position) => position.id !== action.positionId,
        ),
      }));

    case 'ADD_COLUMN':
      return {
        ...state,
        columns: [
          ...state.columns,
          {
            id: action.id,
            name: action.name,
            type: action.columnType,
            locked: false,
          },
        ],
      };

    case 'RENAME_COLUMN':
      if (isLocked(state, action.columnId)) return state;

      return {
        ...state,
        columns: state.columns.map((column) =>
          column.id === action.columnId
            ? { ...column, name: action.name }
            : column,
        ),
      };

    case 'DELETE_COLUMN':
      if (isLocked(state, action.columnId)) return state;

      return {
        columns: state.columns.filter(({ id }) => id !== action.columnId),
        categories: state.categories.map((category) => ({
          ...category,
          positions: category.positions.map((position) => ({
            ...position,
            values: Object.fromEntries(
              Object.entries(position.values).filter(
                ([columnId]) => columnId !== action.columnId,
              ),
            ),
          })),
        })),
      };
  }
}
