import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Firestore, collection, addDoc, doc, setDoc, getDoc, getDocs, onSnapshot, query, orderBy, deleteDoc, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

interface Note {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  isNew: boolean;
  responses: Response[];
}

interface Response {
  id: string;
  content: string;
  createdBy: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserServiceService {

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private http: HttpClient,
    private storage: Storage,
  ) {}

  public allowedEmails: string[] = ['user1@example.com', 'user2@example.com'];

  async register({ email, password }: any) {
    try {
      if (!this.allowedEmails.includes(email)) {
        throw new Error('Correo no permitido');
      }

      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      return userCredential;
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      throw error;
    }
  }

  async login({ email, password }: any) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout() {
    return signOut(this.auth);
  }

  public async getCurrentUserEmail(): Promise<string | null> {
    const user = await this.auth.currentUser;
    return user ? user.email : null;
  }

  async saveFormData(formData: any) {
    const email = await this.getCurrentUserEmail();
    if (email) {
      const userCollection = collection(this.firestore, email);
      await addDoc(userCollection, formData);
      console.log('Formulario guardado exitosamente');
    } else {
      throw new Error('No user authenticated');
    }
  }

  async getFormData() {
    const email = await this.getCurrentUserEmail();
    if (email) {
      const userCollection = collection(this.firestore, email);
      const querySnapshot = await getDocs(userCollection);
      return querySnapshot.docs.map(doc => doc.data());
    } else {
      throw new Error('No user authenticated');
    }
  }

  async getUserName(): Promise<string> {
    const email = await this.getCurrentUserEmail();
    if (email) {
      const userCollection = collection(this.firestore, email);
      const querySnapshot = await getDocs(userCollection);
      const userData = querySnapshot.docs[0]?.data() as { nombres?: string };
      return userData?.nombres || '';
    } else {
      throw new Error('No user authenticated');
    }
  }

  async uploadImage(imageBlob: Blob): Promise<void> {
    try {
      const filePath = `shared/images/${new Date().getTime()}.jpg`;
      const storageRef = ref(this.storage, filePath);
      await uploadBytes(storageRef, imageBlob);
      
      const downloadURL = await getDownloadURL(storageRef);
      const currentUserEmail = await this.getCurrentUserEmail();
      
      if (currentUserEmail) {
        await this.saveImageURLToFirestore(downloadURL, currentUserEmail);
        console.log('Imagen subida y URL guardada en Firestore:', downloadURL);
      } else {
        console.error('No se pudo obtener el correo electrónico del usuario actual');
        // You might want to throw an error here or handle this case differently
        throw new Error('No user authenticated');
      }
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      throw error;
    }
  }
  
  private async saveImageURLToFirestore(downloadURL: string, currentUserEmail: string): Promise<void> {
    const imagesCollection = collection(this.firestore, 'shared-images');
    await addDoc(imagesCollection, { 
      url: downloadURL, 
      timestamp: new Date(), 
      isNew: true,
      viewedBy: [currentUserEmail],
      uploadedBy: currentUserEmail // Añadimos esta línea
    });
  }

