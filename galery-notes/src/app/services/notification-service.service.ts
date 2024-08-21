import { Injectable } from '@angular/core';
import { FCM } from '@capacitor-community/fcm';
import { HttpClient } from '@angular/common/http';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { UserServiceService } from '../services/user-service.service';
import { PushNotifications } from '@capacitor/push-notifications';
@Injectable({
  providedIn: 'root'
})
export class NotificationServiceService {

  constructor(private userService: UserServiceService, private firestore: Firestore) { 
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

  private async saveToken(email: string, token: string) {
    await setDoc(doc(this.firestore, 'tokens', email), { token });
  }

}