import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
// import { provideAppCheck, initializeAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';

import { routes } from './app.routes';
import { firebaseConfig } from '../environments/firebase.config';
import { initializeAppCheck, provideAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),

    provideAppCheck(() => {
      const app = initializeApp(firebaseConfig);
      return initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6LeEIIQsAAAAANX_LYhDrPIJXlR-0vhMgZoP5ojw'),
        isTokenAutoRefreshEnabled: true
      });
    })
  ]
};