  async getUserImages(): Promise<any[]> {
    const imagesCollection = collection(this.firestore, 'shared-images');
    const imagesQuery = query(imagesCollection, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(imagesQuery);
    return querySnapshot.docs.map(doc => ({
      url: doc.data()['url'],
      id: doc.id,
      isNew: doc.data()['isNew'] || false,
      viewedBy: doc.data()['viewedBy'] || [],
      timestamp: doc.data()['timestamp'],
      uploadedBy: doc.data()['uploadedBy'] // Añadimos esta línea
    }));
  }

  async getCurrentUser(): Promise<User | null> {
    return this.auth.currentUser;
  }

  async getOtherUserEmail(currentUserEmail: string): Promise<string | undefined> {
    const otherEmail = this.allowedEmails.find(email => email !== currentUserEmail);
    if (!otherEmail) {
      console.error('No se encontró el correo del otro usuario');
    }
    return otherEmail;
  }

  getImagesInRealTime(): Observable<any[]> {
    const imagesCollection = collection(this.firestore, 'shared-images');
    const imagesQuery = query(imagesCollection, orderBy('timestamp', 'desc'));
    return new Observable(observer => {
      onSnapshot(imagesQuery, async (snapshot) => {
        const urls = await Promise.all(snapshot.docs.map(async doc => {
          const data = doc.data();
          return {
            url: data['url'],
            id: doc.id,
            isNew: data['isNew'] || false,
            viewedBy: data['viewedBy'] || [],
            timestamp: data['timestamp'],
            uploadedBy: data['uploadedBy'] 
          };
        }));
        observer.next(urls);
      });
    });
  }

  async markImageAsViewed(imageId: string, userEmail: string) {
    const imageRef = doc(this.firestore, 'shared-images', imageId);
    const imageDoc = await getDoc(imageRef);
    
    if (imageDoc.exists()) {
      const imageData = imageDoc.data();
      const viewedBy = imageData['viewedBy'] || [];
      
      if (!viewedBy.includes(userEmail)) {
        viewedBy.push(userEmail);
        await setDoc(imageRef, { viewedBy }, { merge: true });
        
        if (viewedBy.length === 2) {
          await setDoc(imageRef, { isNew: false }, { merge: true });
        }
      }
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    try {
      const imageRef = doc(this.firestore, 'shared-images', imageId);
      await deleteDoc(imageRef);
      
      // Si también quieres eliminar la imagen del storage
      const imageDoc = await getDoc(imageRef);
      if (imageDoc.exists()) {
        const imageUrl = imageDoc.data()['url'];
        const storageRef = ref(this.storage, imageUrl);
        await deleteObject(storageRef);
      }
      
      console.log('Imagen eliminada de Firestore y Storage');
    } catch (error) {
      console.error('Error al eliminar la imagen:', error);
      throw error;
    }
  }

  async getNotes() {
    const email = await this.getCurrentUserEmail();
    if (email) {
      const notesCollection = collection(this.firestore, `${email}-notes`);
      const querySnapshot = await getDocs(notesCollection);
      return querySnapshot.docs.map(doc => doc.data());
    } else {
      throw new Error('No user authenticated');
    }
  }


  async saveNoteShared(noteData: any) {
    const currentUserEmail = await this.getCurrentUserEmail();
    if (!currentUserEmail) {
      throw new Error('No user authenticated');
    }
  
    const otherUserEmail = await this.getOtherUserEmail(currentUserEmail);
    if (!otherUserEmail) {
      throw new Error('No other user found');
    }
  
    const newNote = {
      ...noteData,
      createdBy: currentUserEmail,
      isNew: true,
      newFor: otherUserEmail,
      responses: []
    };
  
    const sharedNotesCollection = collection(this.firestore, 'shared-notes');
    const docRef = await addDoc(sharedNotesCollection, newNote);
    console.log('Nota guardada exitosamente en la colección compartida');
    return { id: docRef.id, ...newNote };
  }

  getSharedNotesRealTime(): Observable<any[]> {
    const sharedNotesCollection = collection(this.firestore, 'shared-notes');
    return new Observable(observer => {
      const unsubscribe = onSnapshot(sharedNotesCollection, async (snapshot) => {
        const currentUserEmail = await this.getCurrentUserEmail();
        if (!currentUserEmail) {
          observer.error(new Error('No user authenticated'));
          return;
        }
  
        const notes = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            isNew: data['newFor'] === currentUserEmail && data['isNew']
          };
        });
        observer.next(notes);
      }, error => {
        observer.error(error);
      });
      
      return () => unsubscribe();
    });
  }
  

  async updateSharedNote(noteId: string, noteData: any) {
    if (!noteId || !noteData) {
      throw new Error('ID de nota o datos de nota no proporcionados');
    }
    const noteRef = doc(this.firestore, 'shared-notes', noteId);
    const currentNote = await getDoc(noteRef);
    if (currentNote.exists()) {
      const updatedNote = {
        ...currentNote.data(),
        ...noteData,
        createdBy: currentNote.data()['createdBy'],
        isNew: false 
      };
      await setDoc(noteRef, updatedNote);
      console.log('Nota actualizada exitosamente');
      return { id: noteId, ...updatedNote };
    } else {
      throw new Error('Nota no encontrada');
    }
  }
  
  async deleteSharedNote(noteId: string): Promise<void> {
    const noteRef = doc(this.firestore, 'shared-notes', noteId);
    const noteDoc = await getDoc(noteRef);
  
    if (noteDoc.exists()) {
      const noteData = noteDoc.data();
      const currentUserEmail = await this.getCurrentUserEmail();
  
      // Asegúrate de usar la notación de corchetes para acceder a 'createdBy'
      if (noteData['createdBy'] === currentUserEmail) {
        await deleteDoc(noteRef);
        console.log('Nota eliminada exitosamente');
      } else {
        throw new Error('No tienes permiso para eliminar esta nota');
      }
    } else {
      throw new Error('Nota no encontrada');
    }
  }

  async markNoteAsRead(noteId: string) {
    const noteRef = doc(this.firestore, 'shared-notes', noteId);
    await setDoc(noteRef, { isNew: false, newFor: null }, { merge: true });
  }

  async addResponseToNote(noteId: string, responseContent: string) {
    const currentUserEmail = await this.getCurrentUserEmail();
    if (!currentUserEmail) {
      throw new Error('No user authenticated');
    }
  
    const noteRef = doc(this.firestore, 'shared-notes', noteId);
    const responseRef = doc(collection(this.firestore, 'shared-notes', noteId, 'responses'));
    const newResponse = {
      id: responseRef.id, // Esto generará un ID único automáticamente
      content: responseContent,
      createdBy: currentUserEmail,
      timestamp: new Date()
    };
  
    await updateDoc(noteRef, {
      responses: arrayUnion(newResponse),
      isNew: true,
      newFor: await this.getOtherUserEmail(currentUserEmail)
    });
  
    return newResponse;
  }

  async getNoteById(noteId: string): Promise<Note | undefined> {
    const noteRef = doc(this.firestore, 'shared-notes', noteId);
    const noteDoc = await getDoc(noteRef);
    return noteDoc.exists() ? { id: noteDoc.id, ...noteDoc.data() } as Note : undefined;
  }
  
  

}