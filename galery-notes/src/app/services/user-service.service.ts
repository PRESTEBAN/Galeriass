import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Firestore, collection, addDoc, doc, setDoc, getDoc, getDocs } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Storage, ref, uploadBytes, listAll, getDownloadURL } from '@angular/fire/storage';
import { User } from '@angular/fire/auth';



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

async uploadImage(imageBlob: Blob): Promise<string> {
  try {
    const filePath = `shared/images/${new Date().getTime()}.jpg`;
    const storageRef = ref(this.storage, filePath);
    await uploadBytes(storageRef, imageBlob);
    console.log('Imagen subida exitosamente:', filePath);
    return filePath;
  } catch (error) {
    console.error('Error al subir la imagen:', error);
    throw error;
  }
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

  


}