import { Component } from '@angular/core';
import { UserServiceService } from '../services/user-service.service';
import { NoteModalComponent } from '../components/note-modal/note-modal.component';
import { ModalController, ActionSheetController, ToastController } from '@ionic/angular'; // Importar ActionSheetController
import { Subscription } from 'rxjs';
import { NotificationServiceService } from '../services/notification-service.service';
import { ResponseModalComponent } from '../components/ResponseModal/response-modal/response-modal.component';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  userName: string = '';
  notes: any[] = [];
  private notesSubscription: Subscription = new Subscription;
  userEmail: string = '';

  constructor(
    private userService: UserServiceService,
    private modalController: ModalController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private notificationService: NotificationServiceService // Agregar ActionSheetController
  ) {
    this.subscribeToNoteUpdates();
  }
    
  async ngOnInit(): Promise<void> {
    this.loadUserName();
    this.subscribeToNotes();
    this.userEmail = await this.userService.getCurrentUserEmail() || '';
  }

  ngOnDestroy(): void {
    if (this.notesSubscription) {
      this.notesSubscription.unsubscribe();
    }
  }

  async loadUserName() {
    try {
      this.userName = await this.userService.getUserName();
    } catch (error) {
      console.error('Error al obtener el nombre del usuario:', error);
    }
  }

  private subscribeToNoteUpdates() {
    this.userService.getSharedNotesRealTime().subscribe(notes => {
      this.notes = notes.map(note => ({
        ...note,
        isNew: note.isNew && note.createdBy !== this.userEmail
      }));
    });
  }

  async markNoteAsRead(note: any) {
    if (note.isNew && note.createdBy !== this.userEmail) {
      await this.userService.markNoteAsRead(note.id);
      note.isNew = false;
    }
  }

  subscribeToNotes() {
    this.notesSubscription = this.userService.getSharedNotesRealTime().subscribe(
      (notes) => {
        this.notes = notes;
      },
      (error) => {
        console.error('Error al cargar las notas:', error);
      }
    );
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    toast.present();
  }



  async openNewNote() {
    const modal = await this.modalController.create({
      component: NoteModalComponent,
      cssClass: 'custom-modal',
      backdropDismiss: true,
      showBackdrop: true
    });
  
   modal.onDidDismiss().then(async (result: any) => {
    if (result.data && result.data.note) {
      const newNote = {
        ...result.data.note,
        createdBy: this.userEmail,
        isNew: true
      };
      await this.userService.saveNoteShared(newNote);
      this.presentToast('Nota creada exitosamente');

      if (newNote.isNew) {
        await this.sendNoteNotification(newNote);
      }
    }
  });
    
    return await modal.present();
  }

  async sendNoteNotification(note: any) {
    try {
      const currentUserEmail = await this.userService.getCurrentUserEmail();
      if (currentUserEmail) {
        const message = `${currentUserEmail} ha creado una nueva nota: ${note.title}`;
        await this.notificationService.sendNotification(currentUserEmail, message);
        console.log('Notificación enviada con éxito');
      } else {
        console.error('No se pudo obtener el correo electrónico del usuario actual');
      }
    } catch (error) {
      console.error('Error al enviar la notificación:', error);
    }
  }

  
  async openEditNoteModal(note: any) {
    const modal = await this.modalController.create({
      component: NoteModalComponent,
      componentProps: { 
        noteTitle: note.title, 
        noteContent: note.content,
        noteId: note.id
      },
      cssClass: 'custom-modal',
      backdropDismiss: true,
      showBackdrop: true
    });
  
    modal.onDidDismiss().then(async (result: any) => {
      if (result.data && result.data.note) {
        const updatedNote = {
          ...result.data.note,
          id: note.id,
          createdBy: note.createdBy
        };
        await this.userService.updateSharedNote(note.id, updatedNote);
        this.presentToast('Nota actualizada exitosamente');
      }
    });
  
    return await modal.present();
  }

  
  async presentActionSheet(note: any) {
    const currentUserEmail = await this.userService.getCurrentUserEmail();
      
  
    if (note.createdBy === currentUserEmail) {
      const actionSheet = await this.actionSheetController.create({
        header: 'Opciones',
        buttons: [
          {
            text: 'Editar',
            icon: 'create',
            handler: () => {
              this.openEditNoteModal(note);
            }
          },
          {
            text: 'Eliminar',
            icon: 'trash',
            role: 'destructive',
            handler: async () => {
              await this.userService.deleteSharedNote(note.id);
              this.notes = this.notes.filter(n => n.id !== note.id);
              this.presentToast('Nota eliminada');
            }
          },
          {
            text: 'Cancelar',
            icon: 'close',
            role: 'cancel'
          }
        ]
      });
      await actionSheet.present();
    } else {
      await this.presentToast('No tienes permiso para editar o eliminar esta nota');
    }
  }

  async openResponseModal(note: any) {
    try {
      await this.modalController.dismiss(); // Intenta cerrar cualquier modal existente
    } catch (error) {
      console.log('No hay modal para cerrar');
    }
    
    const modal = await this.modalController.create({
      component: ResponseModalComponent,
      componentProps: { noteId: note.id, noteTitle: note.title },
    });
    
    return await modal.present();
  }

  isContentOverflowing(note: any): boolean {
    // Implementa la lógica para determinar si el contenido es demasiado largo
    return note.content.length > 200; // Ajusta este valor según sea necesario
  }
  
  toggleExpand(note: any): void {
    note.expanded = !note.expanded;
  }

  
  
}