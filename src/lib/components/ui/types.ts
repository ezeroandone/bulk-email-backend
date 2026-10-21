// ── Shared type definitions for UI component library ──────────────────────────
// These types are re-exported from index.ts to avoid issues with tsc not
// recognising named exports from .svelte files under the project's tsconfig.

import type { Snippet } from 'svelte';

// Button
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  class?: string;
  onclick?: (e: MouseEvent) => void;
  icon?: Snippet;
  children?: Snippet;
}

// Input
export interface InputProps {
  label?: string;
  value?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  type?: string;
  placeholder?: string;
  name?: string;
  id?: string;
  'leading-icon'?: Snippet;
  'trailing-icon'?: Snippet;
}

// Select
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  value?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  id?: string;
}

// Textarea
export interface TextareaProps {
  label?: string;
  value?: string;
  error?: string;
  rows?: number;
  maxlength?: number;
  placeholder?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

// Modal
export interface ModalProps {
  open?: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children?: Snippet;
  footer?: Snippet;
}

// Card
export interface CardProps {
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
  class?: string;
  children?: Snippet;
  onclick?: (e: MouseEvent) => void;
}

// Badge
export interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'pending';
  children?: Snippet;
}

// Skeleton
export interface SkeletonProps {
  variant?: 'line' | 'card' | 'table';
  lines?: number;
  rows?: number;
}

// Toast
export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onDismiss?: (id: string) => void;
}

// Dropdown
export interface DropdownItem {
  label: string;
  icon?: string;
  separator?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export interface DropdownProps {
  items?: DropdownItem[];
  trigger?: Snippet;
}

// Tabs
export interface TabsProps {
  activeTab?: string;
  tabs?: Array<{ id: string; label: string }>;
  children?: Snippet;
}

// Tab
export interface TabProps {
  id: string;
  label: string;
  children?: Snippet;
  active?: boolean;
  onActivate?: (id: string) => void;
}

// DataTable
export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: unknown) => string;
}

export interface DataTableProps {
  columns?: DataTableColumn[];
  rows?: unknown[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: unknown) => void;
}

// Pagination
export interface PaginationProps {
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}

// FileUpload
export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  files?: File[];
}

// ProgressBar
export interface ProgressBarProps {
  value?: number;
  max?: number;
  animated?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
  label?: string;
}

// Sidebar
export interface SidebarChild {
  label: string;
  href: string;
}

export interface SidebarItem {
  label: string;
  icon: string;
  href: string;
  children?: SidebarChild[];
  badge?: string;
}

export interface SidebarProps {
  items?: SidebarItem[];
  collapsed?: boolean;
  currentPath?: string;
}

// TopNav
export interface TopNavProps {
  title?: string;
  currentPath?: string;
  'credit-balance'?: Snippet;
  actions?: Snippet;
}

// EmptyState
export interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  actions?: Snippet;
}

// ConfirmDialog
export interface ConfirmDialogProps {
  open?: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

// StatusBadge
export interface StatusBadgeProps {
  status: string;
}

// CreditBadge
export interface CreditBadgeProps {
  balance?: number;
  lowThreshold?: number;
}

// VariablePicker
export interface VariablePickerProps {
  columns?: string[];
  onSelect?: (variable: string) => void;
}
