This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.

## Shared Wallet Enhancements

The Budget Flow application includes several UI enhancements to make shared wallet functionality more intuitive:

### Shared Wallet Labels

1. **Wallet Dropdown in Transaction Form**
   - Wallets that are shared (either by you or with you) are labeled with "(shared wallet)" in the wallet dropdown
   - This makes it easy to identify which wallets are shared when creating or editing transactions

2. **Transaction List on Dashboard**
   - Transactions that use shared wallets include a "(shared)" label in the wallet column
   - This allows users to quickly identify which transactions involve shared wallets

### Implementation Details

- The application fetches shared wallet information from two endpoints:
  - `getSharedWalletsWithMe()` - Wallets shared with the current user
  - `getSharedWalletsByMe()` - Wallets the current user has shared with others
  
- This information is used to create a lookup map that tracks which wallet IDs are shared
- The UI components then use this map to display appropriate labels

### Benefits

- Improved visibility of shared wallet status throughout the application
- Better user experience when managing transactions with shared wallets
- Clear distinction between personal and shared financial activities
