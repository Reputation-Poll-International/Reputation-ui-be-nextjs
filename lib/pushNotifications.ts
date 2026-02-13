// Initialize Pusher Push Notifications
export async function initPushNotifications() {
  if (typeof window === 'undefined') return;

  const instanceId = process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID;
  if (!instanceId) {
    console.warn('Pusher Beams instance ID not configured');
    return;
  }

  // Load the SDK
  const script = document.createElement('script');
  script.src = 'https://js.pusher.com/beams/2.1.0/push-notifications-cdn.js';
  script.async = true;
  script.onload = () => {
    registerDevice(instanceId);
  };
  document.body.appendChild(script);
}

function registerDevice(instanceId: string) {
  const beamsClient = new (window as any).PusherPushNotifications.Client({
    instanceId: instanceId,
  });

  beamsClient
    .start()
    .then(() => beamsClient.addDeviceInterest('hello'))
    .then(() => {
      console.log('Successfully registered and subscribed to push notifications!');
    })
    .catch((error: any) => {
      console.error('Push notification registration failed:', error);
    });
}

export function subscribeToInterest(interestName: string) {
  const beamsClient = new (window as any).PusherPushNotifications.Client({
    instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID,
  });

  beamsClient
    .addDeviceInterest(interestName)
    .then(() => console.log(`Subscribed to ${interestName}`))
    .catch((error: any) => console.error('Subscription failed:', error));
}
