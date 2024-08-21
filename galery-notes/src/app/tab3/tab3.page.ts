import { Component } from '@angular/core';
import { UserServiceService } from '../services/user-service.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  constructor(
    private userService: UserServiceService,
    private router: Router,
    private alertController: AlertController
  ) {}

  async logout() {
    try {
      await this.userService.logout();
      this.router.navigate(['/principal']); // Redirige al usuario a la página de login
    } catch (error) {
      this.presentAlert('Error', 'No se pudo cerrar la sesión. Inténtalo de nuevo.');
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }
}
