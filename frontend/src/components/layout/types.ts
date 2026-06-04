
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface NavItem {
  name?: string;
  href?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  group?: 'early' | 'advanced';
  type?: 'separator';
  label?: string;
  description?: string; // Add description property
  featureFlagKey?: string; // Toggles page activity
}

export interface NavGroup {
  id: string;
  name: string;
  description?: string; // Add description property
  featureFlagKey?: string; // Toggles group activity
  items: NavItem[];
}
