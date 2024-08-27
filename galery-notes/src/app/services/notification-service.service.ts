import { Injectable } from '@angular/core';
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
  
  }

  private async initializePushNotifications() {
    if (Capacitor.isNativePlatform()) {
      // Solicitar permisos para las notificaciones push
      const permissionStatus = await PushNotifications.requestPermissions();
      
      if (permissionStatus.receive === 'granted') {
        // Registrar el dispositivo para recibir notificaciones
        await PushNotifications.register();
  
        // Listener para el evento de registro exitoso
        PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token: ', token.value);
  
          // Obtener el correo del usuario actual
          const email = await this.userService.getCurrentUserEmail();
          if (email) {
            console.log('Email obtenido:', email);
            // Guardar el token en Firestore
            await this.saveToken(email, token.value);
          } else {
            console.error('No se pudo obtener el email del usuario');
          }
        });
  
        // Listener para errores de registro
        PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error: ', error.error);
        });
  
        // Listener para recibir notificaciones push
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received: ', notification);
        });
  
        // Listener para acciones realizadas en una notificación push
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push action performed: ', notification);
        });
  
      } else {
        console.log('Permiso para notificaciones push denegado');
      }
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
        console.log(`Enviando notificación a: ${otherUserEmail}`);
        const response = await firstValueFrom(this.http.post('https://ps-ciai-beta1.onrender.com/send-notification', {
          email: otherUserEmail,
          message: message,
        }));
        console.log('Respuesta del servidor:', response);
      } else {
        console.error('No se pudo obtener el correo del otro usuario');
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

  async sendNoteResponseNotification(noteCreatorEmail: string, responderEmail: string, noteTitle: string) {
    try {
      if (noteCreatorEmail === responderEmail) {
        console.log('El creador de la nota respondió a su propia nota. No se envía notificación.');
        return;
      }

      const recipientEmail = noteCreatorEmail;
      const message = `${responderEmail} ha respondido a tu nota: ${noteTitle}`;

      console.log(`Enviando notificación a: ${recipientEmail}`);
      const response = await firstValueFrom(this.http.post('https://ps-ciai-beta1.onrender.com/send-notification', {
        email: recipientEmail,
        message: message,
      }));
      console.log('Respuesta del servidor:', response);
    } catch (error) {
      console.error('Error al enviar la notificación de respuesta a nota:', error);
    }
  }

  async sendCommentReplyNotification(responderEmail: string, recipientEmail: string, noteTitle: string) {
    try {
      if (responderEmail === recipientEmail) {
        console.log('El usuario está respondiendo a su propio comentario. No se envía notificación.');
        return;
      }
  
      const message = `${responderEmail} ha respondido a un comentario en la nota: ${noteTitle}`;
  
      console.log(`Enviando notificación a: ${recipientEmail}`);
      const response = await firstValueFrom(this.http.post('https://ps-ciai-beta1.onrender.com/send-notification', {
        email: recipientEmail,
        message: message,
      }));
      console.log('Respuesta del servidor:', response);
    } catch (error) {
      console.error('Error al enviar la notificación de respuesta a comentario:', error);
    }
  }



}