import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Firestore, collection, addDoc, doc, setDoc, getDoc, getDocs, onSnapshot, collectionData, query, orderBy } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Storage, ref, uploadBytes, listAll, getDownloadURL } from '@angular/fire/storage';
import { User } from '@angular/fire/auth';
import { Observable } from 'rxjs';


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
      await this.saveImageURLToFirestore(downloadURL);
      console.log('Imagen subida y URL guardada en Firestore:', downloadURL);
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      throw error;
    }
  }
  
  private async saveImageURLToFirestore(downloadURL: string): Promise<void> {
    const imagesCollection = collection(this.firestore, 'shared-images');
    await addDoc(imagesCollection, { url: downloadURL, timestamp: new Date() });
  }
  

  async getUserImages(): Promise<string[]> {
    const imagesRef = ref(this.storage, 'shared/images');
    const imagesList = await listAll(imagesRef);
    const urls = await Promise.all(
      imagesList.items.map(async (itemRef) => await getDownloadURL(itemRef))
    );
    return urls;
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

  getImagesInRealTime(): Observable<string[]> {
    const imagesCollection = collection(this.firestore, 'shared-images');
    const imagesQuery = query(imagesCollection, orderBy('timestamp', 'desc'));
    return new Observable(observer => {
      onSnapshot(imagesQuery, async (snapshot) => {
        const urls = await Promise.all(snapshot.docs.map(async doc => doc.data()['url']));
        observer.next(urls);
      });
    });
  }  

}
  