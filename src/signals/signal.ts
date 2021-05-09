export interface Signal {
  id: string;
  coin: string;
  author: string;
  timestamp: number;
  side: string;
  entryPrice: {
    lowerbound: number;
    upperbound: number;
  };
  market?: string;
  exchange?: string;
  strategy?: string;
  stopLossPrice?: number;
  targets?: number[];
}
