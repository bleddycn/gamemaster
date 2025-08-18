import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableHeaderCellProps extends TableCellProps {
  sortable?: boolean;
  onSort?: () => void;
  sortDirection?: 'asc' | 'desc' | null;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg">
      <table className={`w-full divide-y divide-gray-200 ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }: TableHeaderProps) {
  return (
    <thead className={`bg-gray-50 ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }: TableBodyProps) {
  return (
    <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', onClick, selected }: TableRowProps) {
  const baseClasses = "transition-colors duration-200";
  const interactiveClasses = onClick ? "cursor-pointer hover:bg-gray-50" : "";
  const selectedClasses = selected ? "bg-indigo-50 border-indigo-200" : "";
  
  return (
    <tr 
      className={`${baseClasses} ${interactiveClasses} ${selectedClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '', align = 'left' }: TableCellProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${alignClasses[align]} ${className}`}>
      {children}
    </td>
  );
}

export function TableHeaderCell({ 
  children, 
  className = '', 
  align = 'left', 
  sortable = false, 
  onSort, 
  sortDirection 
}: TableHeaderCellProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const content = sortable ? (
    <button
      onClick={onSort}
      className="group inline-flex items-center gap-2 font-medium text-gray-700 hover:text-gray-900 transition-colors"
    >
      {children}
      <span className="flex flex-col">
        <svg className={`w-3 h-3 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      </span>
    </button>
  ) : (
    <span className="font-medium text-gray-700">{children}</span>
  );

  return (
    <th className={`px-6 py-3 ${alignClasses[align]} text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
      {content}
    </th>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ActionButton({ 
  onClick, 
  variant = 'primary', 
  size = 'sm', 
  disabled = false, 
  children, 
  className = '' 
}: ActionButtonProps) {
  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        font-medium rounded-md transition-colors duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  );
}

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
}

export function StatusBadge({ status, variant, children }: StatusBadgeProps) {
  // Auto-determine variant based on status if not provided
  const autoVariant = variant || (() => {
    const s = status.toLowerCase();
    if (s.includes('open') || s.includes('active') || s.includes('published')) return 'success';
    if (s.includes('draft') || s.includes('pending') || s.includes('upcoming')) return 'warning';
    if (s.includes('closed') || s.includes('failed') || s.includes('error')) return 'danger';
    if (s.includes('running') || s.includes('in_progress')) return 'info';
    return 'neutral';
  })();

  const variantClasses = {
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[autoVariant]}`}>
      {children}
    </span>
  );
}