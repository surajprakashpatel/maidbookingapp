import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import {
  updateCustomerApprovalStatus,
  updateCustomerStatus,
  deleteUser as deleteUserService,
  fetchUserById,
  fetchAllCustomers,
} from '../src/lib/services/userService';
import {
  submitMaidRegistration,
  updateMaidApprovalStatus,
  deleteMaid,
  fetchMaidById,
  fetchAllMaidsAdmin,
} from '../src/lib/services/maidService';
import {
  sendAppNotification,
  notifyAdminsNewRegistration,
  subscribeToUserNotifications,
  markNotificationAsRead,
  broadcastNotification
} from '../src/lib/services/notificationService';
import {
  addCity,
  updateCity,
  toggleCityOperational,
  deleteCity,
  addLocality,
  toggleLocalityOperational,
  deleteLocality,
} from '../src/lib/services/locationManagementService';
import {
  createBooking,
  fetchBookingById,
  updateBookingStatus,
  deleteBooking,
  fetchAllBookingsAdmin,
} from '../src/lib/services/bookingService';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB9ZOjxtv32d5-UO86WOzE9Qweh1YAUb4M",
  authDomain: "maidbookingapp-4520c.firebaseapp.com",
  projectId: "maidbookingapp-4520c",
  storageBucket: "maidbookingapp-4520c.firebasestorage.app",
  messagingSenderId: "1059320135233",
  appId: "1:1059320135233:web:5cce883d3a28d2e92b10c0"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function runTest() {
  console.log('========================================================================');
  console.log('🚀 MAIDEASY: COMPREHENSIVE LOGIN -> ADMIN APPROVAL -> FULL CRUD E2E TEST');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${title}${details ? ` -> ${details}` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${title}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  let adminEmail = 'admin@maideasy.in';
  let adminPass = 'admin123';
  const testPassword = 'Password123!';

  // ======================================================================
  // Step 0: Ensure Admin Auth & Session
  // ======================================================================
  console.log('🔑 STEP 0: Authenticating as Administrator...');
  let adminUid: string = '';
  for (const pass of ['admin123', 'Password123!', 'admin@123']) {
    try {
      const cred = await signInWithEmailAndPassword(auth, adminEmail, pass);
      adminUid = cred.user.uid;
      adminPass = pass;
      break;
    } catch {}
  }
  if (!adminUid) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, adminEmail, 'Password123!');
      adminUid = cred.user.uid;
      adminPass = 'Password123!';
    } catch {
      adminEmail = `admin_${timestamp}@maideasy.in`;
      adminPass = testPassword;
      const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
      adminUid = cred.user.uid;
    }
  }

  await setDoc(doc(db, 'users', adminUid), {
    id: adminUid,
    role: 'admin',
    name: 'Platform Administrator',
    email: adminEmail,
    status: 'active',
    approvalStatus: 'approved',
    profileCompleted: true,
  }, { merge: true });

  async function asAdmin() {
    await signInWithEmailAndPassword(auth, adminEmail, adminPass);
  }

  assert(!!adminUid, 'Admin session authenticated', `Admin UID: ${adminUid}, Email: ${adminEmail}`);

  // ======================================================================
  // SUITE 1: Customer Registration & Admin Approval Request
  // ======================================================================
  console.log('\n👤 SUITE 1: Customer Registration -> Approval Status = Pending -> Admin Request Dispatched');
  const custEmail = `cust_e2e_${timestamp}@maideasy.in`;
  const custPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  let custUid: string = '';

  try {
    const custCred = await createUserWithEmailAndPassword(auth, custEmail, testPassword);
    custUid = custCred.user.uid;

    const newCustomerDoc = {
      id: custUid,
      role: 'customer' as const,
      name: 'Rohan Sharma',
      phone: custPhone,
      email: custEmail,
      location: 'Bhilai',
      city: 'Bhilai',
      area: 'Nehru Nagar',
      address: 'Plot 42, Sector 1',
      status: 'active' as const,
      approvalStatus: 'pending' as const,
      profileCompleted: true,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', custUid), newCustomerDoc);
    await setDoc(doc(db, 'customers', custUid), { ...newCustomerDoc, totalBookings: 0 });

    // Dispatch admin notification
    const notifRes = await notifyAdminsNewRegistration({
      id: custUid,
      name: newCustomerDoc.name,
      role: 'customer',
      phone: newCustomerDoc.phone,
      email: newCustomerDoc.email,
    });
    assert(notifRes, 'Admin notification successfully sent for new customer registration');
  } catch (err: any) {
    assert(false, 'Customer registration failed', err.message);
  }

  // Verify stored user & customer state
  const userDocSnap = await getDoc(doc(db, 'users', custUid));
  const userData = userDocSnap.data();
  assert(userData?.approvalStatus === 'pending', 'User document approvalStatus initialized as pending', `Got: ${userData?.approvalStatus}`);

  const custDocSnap = await getDoc(doc(db, 'customers', custUid));
  const custData = custDocSnap.data();
  assert(custData?.approvalStatus === 'pending', 'Customer document approvalStatus initialized as pending', `Got: ${custData?.approvalStatus}`);

  // ======================================================================
  // SUITE 2: Admin Receives and Queries Approval Request
  // ======================================================================
  console.log('\n📬 SUITE 2: Admin Notification Delivery & Approval Request Ingestion');
  // Switch auth context back to Administrator
  await asAdmin();

  const adminNotifsQuery = query(
    collection(db, 'notifications'),
    where('userId', 'in', [adminUid, 'admin'])
  );
  const adminNotifsSnap = await getDocs(adminNotifsQuery);
  const adminNotifs = adminNotifsSnap.docs.map(d => d.data());
  const foundNotif = adminNotifs.find(n => n.data?.targetId === custUid || n.data?.userId === custUid);

  assert(!!foundNotif, 'Admin received approval notification in Firestore notifications collection');
  assert(foundNotif?.data?.link === `/admin/users/${custUid}`, 'Notification contains direct admin approval deep-link', `Link: ${foundNotif?.data?.link}`);

  // ======================================================================
  // SUITE 3: Admin Approves Customer
  // ======================================================================
  console.log('\n👑 SUITE 3: Admin Approves Customer -> Real-time State & Notification Sync');
  const approveResult = await updateCustomerApprovalStatus(custUid, 'approved');
  assert(approveResult, 'updateCustomerApprovalStatus returned success');

  const approvedUserSnap = await getDoc(doc(db, 'users', custUid));
  assert(approvedUserSnap.data()?.approvalStatus === 'approved', 'User document updated to approved');

  const approvedCustSnap = await getDoc(doc(db, 'customers', custUid));
  assert(approvedCustSnap.data()?.approvalStatus === 'approved', 'Customer document updated to approved');

  // Verify customer received approval notification
  const custNotifsSnap = await getDocs(query(collection(db, 'notifications'), where('userId', '==', custUid)));
  const custNotifs = custNotifsSnap.docs.map(d => d.data());
  const approvalNotif = custNotifs.find(n => n.title?.includes('Approved'));
  assert(!!approvalNotif, 'Customer received profile approved notification', `Title: ${approvalNotif?.title}`);

  // ======================================================================
  // SUITE 4: Admin Rejects Customer with Reason
  // ======================================================================
  console.log('\n❌ SUITE 4: Admin Rejects Customer with Specific Reason');
  const rejectionReason = 'Incomplete address details. Please update your street address.';
  const rejectResult = await updateCustomerApprovalStatus(custUid, 'rejected', rejectionReason);
  assert(rejectResult, 'updateCustomerApprovalStatus returned success for rejection');

  const rejectedUserSnap = await getDoc(doc(db, 'users', custUid));
  assert(rejectedUserSnap.data()?.approvalStatus === 'rejected', 'User document updated to rejected');
  assert(rejectedUserSnap.data()?.rejectionReason === rejectionReason, 'User document contains rejectionReason');

  const rejectedCustSnap = await getDoc(doc(db, 'customers', custUid));
  assert(rejectedCustSnap.data()?.approvalStatus === 'rejected', 'Customer document updated to rejected');
  assert(rejectedCustSnap.data()?.rejectionReason === rejectionReason, 'Customer document contains rejectionReason');

  // ======================================================================
  // SUITE 5: Maid Partner Registration & Admin Approval Flow
  // ======================================================================
  console.log('\n🧹 SUITE 5: Maid Partner Registration -> Under Review -> Admin Rejection & Approval');
  const maidPhone = `97${Math.floor(10000000 + Math.random() * 90000000)}`;
  const maidEmail = `maid_e2e_${timestamp}@maideasy.in`;
  const maidCred = await createUserWithEmailAndPassword(auth, maidEmail, testPassword);
  const maidUid = maidCred.user.uid;
  const customMaidId = `maid-${maidUid}`;

  const maidRegRes = await submitMaidRegistration({
    name: 'Sunita Bai',
    phone: maidPhone,
    email: maidEmail,
    location: 'Bhilai',
    city: 'Bhilai',
    area: 'Smriti Nagar',
    address: 'Near Temple',
    services: ['cleaning', 'cooking'],
    serviceAreas: ['Smriti Nagar'],
    hourlyPrice: '150',
    experience: 4,
    languages: ['Hindi'],
    gender: 'female',
  } as any, maidUid);

  assert(maidRegRes.success, 'submitMaidRegistration succeeded', `Maid ID: ${maidRegRes.maidId}`);

  const maidDocSnap = await getDoc(doc(db, 'maids', customMaidId));
  const maidData = maidDocSnap.data();
  assert(maidData?.approvalStatus === 'under_review', 'Maid document initialized with approvalStatus: under_review');

  const maidUserSnap = await getDoc(doc(db, 'users', maidUid));
  assert(maidUserSnap.data()?.approvalStatus === 'under_review', 'Maid user document synced with approvalStatus: under_review');

  // Check admin received maid application notification
  await asAdmin();
  const maidAdminNotifQuery = query(collection(db, 'notifications'), where('userId', 'in', [adminUid, 'admin']));
  const maidAdminNotifSnap = await getDocs(maidAdminNotifQuery);
  const foundMaidNotif = maidAdminNotifSnap.docs.map(d => d.data()).find(n => n.data?.targetId === customMaidId || n.data?.id === customMaidId);
  assert(!!foundMaidNotif, 'Admin received approval notification for new maid application');

  // Test Maid Rejection
  const maidRejectReason = 'Please upload a clearer government identity photo.';
  const maidRejectOk = await updateMaidApprovalStatus(customMaidId, 'rejected', maidRejectReason);
  assert(maidRejectOk, 'updateMaidApprovalStatus succeeded for rejection');

  const rejectedMaidDoc = (await getDoc(doc(db, 'maids', customMaidId))).data();
  assert(rejectedMaidDoc?.approvalStatus === 'rejected', 'Maid doc updated to rejected');
  assert(rejectedMaidDoc?.rejectionReason === maidRejectReason, 'Maid doc contains rejectionReason');

  const rejectedMaidUserDoc = (await getDoc(doc(db, 'users', maidUid))).data();
  assert(rejectedMaidUserDoc?.approvalStatus === 'rejected', 'Maid user doc synced to rejected');

  // Test Maid Approval
  const maidApproveOk = await updateMaidApprovalStatus(customMaidId, 'approved');
  assert(maidApproveOk, 'updateMaidApprovalStatus succeeded for approval');

  const approvedMaidDoc = (await getDoc(doc(db, 'maids', customMaidId))).data();
  assert(approvedMaidDoc?.approvalStatus === 'approved', 'Maid doc updated to approved');
  assert(approvedMaidDoc?.isActive === true, 'Approved maid isActive set to true');

  const approvedMaidUserDoc = (await getDoc(doc(db, 'users', maidUid))).data();
  assert(approvedMaidUserDoc?.approvalStatus === 'approved', 'Maid user doc synced to approved');

  // ======================================================================
  // SUITE 6: Full Admin Entity CRUD Verification
  // ======================================================================
  console.log('\n🏢 SUITE 6: Admin Canonical CRUD Across Entities');
  await asAdmin();

  // 1. Users CRUD
  console.log('  --- Sub-suite: Users ---');
  const allCustomers = await fetchAllCustomers();
  assert(allCustomers.length > 0, 'fetchAllCustomers returns customer array', `Count: ${allCustomers.length}`);

  const pendingCustomers = await fetchAllCustomers('pending');
  assert(Array.isArray(pendingCustomers), 'fetchAllCustomers with statusFilter works');

  const suspendRes = await updateCustomerStatus(custUid, 'suspended');
  assert(suspendRes, 'updateCustomerStatus sets user to suspended');

  const delUserRes = await deleteUserService(custUid);
  assert(delUserRes, 'deleteUserService successfully deletes customer document');

  // 2. Maids CRUD
  console.log('  --- Sub-suite: Maids ---');
  const allMaids = await fetchAllMaidsAdmin();
  assert(allMaids.length > 0, 'fetchAllMaidsAdmin returns maids array', `Count: ${allMaids.length}`);

  const underReviewMaids = await fetchAllMaidsAdmin('under_review');
  assert(Array.isArray(underReviewMaids), 'fetchAllMaidsAdmin with under_review works');

  const delMaidRes = await deleteMaid(customMaidId);
  assert(delMaidRes, 'deleteMaid successfully deletes maid document');

  // 3. Locations CRUD (Cities & Localities)
  console.log('  --- Sub-suite: Locations ---');
  const testCityName = `TestCity_${timestamp}`;
  const addCityRes = await addCity(testCityName, 'Chhattisgarh', true);
  assert(addCityRes.success, 'addCity successfully creates new operational city', `ID: ${addCityRes.id}`);

  const cityId = addCityRes.id!;
  const toggleCityRes = await toggleCityOperational(cityId, false);
  assert(toggleCityRes.success, 'toggleCityOperational disables city');

  const addLocRes = await addLocality(testCityName, `Sector_${timestamp}`, true, false);
  assert(addLocRes.success, 'addLocality adds locality to city', `LocID: ${addLocRes.id}`);

  const locId = addLocRes.id!;
  const toggleLocRes = await toggleLocalityOperational(locId, false);
  assert(toggleLocRes.success, 'toggleLocalityOperational disables locality');

  const delLocRes = await deleteLocality(locId);
  assert(delLocRes.success, 'deleteLocality removes locality');

  const delCityRes = await deleteCity(cityId);
  assert(delCityRes.success, 'deleteCity removes city');

  // 4. Bookings CRUD
  console.log('  --- Sub-suite: Bookings ---');
  const testBookingRes = await createBooking({
    customerId: 'test-cust-id',
    customerName: 'Test Customer',
    customerPhone: '9999999999',
    maidId: 'test-maid-id',
    maidName: 'Test Maid',
    serviceId: 'srv-cleaning',
    serviceName: 'Deep Cleaning',
    pricingType: 'hourly',
    date: '2026-09-10',
    time: '09:00 AM',
    customerAddress: 'Test Address',
    customerArea: 'Nehru Nagar',
    serviceAmount: 300,
    tax: 0,
    discount: 0,
    bookingStatus: 'pending',
    paymentStatus: 'pending',
  });
  assert(testBookingRes.success && !!testBookingRes.bookingId, 'createBooking creates new booking in Firestore', `BookingId: ${testBookingRes.bookingId}`);

  if (testBookingRes.bookingId) {
    const updateBStatus = await updateBookingStatus(testBookingRes.bookingId, 'confirmed');
    assert(updateBStatus, 'updateBookingStatus updates booking to confirmed');

    const delBRes = await deleteBooking(testBookingRes.bookingId);
    assert(delBRes, 'deleteBooking deletes booking from Firestore');
  }

  // 5. Notifications CRUD & Broadcast
  console.log('  --- Sub-suite: Notifications & Broadcast ---');
  const sendNotifRes = await sendAppNotification({
    userId: adminUid,
    title: 'Admin Verification Test',
    message: 'System audit message',
    type: 'system',
  });
  assert(sendNotifRes, 'sendAppNotification creates notification document');

  const broadcastRes = await broadcastNotification('all', 'System Notice', 'Platform update scheduled', 'system');
  assert(broadcastRes.success, 'broadcastNotification dispatches announcement to registered accounts', `Count: ${broadcastRes.count}`);

  console.log('\n========================================================================');
  console.log(`🏁 TEST COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTest().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
