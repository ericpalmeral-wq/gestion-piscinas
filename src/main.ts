import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Habilitar modo debug de App Check en desarrollo
if (location.hostname === 'localhost') {
  (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
