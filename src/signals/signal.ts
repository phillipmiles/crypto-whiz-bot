export interface Signal {
  id: string;
  coin: string;
  author: string;
  timestamp: number;
  side: string;
  entryPrice: {
    low: number;
    high: number;
  };
  market?: string;
  exchange?: string;
  strategy?: string;
  stopLossPrice?: number;
  targets?: number[];
}
