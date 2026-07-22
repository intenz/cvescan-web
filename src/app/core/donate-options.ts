/** Donation options shown in the Support CVEScan dialog. */

export type DonateLinkOption = {
  id: string;
  kind: 'link';
  title: string;
  summary: string;
  linkLabel: string;
  linkHref: string;
};

export type DonatePaypalOption = {
  id: string;
  kind: 'paypal';
  title: string;
  summary: string;
  clientId: string;
  hostedButtonId: string;
  /** Fallback if the hosted button SDK fails to load. */
  linkHref: string;
};

export type DonateCryptoOption = {
  id: string;
  kind: 'crypto';
  title: string;
  summary: string;
  network: string;
  address: string;
};

export type DonateOption =
  | DonateLinkOption
  | DonatePaypalOption
  | DonateCryptoOption;

export const DONATE_INTRO =
  'CVEScan is free — and it stays that way by choice. If you like what it does, a donation helps one author keep building tools that make the world a bit more secure. No pressure; gratitude goes a long way either way.';

export const DONATE_OPTIONS: DonateOption[] = [
  {
    id: 'kofi',
    kind: 'link',
    title: 'Ko-fi',
    summary: 'One-time support for hosting, data feeds, and continued development.',
    linkLabel: 'Support on Ko-fi',
    linkHref: 'https://ko-fi.com/cvescan',
  },
  {
    id: 'paypal',
    kind: 'paypal',
    title: 'PayPal',
    summary: 'Donate securely with a card or PayPal balance.',
    clientId:
      'BAAQQFDInchyJYGoApZwKi5dPyK7rRLLmHhXAJDKY0K8Ci7wHlG8JgrNbjgPrNcrsiNZlOsoBaifMaVtjA',
    hostedButtonId: 'PEHXCL2CHBY94',
    linkHref: 'https://www.paypal.com/ncp/payment/PEHXCL2CHBY94',
  },
  {
    id: 'monobank',
    kind: 'link',
    title: 'Monobank',
    summary: 'Support via a Monobank jar (cards / Apple Pay / Google Pay).',
    linkLabel: 'Open Monobank jar',
    linkHref: 'https://send.monobank.ua/jar/12DzjR6GZ8',
  },
  {
    id: 'eth',
    kind: 'crypto',
    title: 'Ethereum (ERC-20)',
    summary:
      'Send ETH or ERC-20 tokens on Ethereum mainnet only. Do not use other chains.',
    network: 'Ethereum',
    address: '0xafd92017d5a8ec766b14e912a052f0174daa1e8c',
  },
];

export const DONATE_FOOTER =
  'Thank you for considering it. Every bit counts.';
