export type Segment = 'Budget' | 'Basic' | 'Middle' | 'Premium';

export interface Product {
  id: string;
  brand: string;
  model: string;
  type: 'ON-OFF' | 'INVERTER';
  btu: string;
  retail: number;
  segment: Segment;
  benefit: string;
  imageSeed: number; // For consistent placeholder generation
}