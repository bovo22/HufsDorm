import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../firebase/config';

export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

// HUFSDORM 합격 화면 이미지 업로드 → 관리자 수동 승인 대기
export async function submitAcceptanceImage(uid: string, imageUri: string): Promise<void> {
  const blob = await (await fetch(imageUri)).blob();
  const storageRef = ref(storage, `verifications/${uid}/acceptance.jpg`);
  await uploadBytes(storageRef, blob);
  const downloadUrl = await getDownloadURL(storageRef);

  await updateDoc(doc(db, 'users', uid), {
    verificationStatus: 'pending' as VerificationStatus,
    acceptanceImageUrl: downloadUrl,
  });
}
