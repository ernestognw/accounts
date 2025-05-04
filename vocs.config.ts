import { defineConfig } from 'vocs';

export default defineConfig({
  sidebar: [
    {
      text: 'Overview',
      link: '/',
    },
    {
      text: 'API Reference',
      link: '/api',
      items: [
        { text: 'Account', link: '/api/account' },
        { text: 'ECDSA', link: '/api/ecdsa' },
        { text: 'P256', link: '/api/p256' },
        { text: 'RSA', link: '/api/rsa' },
        { text: 'ERC7579 Utils', link: '/api/erc7579.utils' },
      ],
    },
  ],
  theme: {
    variables: {
      color: {
        textAccent: {
          light: '#4F56FA',
          dark: '#4F56FA',
        },
        background: {
          light: 'white',
          dark: 'black',
        },
      },
    },
  },
  description: 'A Javascript library to use OpenZeppelin Smart Accounts',
  logoUrl: {
    dark: './dark.svg',
    light: './light.svg',
  },
  title: '@openzeppelin/accounts',
});
