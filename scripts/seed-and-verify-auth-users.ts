import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB9ZOjxtv32d5-UO86WOzE9Qweh1YAUb4M",
  authDomain: "maidbookingapp-4520c.firebaseapp.com",
  projectId: "maidbookingapp-4520c",
  storageBucket: "maidbookingapp-4520c.firebasestorage.app",
  messagingSenderId: "1059320135233",
  appId: "1:1059320135233:web:5cce883d3a28d2e92b10c0"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

interface DemoAccount {
  email: string;
  pass: string;
  role: 'admin' | 'customer' | 'maid';
  name: string;
  phone: string;
  city: string;
  area: string;
  address: string;
  maidDetails?: {
    services: string[];
    experience: number;
    hourlyPrice: number;
    dailyPrice: number;
    monthlyPrice: number;
    bio: string;
    profilePhoto: string;
  };
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'admin@maideasy.in',
    pass: 'admin123',
    role: 'admin',
    name: 'Platform Administrator',
    phone: '9000000001',
    city: 'Bhilai',
    area: 'Civic Centre',
    address: 'HQ Administrative Block, Bhilai',
  },
  {
    email: 'rahul.gupta@gmail.com',
    pass: 'Password123!',
    role: 'customer',
    name: 'Rahul Gupta',
    phone: '9876500001',
    city: 'Bhilai',
    area: 'Sector 7',
    address: 'House No. 42, Sector 7, Bhilai',
  },
  {
    email: 'sunita.verma@gmail.com',
    pass: 'Password123!',
    role: 'maid',
    name: 'Sunita Verma',
    phone: '9876543210',
    city: 'Bhilai',
    area: 'Nehru Nagar',
    address: 'House 12, Street 4, Nehru Nagar',
    maidDetails: {
      services: ['Cleaning', 'Cooking', 'House Help'],
      experience: 6,
      hourlyPrice: 150,
      dailyPrice: 450,
      monthlyPrice: 3500,
      bio: 'Experienced household cook and cleaning specialist with 6+ years of service in Bhilai.',
      profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    }
  },
  {
    email: 'priya.sharma@gmail.com',
    pass: 'Password123!',
    role: 'maid',
    name: 'Priya Sharma',
    phone: '9876543211',
    city: 'Bhilai',
    area: 'Sector 7',
    address: 'Quarter 14B, Sector 7',
    maidDetails: {
      services: ['Babysitting', 'Elder Care', 'House Help'],
      experience: 4,
      hourlyPrice: 180,
      dailyPrice: 500,
      monthlyPrice: 4000,
      bio: 'Patient and caring nanny & elder care attendant with training in basic first aid.',
      profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    }
  }
];

async function seedAndVerify() {
  console.log('====================================================');
  console.log('🚀 SEEDING & VERIFYING ALL DEMO / TEST CREDENTIALS');
  console.log('====================================================\n');

  // Step 1: Ensure Admin is created and authenticated first
  const adminAcc = DEMO_ACCOUNTS[0];
  let adminUid: string;
  try {
    const cred = await signInWithEmailAndPassword(auth, adminAcc.email, adminAcc.pass);
    adminUid = cred.user.uid;
  } catch {
    const cred = await createUserWithEmailAndPassword(auth, adminAcc.email, adminAcc.pass);
    adminUid = cred.user.uid;
  }

  await setDoc(doc(db, 'users', adminUid), {
    id: adminUid,
    role: 'admin',
    name: adminAcc.name,
    email: adminAcc.email,
    phone: adminAcc.phone,
    location: adminAcc.city,
    city: adminAcc.city,
    area: adminAcc.area,
    address: adminAcc.address,
    status: 'active',
    profileCompleted: true,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  console.log(`👑 Admin authenticated & verified: ${adminAcc.email} (UID: ${adminUid})`);

  // Process all accounts
  for (const acc of DEMO_ACCOUNTS) {
    if (acc.email === adminAcc.email) continue;

    let uid: string;
    try {
      const cred = await signInWithEmailAndPassword(auth, acc.email, acc.pass);
      uid = cred.user.uid;
      console.log(`\n🔑 User authenticated: ${acc.email} (UID: ${uid})`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        const newCred = await createUserWithEmailAndPassword(auth, acc.email, acc.pass);
        uid = newCred.user.uid;
        console.log(`\n✨ Created user in Firebase Auth: ${acc.email} (UID: ${uid})`);
      } else {
        console.error(`❌ Error on ${acc.email}:`, err.message);
        continue;
      }
    }

    const userPayload = {
      id: uid,
      role: acc.role,
      name: acc.name,
      email: acc.email,
      phone: acc.phone,
      location: acc.city,
      city: acc.city,
      area: acc.area,
      address: acc.address,
      status: 'active',
      profileCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', uid), userPayload, { merge: true });
    console.log(`   └─ ✅ Firestore /users/${uid} written (${acc.role})`);

    if (acc.role === 'customer') {
      await setDoc(doc(db, 'customers', uid), {
        ...userPayload,
        totalBookings: 1,
      }, { merge: true });
      console.log(`   └─ ✅ Firestore /customers/${uid} linked`);
    } else if (acc.role === 'maid' && acc.maidDetails) {
      // Re-auth as Admin to write approved maid record with full permissions
      await signOut(auth);
      await signInWithEmailAndPassword(auth, adminAcc.email, adminAcc.pass);

      const maidDocRef = doc(db, 'maids', `maid-${uid}`);
      await setDoc(maidDocRef, {
        id: `maid-${uid}`,
        userId: uid,
        name: acc.name,
        email: acc.email,
        phone: acc.phone,
        gender: 'female',
        location: acc.city,
        city: acc.city,
        area: acc.area,
        address: acc.address,
        serviceAreas: [acc.area, 'Civic Centre', 'Sector 6', 'Nehru Nagar'],
        services: acc.maidDetails.services,
        experience: acc.maidDetails.experience,
        qualification: 'Graduate',
        bio: acc.maidDetails.bio,
        hourlyPrice: acc.maidDetails.hourlyPrice,
        dailyPrice: acc.maidDetails.dailyPrice,
        monthlyPrice: acc.maidDetails.monthlyPrice,
        availability: 'available',
        rating: 4.9,
        totalRatings: 18,
        totalBookings: 32,
        completedBookings: 31,
        approvalStatus: 'approved',
        verificationStatus: 'verified',
        selfieStatus: 'verified',
        aadhaarMasked: 'XXXX-XXXX-8921',
        profilePhoto: acc.maidDetails.profilePhoto,
        isActive: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      console.log(`   └─ ✅ Firestore /maids/maid-${uid} approved and verified`);
    }
  }

  // Final verification test: sign in with all 4 accounts
  console.log('\n--- VERIFYING ALL 4 LOGINS VIA FIREBASE AUTH ---');
  for (const acc of DEMO_ACCOUNTS) {
    await signOut(auth);
    const cred = await signInWithEmailAndPassword(auth, acc.email, acc.pass);
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    console.log(`✅ [LOGIN SUCCESS] ${acc.email} (${acc.role}) -> UID: ${cred.user.uid} | Profile: ${userDoc.data()?.name}`);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL 4 ACCOUNTS FULLY SEEDED, AUTHENTICATED & READY FOR LIVE LOGIN!');
  console.log('====================================================\n');
}

seedAndVerify().catch(console.error);
