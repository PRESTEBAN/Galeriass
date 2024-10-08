import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { environment } from '../environments/environment';

import { HttpClientModule } from '@angular/common/http';

import { NoteModalComponent } from './components/note-modal/note-modal.component'; 
import { FormsModule } from '@angular/forms';

import { ResponseModalComponent } from './components/ResponseModal/response-modal/response-modal.component';

@NgModule({
  declarations: [AppComponent,  NoteModalComponent, ResponseModalComponent],
  imports: [BrowserModule,
     IonicModule.forRoot(),
     AppRoutingModule,
     HttpClientModule,
     FormsModule,
    ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, 
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
     provideAuth(() => getAuth()),
     provideFirestore(() => getFirestore()),
     provideMessaging(() => getMessaging()),
     provideStorage(() => getStorage())],
  bootstrap: [AppComponent],
})
export class AppModule {}
