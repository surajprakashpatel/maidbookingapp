import { ref, uploadBytes, getDownloadURL, deleteObject, uploadString } from 'firebase/storage';
import { storage } from '../firebase/config';

/**
 * Upload a File object to Firebase Storage
 * @param path Storage path (e.g. 'maids/profile-photos/maid123.jpg')
 * @param file File object
 * @returns Public download URL
 */
export async function uploadFile(path: string, file: File): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error(`Firebase Storage upload error at [${path}]:`, error);
    throw error;
  }
}

/**
 * Upload a Base64/DataURL string (e.g. captured live selfie) to Firebase Storage
 * @param path Storage path (e.g. 'maids/selfies/maid123.png')
 * @param dataUrl Base64 data URL string
 * @returns Public download URL
 */
export async function uploadDataUrl(path: string, dataUrl: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadString(storageRef, dataUrl, 'data_url');
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error(`Firebase Storage dataUrl upload error at [${path}]:`, error);
    throw error;
  }
}

/**
 * Delete a file from Firebase Storage
 * @param path Storage path or full URL
 */
export async function deleteStorageFile(path: string): Promise<boolean> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.warn(`Firebase Storage delete warning at [${path}]:`, error);
    return false;
  }
}
