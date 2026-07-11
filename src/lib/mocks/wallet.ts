export const mockWalletDisconnected = {
  status: "disconnected" as const,
  walletAddress: null,
};

export const mockWalletConnecting = {
  status: "connecting" as const,
  walletAddress: null,
};

export const mockWalletConnected = {
  status: "connected" as const,
  walletAddress: "GABC91A2CONNECTED0000000000000000000000000000000000000001",
};

export const mockStablecoinOptions = [
  { asset: "USDC", network: "Stellar" },
  { asset: "USDT", network: "Stellar" },
];

export const mockWalletBalance = {
  asset: "USDC",
  balance: 500,
  network: "Stellar",
};

