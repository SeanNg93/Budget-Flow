// Array of available wallet icon options
export const WALLET_ICONS = [
  { id: 'wallet', label: 'Wallet', value: 'wallet', type: 'standard' },
  { id: 'credit-card', label: 'Credit Card', value: 'creditCard', type: 'standard' },
  { id: 'savings', label: 'Savings', value: 'savings', type: 'standard' },
  { id: 'cash', label: 'Cash', value: 'cash', type: 'standard' },
  { id: 'investment', label: 'Investment', value: 'investment', type: 'standard' },
  { id: 'piggy-bank', label: 'Piggy Bank', value: 'piggyBank', type: 'standard' },
  { id: 'bank', label: 'Bank', value: 'bank', type: 'standard' },
  { id: 'shopping', label: 'Shopping', value: 'shopping', type: 'standard' },
  // Emoji icons - these don't need color selection
  { id: 'emoji-money', label: 'Money Bag', value: '💰', type: 'emoji' },
  { id: 'emoji-dollar', label: 'Dollar', value: '💵', type: 'emoji' },
  { id: 'emoji-credit-card', label: 'Credit Card', value: '💳', type: 'emoji' },
  { id: 'emoji-pig', label: 'Piggy Bank', value: '🐷', type: 'emoji' },
  { id: 'emoji-chart', label: 'Chart', value: '📈', type: 'emoji' },
  // Food emoji
  { id: 'emoji-food-pizza', label: 'Pizza', value: '🍕', type: 'emoji' },
  { id: 'emoji-food-burger', label: 'Burger', value: '🍔', type: 'emoji' },
  { id: 'emoji-food-coffee', label: 'Coffee', value: '☕', type: 'emoji' },
  { id: 'emoji-food-cake', label: 'Cake', value: '🍰', type: 'emoji' },
  // Animal emoji
  { id: 'emoji-animal-cat', label: 'Cat', value: '🐱', type: 'emoji' },
  { id: 'emoji-animal-dog', label: 'Dog', value: '🐶', type: 'emoji' },
  { id: 'emoji-animal-fox', label: 'Fox', value: '🦊', type: 'emoji' },
  { id: 'emoji-animal-panda', label: 'Panda', value: '🐼', type: 'emoji' },
  // Family emoji
  { id: 'emoji-family-house', label: 'House', value: '🏠', type: 'emoji' },
  { id: 'emoji-family-car', label: 'Car', value: '🚗', type: 'emoji' },
  { id: 'emoji-family-gift', label: 'Gift', value: '🎁', type: 'emoji' },
  { id: 'emoji-family-baby', label: 'Baby', value: '👶', type: 'emoji' },
  // Travel emoji
  { id: 'emoji-travel-plane', label: 'Plane', value: '✈️', type: 'emoji' },
  { id: 'emoji-travel-beach', label: 'Beach', value: '🏖️', type: 'emoji' },
  { id: 'emoji-travel-mountain', label: 'Mountain', value: '⛰️', type: 'emoji' }
];

// Array of available color options
export const WALLET_COLORS = [
  { id: 'color1', label: 'Blue', value: 1, hex: '#007aff' },
  { id: 'color2', label: 'Green', value: 2, hex: '#34c759' },
  { id: 'color3', label: 'Orange', value: 3, hex: '#ff9500' },
  { id: 'color4', label: 'Red', value: 4, hex: '#ff3b30' },
  { id: 'color5', label: 'Purple', value: 5, hex: '#5856d6' },
  { id: 'color6', label: 'Pink/Purple', value: 6, hex: '#af52de' },
  { id: 'color7', label: 'Pink', value: 7, hex: '#ff2d55' },
  { id: 'color8', label: 'Light Blue', value: 8, hex: '#5ac8fa' },
  { id: 'color9', label: 'Yellow', value: 9, hex: '#ffcc00' },
  { id: 'color10', label: 'Mint', value: 10, hex: '#4cd964' }
];

/**
 * Get wallet color class based on wallet ID
 * Uses the saved color preference from localStorage
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
  
  // Otherwise use the default color (blue)
  return 'walletColor1';
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

/**
 * Get the icon name for a wallet based on icon preference
 * @param {Object} wallet - The wallet object
 * @returns {string} Icon name to use
 */
export const getWalletIconName = (wallet) => {
  if (!wallet) return 'wallet';
  
  // If wallet has an icon preference, use it
  if (wallet.iconName) return wallet.iconName;
  
  // Otherwise fall back to account type mapping
  const typeToIcon = {
    'savings': 'savings',
    'credit card': 'creditCard',
    'cash': 'cash',
    'investment': 'investment',
    'checking': 'bank'
  };
  
  const key = wallet.accountType?.toLowerCase() || 'wallet';
  return typeToIcon[key] || 'wallet';
};

/**
 * Save a wallet's icon preference
 * @param {string} walletId - The wallet's unique ID
 * @param {string} iconName - The icon name 
 */
export const saveWalletIcon = (walletId, iconName) => {
  const savedIcons = getSavedWalletIcons();
  savedIcons[walletId] = iconName;
  localStorage.setItem('walletIcons', JSON.stringify(savedIcons));
};

/**
 * Get all saved wallet icons from localStorage
 * @returns {Object} An object mapping wallet IDs to icon names
 */
export const getSavedWalletIcons = () => {
  const savedIcons = localStorage.getItem('walletIcons');
  return savedIcons ? JSON.parse(savedIcons) : {};
};

/**
 * Get a wallet's icon name from localStorage
 * @param {string} walletId - The wallet's unique ID
 * @returns {string|null} The icon name or null if not found
 */
export const getWalletIcon = (walletId) => {
  const savedIcons = getSavedWalletIcons();
  return savedIcons[walletId] || null;
}; 