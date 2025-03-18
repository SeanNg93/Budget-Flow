// Array of available color class indices
const availableColors = Array.from({ length: 10 }, (_, i) => i + 1);

/**
 * Generate a random color class for a wallet
 * @returns {number} A number between 1-10 representing the color class
 */
export const generateRandomColorIndex = () => {
  const randomIndex = Math.floor(Math.random() * availableColors.length);
  return availableColors[randomIndex];
};

/**
 * Get wallet color class based on wallet ID
 * Ensures the same wallet always gets the same color
 * @param {string} walletId - The wallet's unique ID
 * @returns {string} CSS class name for the wallet's color
 */
export const getWalletColorClass = (walletId) => {
  // Try to get saved color from localStorage
  const savedColors = getSavedWalletColors();
  
  // If this wallet already has a color assigned, use it
  if (savedColors[walletId]) {
    return `walletColor${savedColors[walletId]}`;
  }
  
  // Otherwise generate a new random color
  const colorIndex = generateRandomColorIndex();
  
  // Save it for future use
  saveWalletColor(walletId, colorIndex);
  
  return `walletColor${colorIndex}`;
};

/**
 * Get all saved wallet colors from localStorage
 * @returns {Object} An object mapping wallet IDs to color indices
 */
export const getSavedWalletColors = () => {
  const savedColors = localStorage.getItem('walletColors');
  return savedColors ? JSON.parse(savedColors) : {};
};

/**
 * Save a wallet's color to localStorage
 * @param {string} walletId - The wallet's unique ID
 * @param {number} colorIndex - The color index (1-10)
 */
export const saveWalletColor = (walletId, colorIndex) => {
  const savedColors = getSavedWalletColors();
  savedColors[walletId] = colorIndex;
  localStorage.setItem('walletColors', JSON.stringify(savedColors));
}; 