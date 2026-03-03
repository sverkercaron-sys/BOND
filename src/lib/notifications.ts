import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Request browser push notification permission
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Subscribe to push notifications and save to database
 */
export async function subscribeToPush(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  // Check if service worker is supported
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("Push notifications not supported");
    return;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register("/sw.js");

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });

    // Save subscription to database
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({
        user_id: userId,
        subscription: subscription.toJSON(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    throw error;
  }
}

/**
 * Send a browser notification
 */
export function sendLocalNotification(title: string, body: string): void {
  if (!("Notification" in window)) {
    console.log("Notifications not supported");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/logo.png",
      badge: "/badge.png",
    });
  }
}

/**
 * Schedule a daily notification
 */
export async function scheduleDailyNotification(
  supabase: SupabaseClient,
  userId: string,
  hour: number,
  minute: number = 0
): Promise<void> {
  // Get current time
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hour, minute, 0, 0);

  // If time has passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  // Calculate delay
  const delayMs = scheduledTime.getTime() - now.getTime();

  // Schedule first notification
  setTimeout(() => {
    sendLocalNotification(
      "BOND",
      "Det är dags för er dagliga övning!"
    );
  }, delayMs);

  // Save notification schedule to database
  const { error } = await supabase
    .from("notification_schedules")
    .upsert({
      user_id: userId,
      hour,
      minute,
      enabled: true,
      next_notification: scheduledTime.toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}
