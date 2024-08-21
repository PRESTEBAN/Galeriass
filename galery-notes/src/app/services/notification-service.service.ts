import { Injectable } from '@angular/core';
import { FCM } from '@capacitor-community/fcm';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { UserServiceService } from '../services/user-service.service';
import { PushNotifications } from '@capacitor/push-notifications';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationServiceService {

  constructor(private userService: UserServiceService, private firestore: Firestore, private http:HttpClient) { 
    this.initializePushNotifications();
  }

  private async initializePushNotifications() {
    if (Capacitor.isNativePlatform()) {
      PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success, token: ', token.value);
  
        const email = await this.userService.getCurrentUserEmail();
        if (email) {
          console.log('Email obtenido:', email);
          await this.saveToken(email, token.value);
        } else {
          console.error('No se pudo obtener el email del usuario');
        }
      });
  
      // ... resto del código ...
  
      await PushNotifications.requestPermissions();
      await PushNotifications.register();
    } else {
      console.log('Push notifications no están disponibles en la web');
    }
  }

  async initialize() {
    try {
      await this.initializePushNotifications();
    } catch (error) {
      console.error('Error al inicializar las notificaciones push:', error);
    }
  }

  
  async sendNotification(currentUserEmail: string, message: string) {
    try {
      const otherUserEmail = await this.userService.getOtherUserEmail(currentUserEmail);
      
      if (otherUserEmail) {
        await firstValueFrom(this.http.post('https://galeriass.onrender.com/send-notification', {
          email: otherUserEmail,
          message: message
        }));
      }
    } catch (error) {
      console.error('Error al enviar la notificación:', error);
    }
  }

  
  private async saveToken(email: string, token: string) {
    try {
      await setDoc(doc(this.firestore, 'tokens', email), { token });
      console.log(`Token guardado exitosamente para ${email}`);
    } catch (error) {
      console.error(`Error al guardar el token para ${email}:`, error);
    }
  }

}