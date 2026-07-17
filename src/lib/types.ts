// Общие типы, используемые по всему приложению.
// Формы совпадают с тем, что реально возвращает /api/estimate на сервере
// (см. stackbid-site/index.html — generate() и analyzePhoto()).

export interface EstimateItem {
  name: string;
  unit: string;
  qty: number;
  retail_unit: number;
  wholesale_unit: number;
  local_unit: number;
  note?: string;
}

export interface EstimateCategory {
  name: string;
  items: EstimateItem[];
}

export interface Estimate {
  title: string;
  supplier_name: string;
  supplier_distance: string;
  categories: EstimateCategory[];
}

export interface PhotoResult {
  error?: 'not_construction_material';
  detected?: string;
  message?: string;
  identified?: string;
  category?: string;
  confidence?: 'high' | 'medium' | 'low';
  unit?: string;
  qty_suggested?: number;
  hd_unit?: number;
  wholesale_unit?: number;
  local_unit?: number;
  supplier?: string;
  brand_detected?: string | null;
  spec?: string;
  note?: string;
}

export interface AccessCheckResult {
  can_use_free?: boolean;
  is_pro?: boolean;
  access_granted?: boolean;
  access_token?: string;
  error?: string;
}

export interface UserData {
  email: string;
  first_name: string;
  role: string;
  price_alerts: boolean;
}

export type ProjectType =
  | 'New home build'
  | 'Roof replacement'
  | 'Deck / patio'
  | 'Fence'
  | 'Siding'
  | 'Interior remodel'
  | 'Other';
