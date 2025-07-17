import { collection, addDoc,getDoc, where, query, getDocs, startAfter,
   type QueryDocumentSnapshot,
  type DocumentData, limit, orderBy, 
  updateDoc,
  doc,
  deleteDoc,
  Timestamp,
  } from "firebase/firestore"; 

import {getAuth, User, } from "firebase/auth"
import { db } from "@/utils/firebaseConfig";

interface Tenant {
  fullName: string;
  address: string;
  contactNumber: string;
  email: string;
  joiningDate: Date;

  rentAmount: number;
  securityDeposit: number;
  profession: string;
  profileImage: string;
  document: string;
  documentNumber: string;
}

export const addTenant = async ({
  currentUser,
  libraryId,
  memberData,
}: {
  currentUser: any;
  libraryId: string;
  memberData: Tenant;
}) => {
  try {
    const docRef = await addDoc(collection(db, "tenants"), {
      admin: currentUser.uid,
      libraryId,
      
      fullName: memberData.fullName,
      address: memberData.address,
      contactNumber: memberData.contactNumber,
      email: memberData.email,
      joiningDate: memberData.joiningDate,
      rentAmount: memberData.rentAmount,
      securityDeposit: memberData.securityDeposit,
      profession: memberData.profession,
      profileImage: memberData.profileImage,
      document: memberData.document,
      documentNumber: memberData.documentNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error adding tenant:", error);
    throw error;
  }
};


export const addMonthlyRent = async ({
  memberId,
  startDate,
  endDate,
  paidAmount,
  dueAmount,
  discount = 0,
}: {
  memberId: string;
  startDate: string; // e.g., "May 2025"
  endDate: string; // e.g., "May 2025"
  paidAmount: number;
  dueAmount: number;
  discount?: number;
}) => {
  try {
    const rentRef = collection(db, `tenants/${memberId}/rentPayments`);
    await addDoc(rentRef, {
      startDate,
      endDate,
      paidAmount,
      dueAmount,
      discount,
      paymentDate: new Date(),
    });
  } catch (error) {
    console.error("Error adding rent payment:", error);
    throw error;
  }
};


export const fetchTenant = async (tenantId: string) => {
  try {
    const docRef = doc(db, "tenants", tenantId);
    const docSnap = await getDoc(docRef);
    return docSnap.data();
  } catch (error) {
    console.error("Error fetching tenant:", error);
    throw error;
  }
}