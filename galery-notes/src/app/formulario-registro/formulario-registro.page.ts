import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserServiceService } from '../services/user-service.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular'

@Component({
  selector: 'app-formulario-registro',
  templateUrl: './formulario-registro.page.html',
  styleUrls: ['./formulario-registro.page.scss'],
})
export class FormularioRegistroPage implements OnInit {
  userForm: FormGroup;

  days: number[] = Array.from({ length: 31 }, (_, i) => i + 1); // Días del 1 al 31
  months: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  years: number[] = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i); // Últimos 100 años
  
  constructor(private fb: FormBuilder, private userService: UserServiceService, private router: Router,  private alertController: AlertController) { 
    this.userForm = this.fb.group({
    nombres: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    fechaNacimiento: this.fb.group({
      dia: ['', Validators.required],
      mes: ['', Validators.required],
      anio: ['', Validators.required]
    }),
    deseo: ['', Validators.required],
    compartirNotas: ['', Validators.required],
    tomarFotos: ['', Validators.required],
    cupon: ['', Validators.required]
  }); 
  }

 async onSubmit() {
    if (this.userForm.valid) {
     try {
      const formData = this.userForm.value;
      await this.userService.saveFormData(formData)
      this.router.navigate(['/tabs/tab1']);
     } catch (error) {
      this.presentAlert('Error', 'Correo o contraseña incorrectos.');
     }
    } else {
      console.log('Formulario inválido');
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

 


  ngOnInit() {
  }

}
