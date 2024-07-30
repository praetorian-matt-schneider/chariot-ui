import React from 'react';
import {
  CommandLineIcon,
  ExclamationTriangleIcon,
  ServerStackIcon,
} from '@heroicons/react/24/outline';

interface IconProps {
  className?: string;
}

export const AssetsIcon: React.FC<IconProps> = ({ className }) => (
  <ServerStackIcon className={className} />
);

export const RisksIcon: React.FC<IconProps> = ({ className }) => (
  <ExclamationTriangleIcon className={className} />
);

export const AttributesIcon: React.FC<IconProps> = ({ className }) => (
  <CommandLineIcon className={className} />
);
