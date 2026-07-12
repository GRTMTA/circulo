/**
 * Triggers a mock on-ramp flow utilizing Stellar's official SEP-24 Reference Anchor on Testnet.
 * Opens an interactive, constrained browser window simulating the cash-in flow for hackathon judges.
 * 
 * @param userWalletAddress - The connected user's Stellar public key address
 * @returns The opened window instance or null if executed server-side
 */
export function handleMockCashIn(userWalletAddress: string): Window | null {
  if (typeof window === "undefined") {
    return null;
  }

  // Official Stellar testnet reference anchor SEP-24 deposit interface URL
  const baseAnchorUrl = "https://anchor-webapp.stellar.org/sep24/deposit";

  // Build required query parameters for standard anchor interactive flow
  const searchParams = new URLSearchParams({
    account: userWalletAddress,
    asset_code: "USDC",
  });

  const targetUrl = `${baseAnchorUrl}?${searchParams.toString()}`;

  // Constrained dimensions to simulate a standard mobile anchor webview pop-up
  const popupWidth = 500;
  const popupHeight = 700;
  
  // Center the pop-up on the user's screen
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const leftPosition = Math.max(0, Math.floor(screenWidth / 2 - popupWidth / 2));
  const topPosition = Math.max(0, Math.floor(screenHeight / 2 - popupHeight / 2));

  const popupFeatures = [
    `width=${popupWidth}`,
    `height=${popupHeight}`,
    `left=${leftPosition}`,
    `top=${topPosition}`,
    "resizable=yes",
    "scrollbars=yes",
    "status=yes",
    "menubar=no",
    "toolbar=no",
  ].join(",");

  console.log(`[SEP-24 Sandbox] Triggering mock cash-in for account: ${userWalletAddress}`);
  console.log(`[SEP-24 Sandbox] Loading anchor URL: ${targetUrl}`);

  // Launch the pop-up interface
  return window.open(targetUrl, "StellarAnchorCashInMock", popupFeatures);
}
