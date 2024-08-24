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
      viewedBy: [currentUserEmail], // Add the current user to viewedBy
      uploadedBy: currentUserEmail // Add this field to track who uploaded the image
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
      timestamp: doc.data()['timestamp']
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
            timestamp: data['timestamp']
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

}
  