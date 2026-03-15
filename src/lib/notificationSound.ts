// Generates a short alert beep using the Web Audio API — no external audio file needed.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function playNotificationSound(type: "info" | "critical" = "info") {
  try {
    const ctx = getAudioContext();

    // Resume context if suspended (browsers block autoplay until user gesture)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    if (type === "critical") {
      // Urgent double-beep for critical alerts
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } else {
      // Soft single tone for regular notifications
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(660, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Silently fail — audio is non-essential
  }
}

// ---- Browser Push Notification API ----

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") {
    return "granted";
  }
  if (Notification.permission !== "denied") {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

export function showBrowserNotification(title: string, body: string, icon?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
      tag: `admin-alert-${Date.now()}`,
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);
  } catch {
    // Silently fail
  }
}
