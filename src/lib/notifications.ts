/**
 * Browser notification utilities for transfer events
 * Privacy-first: only local browser notifications, no external services
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

export function showNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    return
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/favicon.ico',
      ...options
    })
  }
}

export function notifyTransferComplete(fileName: string, isSender: boolean) {
  showNotification(
    isSender ? 'Transfer Complete! 🎉' : 'File Received! 📥',
    {
      body: `${fileName} has been ${isSender ? 'sent' : 'received'} successfully.`,
      tag: 'transfer-complete',
      requireInteraction: false,
    }
  )
}

export function notifyConnectionEstablished() {
  showNotification('Connection Established 🔗', {
    body: 'Peer connected successfully!',
    tag: 'connection',
    requireInteraction: false,
  })
}

export function notifyTextReceived(preview: string) {
  const truncated = preview.length > 50 ? preview.substring(0, 50) + '...' : preview
  showNotification('Text Received! 💬', {
    body: truncated,
    tag: 'text-received',
    requireInteraction: false,
  })
}

export function notifyTransferFailed(fileName?: string) {
  showNotification('Transfer Failed ⚠️', {
    body: fileName ? `Failed to transfer ${fileName}` : 'Transfer was interrupted',
    tag: 'transfer-failed',
    requireInteraction: false,
  })
}
