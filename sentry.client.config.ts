import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions in dev, reduce in prod
  
  // Session Replay
  replaysOnErrorSampleRate: 1.0, // Capture replays on errors
  replaysSessionSampleRate: 0.1, // Capture 10% of all sessions
  
  // Development settings
  enabled: process.env.NODE_ENV === 'production', // Only in production
  environment: process.env.NODE_ENV,
  
  // Filter sensitive data
  beforeSend(event) {
    // Don't send events with API keys
    if (event.request?.headers) {
      delete event.request.headers['authorization']
      delete event.request.headers['cookie']
    }
    return event;
  },
  
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

