// Auto-generated from raw_services.js — do not edit manually
// Generated: 2026-06-14T11:07:27.097Z

export interface ServiceItem {
  code: string;
  name: string;
  group: string;
  groupCode: string;
  description: string;
  goal: string;
  target: string;
  conditions: string;
  documents: string;
  steps: string[];
  channels: string;
  duration: string;
  fees: string;
  outputs: string;
  limitations: string;
  partners: string;
  kpis: string;
  platformStatus: 'active' | 'partial' | 'gap' | 'correction';
  platformModule: string;
  platformPath: string;
  gapNotes: string;
  isNew: boolean;
  isCorrection: boolean;
}

export interface ServiceGroup {
  code: string;
  name: string;
  color: string;
  description: string;
  services: ServiceItem[];
}

import catalogData from './serviceCatalog.json';

export const serviceGroups: ServiceGroup[] = catalogData as ServiceGroup[];

export const allServices: ServiceItem[] = serviceGroups.flatMap((g) => g.services);

export const getServicesByGroup = (groupCode: string): ServiceItem[] =>
  serviceGroups.find((g) => g.code === groupCode)?.services ?? [];

export const getServiceByCode = (code: string): ServiceItem | undefined =>
  allServices.find((s) => s.code === code);

export const getGroupByCode = (code: string): ServiceGroup | undefined =>
  serviceGroups.find((g) => g.code === code);

export const newServices: ServiceItem[] = allServices.filter((s) => s.isNew);

export const correctionServices: ServiceItem[] = allServices.filter((s) => s.isCorrection);

export const serviceStats = {
  totalGroups: serviceGroups.length,
  totalServices: allServices.length,
  activeServices: allServices.filter((s) => s.platformStatus === 'active').length,
  partialServices: allServices.filter((s) => s.platformStatus === 'partial').length,
  gapServices: allServices.filter((s) => s.platformStatus === 'gap').length,
  newServices: newServices.length,
  correctionServices: correctionServices.length,
} as const;
