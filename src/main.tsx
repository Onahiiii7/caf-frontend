import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import './index.css'
import App from './App.tsx'
import { queryClient } from './lib/query-client'

const ENABLE_LIVE_UPDATES =
  import.meta.env.VITE_ENABLE_LIVE_UPDATES === 'true'

const LIVE_UPDATE_CHANNEL =
  import.meta.env.VITE_LIVE_UPDATE_CHANNEL || 'production'

const initializeLiveUpdates = async () => {
  if (!ENABLE_LIVE_UPDATES) {
    return
  }

  if (Capacitor.getPlatform() === 'web') {
    return
  }

  try {
    await CapacitorUpdater.notifyAppReady()
    await CapacitorUpdater.setChannel({ channel: LIVE_UPDATE_CHANNEL })

    const update = await CapacitorUpdater.download({
      channel: LIVE_UPDATE_CHANNEL,
    })

    if (update?.bundle?.id) {
      await CapacitorUpdater.set({ id: update.bundle.id })
    }
  } catch (error) {
    console.warn('Live update check failed:', error)
  }
}

// Global error handler for uncaught promises (like MetaMask connection errors)
window.addEventListener('unhandledrejection', (event) => {
  // Suppress MetaMask connection errors as they are not critical to the app
  if (event.reason?.message?.includes('MetaMask') || 
      event.reason?.message?.includes('ethereum') ||
      event.reason?.message?.includes('extension not found')) {
    console.warn('MetaMask error suppressed:', event.reason.message);
    event.preventDefault();
    return;
  }
  
  // Log other unhandled promise rejections
  console.error('Unhandled promise rejection:', event.reason);
});

const bootstrap = async () => {
  await initializeLiveUpdates()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  )
}

void bootstrap()
