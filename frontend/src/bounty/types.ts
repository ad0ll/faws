export interface Bounty {
  name: string;
  id?: string;
  fileLocation: string;
  fileDownloadProtocol: typeof SupportedDownloadProtocols[number];
  threshold: number;
  totalNodes: number;
  networkRequired: boolean;
  gpuRequired: boolean;
  amtStorage: number;
  amtNodeReward: number;
  status?: string;
  timeout?: number;
}

export const SupportedDownloadProtocols = ["GIT", "HTTP", "IPFS"] as const;
