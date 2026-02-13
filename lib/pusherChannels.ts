// Pusher Channels client for real-time audit updates
declare const Pusher: any;

let pusherInstance: any = null;

export function initializePusher() {
  if (typeof window === 'undefined') return;
  if (pusherInstance) return pusherInstance;

  const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER;

  if (!appKey || !cluster) {
    console.warn('Pusher credentials not configured');
    return null;
  }

  // Load Pusher script if not already loaded
  if (!(window as any).Pusher) {
    const script = document.createElement('script');
    script.src = 'https://js.pusher.com/8.4.0/pusher.min.js';
    script.async = true;
    script.onload = () => {
      initializePusher();
    };
    document.body.appendChild(script);
    return null;
  }

  const Pusher = (window as any).Pusher;
  pusherInstance = new Pusher(appKey, {
    cluster: cluster,
    forceTLS: true,
  });

  return pusherInstance;
}

export function subscribeToAuditUpdates(userId: number, callback: (data: any) => void) {
  if (typeof window === 'undefined') return;

  const pusher = initializePusher();
  if (!pusher) {
    console.warn('Pusher not initialized');
    return;
  }

  const channelName = `audit.user.${userId}`;
  const channel = pusher.subscribe(channelName);

  channel.bind('audit.status.updated', (data: any) => {
    console.log('Audit update received:', data);
    callback(data);
  });

  return () => {
    channel.unbind('audit.status.updated');
    pusher.unsubscribe(channelName);
  };
}

export function getPusherInstance() {
  return pusherInstance || initializePusher();
}
