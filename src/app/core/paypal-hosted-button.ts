import type { DonatePaypalOption } from './donate-options';

type PaypalHostedButtonsApi = {
  HostedButtons: (opts: { hostedButtonId: string }) => {
    render: (selector: string) => Promise<void> | void;
  };
};

declare global {
  interface Window {
    paypal?: PaypalHostedButtonsApi;
  }
}

const SCRIPT_ATTR = 'data-cves-paypal-sdk';

function sdkSrc(clientId: string): string {
  const params = new URLSearchParams({
    'client-id': clientId,
    components: 'hosted-buttons',
    'disable-funding': 'venmo',
    currency: 'USD',
  });
  return `https://www.paypal.com/sdk/js?${params.toString()}`;
}

function loadPaypalSdk(clientId: string): Promise<PaypalHostedButtonsApi> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('PayPal SDK requires a browser'));
  }
  if (window.paypal?.HostedButtons) {
    return Promise.resolve(window.paypal);
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[${SCRIPT_ATTR}]`,
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.paypal?.HostedButtons) {
        resolve(window.paypal);
        return;
      }
      existing.addEventListener(
        'load',
        () => {
          if (window.paypal?.HostedButtons) resolve(window.paypal);
          else reject(new Error('PayPal SDK loaded without HostedButtons'));
        },
        { once: true },
      );
      existing.addEventListener(
        'error',
        () => reject(new Error('PayPal SDK failed to load')),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = sdkSrc(clientId);
    script.async = true;
    script.setAttribute(SCRIPT_ATTR, '1');
    script.addEventListener(
      'load',
      () => {
        if (window.paypal?.HostedButtons) resolve(window.paypal);
        else reject(new Error('PayPal SDK loaded without HostedButtons'));
      },
      { once: true },
    );
    script.addEventListener(
      'error',
      () => reject(new Error('PayPal SDK failed to load')),
      { once: true },
    );
    document.head.appendChild(script);
  });
}

/** Loads PayPal Hosted Buttons and renders into `#containerId`. */
export async function renderPaypalHostedButton(
  option: DonatePaypalOption,
  containerId: string,
): Promise<void> {
  const paypal = await loadPaypalSdk(option.clientId);
  await paypal.HostedButtons({
    hostedButtonId: option.hostedButtonId,
  }).render(`#${containerId}`);
}

export function paypalContainerId(hostedButtonId: string): string {
  return `paypal-container-${hostedButtonId}`;
}
