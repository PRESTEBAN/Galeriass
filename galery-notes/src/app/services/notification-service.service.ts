import { Injectable } from '@angular/core';
import { FCM } from '@capacitor-community/fcm';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { UserServiceService } from '../services/user-service.service';
import { PushNotifications } from '@capacitor/push-notifications';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NotificationServiceService {

  constructor(private userService: UserServiceService, private firestore: Firestore, private http:HttpClient) { 
    this.initializePushNotifications();
  }

  private async initializePushNotifications() {
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ', token.value);

      const email = await this.userService.getCurrentUserEmail();
      if (email) {
        await this.saveToken(email, token.value);
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error: ', error.error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ', notification);
    });

    await PushNotifications.requestPermissions();
    await PushNotifications.register();
  }

  async initialize() {
    await this.initializePushNotifications();
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
    await setDoc(doc(this.firestore, 'tokens', email), { token });
  }

}