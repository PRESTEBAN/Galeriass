import { Component } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { UserServiceService } from '../services/user-service.service';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { NotificationServiceService} from '../services/notification-service.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  userName: string = '';
  isLoading: boolean = true;
  imagenes: string[] = [];


  constructor(private userService: UserServiceService,private notificationService: NotificationServiceService, private http:HttpClient) {
    this.notificationService.initialize();
    this.loadUserImages();
  }


  async ngOnInit() {
    try {
       Camera.requestPermissions();
       this.loadUserName();
       this.loadUserImages();
    } catch (error) {
      console.error('Error in ngOnInit:', error);
    }
  }


  async getPicture() {
    const imagenTomada = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      allowEditing: true,
    });
       
    if(imagenTomada){
      this.savePhoto(imagenTomada.dataUrl!);
    }


    if (imagenTomada && imagenTomada.dataUrl) {
      const blob = this.dataURItoBlob(imagenTomada.dataUrl);
      await this.userService.uploadImage(blob);
      await this.loadUserImages();
      await this.sendNotification();
      
    } else {
      console.error('Error: dataUrl no está disponible.');
    }
  }

  async sendNotification() {
    const currentUserEmail = await this.userService.getCurrentUserEmail();
    if (currentUserEmail) {
      await this.notificationService.sendNotification(currentUserEmail, `${currentUserEmail} ha subido una nueva foto!`);
    } else {
      console.error('No se pudo obtener el correo electrónico del usuario actual');
    }
  }

  async loadUserImages() {
    try {
      this.imagenes = await this.userService.getUserImages();
    } catch (error) {
      console.error('Error al cargar las imágenes del usuario:', error);
    }
  }

  private dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  async loadUserName() {
    try {
      this.userName = await this.userService.getUserName();
    } catch (error) {
      console.error('Error al obtener el nombre del usuario:', error);
    }
  }

  async savePhoto(photo: string) {
    if (Capacitor.isNativePlatform()) {
      try {
        const fileName = `photo_${new Date().getTime()}.jpg`;
        const savedFile = await Filesystem.writeFile({
          path: `Pictures/${fileName}`,
          data: photo,
          directory: Directory.ExternalStorage,
          recursive: true
        });
  
        console.log('Imagen guardada:', savedFile.uri);
  
        // Para Android, usamos un enfoque diferente para hacer la imagen visible en la galería
        if (Capacitor.getPlatform() === 'android') {
          await this.makePhotoVisible(savedFile.uri);
        }
  
        console.log('Imagen guardada en la galería');
      } catch (error) {
        console.error('Error al guardar la foto en la galería:', error);
      }
    } else {
      console.log('Esta función solo está disponible en plataformas nativas.');
    }
  }

  private async makePhotoVisible(filePath: string) {
    // Este método simula un escaneo del archivo para que sea visible en la galería
    await Filesystem.stat({
      path: filePath
    });
  }
}
