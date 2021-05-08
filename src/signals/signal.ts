export interface Signal {
  id: string;
  coin: string;
  author: string;
  timestamp: number;
  buyzone: {
    lowerbound: number;
    upperbound: number;
  };
  stopLossPrice: number;
  targets: number[];
}
