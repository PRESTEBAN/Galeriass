import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { IonTextarea, ModalController } from '@ionic/angular';
import { UserServiceService } from 'src/app/services/user-service.service';
import { ChangeDetectorRef } from '@angular/core';
import { NotificationServiceService } from 'src/app/services/notification-service.service';
@Component({
  selector: 'app-response-modal',
  templateUrl: './response-modal.component.html',
  styleUrls: ['./response-modal.component.scss'],
})
export class ResponseModalComponent implements OnInit {
  @Input() noteId: string = '';
  responseContent: string = '';
  isLoading: boolean = true;
  @Input() noteTitle: string = '';
  noteCreatorEmail: string = '';
  constructor(
    private modalController: ModalController,
    private userService: UserServiceService,
    private notificationService: NotificationServiceService, 
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    console.log('Modal inicializado');
    const note = await this.userService.getNoteById(this.noteId);
    this.noteCreatorEmail = note?.createdBy || '';
    setTimeout(() => {
      this.isLoading = false;
      console.log('Loading terminado');
      this.cdr.detectChanges();
    }, 100);
  }

  async dismissModal() {
      await this.modalController.dismiss();
    }

    async submitResponse() {
      if (this.responseContent.trim()) {
        const currentUserEmail = await this.userService.getCurrentUserEmail();
        const updatedNote = await this.userService.getNoteById(this.noteId);
        
        if (updatedNote && currentUserEmail) {
          await this.userService.addResponseToNote(this.noteId, this.responseContent);
          
          if (updatedNote.responses && updatedNote.responses.length > 0) {
            // Si ya hay respuestas, notifica a todos los participantes excepto al autor actual
            const participants = new Set(updatedNote.responses.map(r => r.createdBy));
            participants.add(updatedNote.createdBy);
            participants.delete(currentUserEmail);
            
            for (const participantEmail of participants) {
              await this.notificationService.sendCommentReplyNotification(
                currentUserEmail,
                participantEmail,
                this.noteTitle
              );
            }
          } else {
            // Si no hay respuestas previas, es una respuesta directa a la nota
            await this.notificationService.sendNoteResponseNotification(
              updatedNote.createdBy,
              currentUserEmail,
              this.noteTitle
            );
          }
        }
        
        this.modalController.dismiss({ submitted: true });
      } else {
        console.log("No se puede enviar un comentario vacío");
      }
    }

  ionViewWillLeave() {
    // Limpieza al salir de la vista
    this.responseContent = '';
  }

  ionViewDidEnter() {
    setTimeout(() => {
      const textarea = document.querySelector('ion-textarea');
      if (textarea) {
        textarea.setFocus();
      }
    }, 10);
  }

  
}