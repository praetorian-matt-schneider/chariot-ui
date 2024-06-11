import React from 'react';
import { toast } from 'react-toastify';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const successIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7 10L9 12L13 8M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z"
      stroke="#34D399"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const errorIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="#dc2626"
    className="size-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
    />
  </svg>
);

const warningIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="#f59e0b"
    className="size-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
    />
  </svg>
);

const infoIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="#3b82f6"
    className="size-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
    />
  </svg>
);

interface SnackbarProps {
  title: string;
  description: JSX.Element | string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'risk';
  toastId?: string;
}

const getIcon = (variant: SnackbarProps['variant']) => {
  switch (variant) {
    case 'success':
      return successIcon;
    case 'error':
      return errorIcon;
    case 'warning':
      return warningIcon;
    case 'info':
      return infoIcon;
    case 'risk':
      return <ShieldCheckIcon className="size-6" />;
    default:
      return infoIcon;
  }
};

export const showBulkSnackbar = (length: number) => length > 5;

export const Snackbar: React.FC<SnackbarProps> = ({
  title,
  description,
  variant,
  toastId,
}) => {
  const toastVariant = variant === 'risk' ? 'info' : variant;
  return toast[toastVariant ?? 'info'](
    <div className="flex flex-col">
      <span className="font text-gray-900">{title}</span>
      <span className="font font-medium text-gray-400">{description}</span>
    </div>,
    {
      toastId,
      icon: getIcon(variant),
    }
  );
};
