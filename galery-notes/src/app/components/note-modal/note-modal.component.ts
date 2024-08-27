import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AlertController } from '@ionic/angular'; 

@Component({
  selector: 'app-note-modal',
  templateUrl: './note-modal.component.html',
  styleUrls: ['./note-modal.component.scss'],
})
export class NoteModalComponent  implements OnInit {
  noteTitle: string = '';
  noteContent: string = '';

  constructor(private modalController: ModalController,private alertController: AlertController) { }

  ngOnInit() {}
  
  dismiss() {
    this.modalController.dismiss();
  }

  async saveNote() {
    if (!this.noteTitle.trim() || !this.noteContent.trim()) {
      const alert = await this.alertController.create({
        header: 'Campos obligatorios',
        message: 'El título y el contenido de la nota son obligatorios.',
        buttons: ['OK'],
        cssClass: 'custom-alert' 
      });
      await alert.present();
      return; 
    }

    const note = {
      title: this.noteTitle,
      content: this.noteContent,
      date: new Date()
    };

    this.modalController.dismiss({ note });
  }
  
  
  
}
