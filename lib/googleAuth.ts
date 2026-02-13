interface GoogleCodeResponse {
  code?: string;
  error?: string;
  error_description?: string;
}

interface GoogleCodeClient {
  requestCode: () => void;
}

interface GoogleAccountsOAuth2 {
  initCodeClient: (config: {
    client_id: string;
    scope: string;
    ux_mode: 'popup';
    callback: (response: GoogleCodeResponse) => void;
  }) => GoogleCodeClient;
}

interface GoogleAccounts {
  oauth2: GoogleAccountsOAuth2;
}

interface GoogleNamespace {
  accounts: GoogleAccounts;
}

declare global {
  interface Window {
    google?: GoogleNamespace;
  }
}

let googleScriptPromise: Promise<void> | null = null;

function getGoogleClientId(): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Google client ID is not configured.');
  }

  return clientId;
}

export async function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Google sign-in is only available in the browser.');
  }

  if (window.google?.accounts?.oauth2) {
    return;
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');

    if (existingScript) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }

      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services.'));

    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export async function requestGoogleAuthCode(): Promise<string> {
  const clientId = getGoogleClientId();
  await loadGoogleIdentityScript();

  return new Promise((resolve, reject) => {
    const codeClient = window.google?.accounts?.oauth2?.initCodeClient({
      client_id: clientId,
      scope: 'openid email profile',
      ux_mode: 'popup',
      callback: (response: GoogleCodeResponse) => {
        if (response.error) {
          reject(new Error(response.error_description || 'Google sign-in was canceled.'));
          return;
        }

        if (!response.code) {
          reject(new Error('Google did not return an authorization code.'));
          return;
        }

        resolve(response.code);
      },
    });

    if (!codeClient) {
      reject(new Error('Unable to initialize Google sign-in.'));
      return;
    }

    codeClient.requestCode();
  });
}

