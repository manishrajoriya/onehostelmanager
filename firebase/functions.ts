

import { collection, addDoc,getDoc, where, query, getDocs, startAfter,
   type QueryDocumentSnapshot,
  type DocumentData, limit, orderBy, 
  updateDoc,
  doc,
  deleteDoc,
  } from "firebase/firestore"; 

import {getAuth, User, } from "firebase/auth"
import { db } from "@/utils/firebaseConfig";


type PlanData = {
  name: string;
  description: string;
  duration: string;
  amount: string;
};

export async function addLibrary({data, currentUser}: {data: any, currentUser: any}){
 try {
  if (!currentUser) {
    throw new Error('User not authenticated. Redirecting to sign-in...');
  }
  const libraryRef = await addDoc(collection(db, 'libraries'), {
    name: data.name,
    address: data.address,
    description: data.description,
    admin: currentUser.uid
  });
  return "Library added successfully"
 } catch (error) {
  console.error('Error adding library.');
  throw error;
 }
}

export async function getLibraries({currentUser}: {currentUser: any}){
  try {
    if (!currentUser) {
      return []
    }
    const q = query(collection(db, 'libraries'), where('admin', '==', currentUser.uid));
    const librariesSnapshot = await getDocs(q);
    const libraries = librariesSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, address: doc.data().address, description: doc.data().description }));
    return libraries
   } catch (error) {
    console.error('1Error getting libraries:', error);
    throw error;
   }
}

export async function deleteLibrary({ id }: { id: string }) {
  try {
    const libraryRef = doc(db, 'libraries', id);
    await deleteDoc(libraryRef);
    console.log('Library deleted successfully');
  } catch (error) {
    console.error('Error deleting library:', error);
    throw error;
  }
}

export async function updateLibrary({ id, data }: { id: string, data: any }) {
  try {
   
    await updateDoc(doc(db, 'libraries', id), {
      name: data.name,
      address: data.address,
      description: data.description
    });
    // console.log('Library updated successfully');
  } catch (error) {
    console.error('Error updating library:', error);
    throw error;
  }
}

export async function createPlan({ data, currentUser, libraryId }: { data: PlanData, currentUser: any, libraryId: string }) {
  try {
    if (!currentUser) {
      throw new Error('User not authenticated. Redirecting to sign-in...');
    }

    // Create the plan in the Firestore database
   const planRef = await addDoc(collection(db, 'plans'), {
     name: data.name,
     description: data.description,
     duration: data.duration,
     amount: data.amount,
     admin: currentUser.uid,
     libraryId: libraryId
   });

    // console.log('Plan created successfully with ID:', planRef.id);
    return { id: planRef.id, ...data,  };
  } catch (error: any) {
    console.error('Unable to create plan:', error.message);
    throw error; // Re-throw the error for handling by the caller
  }
}

export async function getPlans({currentUser, libraryId}: {currentUser: any, libraryId: string}) {
  try {
    if (!currentUser) {
      throw new Error('User not authenticated. Redirecting to sign-in...');
    }
    
    const q = query(collection(db, 'plans'), where('admin', '==', currentUser.uid), where('libraryId', '==', libraryId));
    const plansSnapshot = await getDocs(q);
    
    const plans = plansSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, description: doc.data().description, duration: doc.data().duration, amount: doc.data().amount  }));
    // console.log('Plans fetched successfully:', plans);
    
    return plans;
  } catch (error: any) {
    console.error('Unable to get plans:', error.message);
    throw error; // Re-throw the error for handling by the caller
  }
}

export async function getPlanById({ id, }: { id: string, }) {
  try {
    const planRef = doc(db, 'plans', id);
    const planSnapshot = await getDoc(planRef);
    
    if (!planSnapshot.exists()) {
      throw new Error('Plan not found');
    }
    
    const planData = planSnapshot.data();
    
    return { id, name: planData.name, description: planData.description, duration: planData.duration, amount: planData.amount };
  } catch (error: any) {
    console.error('Unable to get plan:', error.message);
    throw error; // Re-throw the error for handling by the caller
  }
}

export async function updatePlan({ id, data, currentUser,  }: { id: string, data: PlanData, currentUser: any, }) {
  try {
    // Get the current user
    if (!currentUser) {
      throw new Error('User not authenticated. Redirecting to sign-in...');
    }

    // Update the plan in the Firestore database
    const planRef = doc(db, 'plans', id);
    await updateDoc(planRef, data);
    
    return { id, ...data };
  } catch (error: any) {
    console.error('Unable to update plan:', error.message);
    throw error; // Re-throw the error for handling by the caller
  }
}

export async function deletePlan({ id }: { id: string }) {
  try {
    // Get the current user
    const currentUser =  getAuth().currentUser
    if (!currentUser) {
      throw new Error('User not authenticated. Redirecting to sign-in...');
    }

    // Delete the plan from the Firestore database
    const planRef = doc(db, 'plans', id);
    await deleteDoc(planRef);
    console.log('Plan deleted successfully:', id);
    return id;
  } catch (error: any) {
    console.error('Unable to delete plan:', error.message);
    throw error; // Re-throw the error for handling by the caller
  }
}

export async function addMember({currentUser, libraryId, data}: {currentUser: User, libraryId: string, data: any}) {
  try {
    // Get the current user
    // const currentUser = getAuth().currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated. Redirecting to sign-in...");
    }

    // Create the member in the Firestore database
    const memberRef = await addDoc(collection(db, "members"), {
      admin: currentUser.uid,
      libraryId: libraryId,
      fullName: data?.fullName,
      address: data?.address,
      contactNumber: data?.contactNumber,
      email: data?.email,
      addmissionDate: data?.admissionDate,
      expiryDate: data?.expiryDate,
      profileImage: data?.profileImage,
      document: data?.document,
      dueAmount: data?.dueAmount,
      totalAmount: data?.totalAmount,
      paidAmount: data?.paidAmount,
      discount: data?.discount,
      advanceAmount: data?.advanceAmount,
      planId: data?.planId,
      plan: data?.plan,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("Member created successfully with ID:", memberRef.id);
    return memberRef.id;
  } catch (error: any) {
    console.error("Unable to create member:", error.message);
    throw error; // Re-throw the error for handling by the caller
  }
}


export async function getMembers({ pageSize, lastVisible, currentUser, libraryId }: { pageSize: number, lastVisible: QueryDocumentSnapshot<DocumentData> | undefined, currentUser: any, libraryId: string }) {
  try {
    
    if (!currentUser) {
      throw new Error("User not authenticated. Redirecting to sign-in...");
    }

    let q = query(
      collection(db, "members"),
      where("admin", "==", currentUser.uid),
      where("libraryId", "==", libraryId),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    // Apply pagination if a last visible document exists
    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const membersSnapshot = await getDocs(q);

    const members = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      fullName: doc.data().fullName,
      address: doc.data().address,
      contactNumber: doc.data().contactNumber,
      email: doc.data().email,
      addmissionDate: doc.data().addmissionDate.toDate(),
      expiryDate: doc.data().expiryDate.toDate(),
      profileImage: doc.data().profileImage,
      document: doc.data().document,
      dueAmount: doc.data().dueAmount,
      totalAmount: doc.data().totalAmount,
      paidAmount: doc.data().paidAmount,
      discount: doc.data().discount,
      advanceAmount: doc.data().advanceAmount,
      planId: doc.data().planId,
      plan: doc.data().plan,
      createdAt: doc.data().createdAt,
      updatedAt: doc.data().updatedAt,
    }));

    // Get the last document for pagination
    const lastVisibleDoc = membersSnapshot.docs[membersSnapshot.docs.length - 1];

    // Determine if there are more members to fetch
    const hasMore = membersSnapshot.docs.length === pageSize;

    return { members, lastVisibleDoc, hasMore };
  } catch (error: any) {
    console.error("Unable to get members:", error.message);
    throw error;
  }
}

export async function getExpiredMembers({ pageSize, lastVisible, currentUser, libraryId }: { pageSize: number, lastVisible: QueryDocumentSnapshot<DocumentData> | undefined, currentUser: any, libraryId: string }) {
  try {
    
    if (!currentUser) {
      throw new Error("User not authenticated. Redirecting to sign-in...");
    }

    let q = query(
      collection(db, "members"),
      where("admin", "==", currentUser.uid),
      where("libraryId", "==", libraryId),
      where("expiryDate", "<", new Date()),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    // Apply pagination if a last visible document exists
    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const membersSnapshot = await getDocs(q);

    const members = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      fullName: doc.data().fullName,
      address: doc.data().address,
      contactNumber: doc.data().contactNumber,
      email: doc.data().email,
      addmissionDate: doc.data().addmissionDate.toDate(),
      expiryDate: doc.data().expiryDate.toDate(),
      profileImage: doc.data().profileImage,
      document: doc.data().document,
      dueAmount: doc.data().dueAmount,
      totalAmount: doc.data().totalAmount,
      paidAmount: doc.data().paidAmount,
      planId: doc.data().planId,
      plan: doc.data().plan,
      createdAt: doc.data().createdAt,
      updatedAt: doc.data().updatedAt,
    }));

    // Get the last document for pagination
    const lastVisibleDoc = membersSnapshot.docs[membersSnapshot.docs.length - 1];

    // Determine if there are more members to fetch
    const hasMore = membersSnapshot.docs.length === pageSize;

    return { members, lastVisibleDoc, hasMore };
  } catch (error: any) {
    console.error("Unable to get members:", error.message);
    throw error;
  }
}

export async function getLiveMembers({ pageSize, lastVisible, currentUser, libraryId }: { pageSize: number, lastVisible: QueryDocumentSnapshot<DocumentData> | undefined, currentUser: any, libraryId: string }) {
  try {
    
    if (!currentUser) {
      throw new Error("User not authenticated. Redirecting to sign-in...");
    }

    let q = query(
      collection(db, "members"),
      where("admin", "==", currentUser.uid),
      where("libraryId", "==", libraryId),
      where("expiryDate", ">", new Date()),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    // Apply pagination if a last visible document exists
    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const membersSnapshot = await getDocs(q);

    const members = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      fullName: doc.data().fullName,
      address: doc.data().address,
      contactNumber: doc.data().contactNumber,
      email: doc.data().email,
      addmissionDate: doc.data().addmissionDate.toDate(),
      expiryDate: doc.data().expiryDate.toDate(),
      profileImage: doc.data().profileImage,
      document: doc.data().document,
      dueAmount: doc.data().dueAmount,
      totalAmount: doc.data().totalAmount,
      paidAmount: doc.data().paidAmount,
      planId: doc.data().planId,
      plan: doc.data().plan,
      createdAt: doc.data().createdAt,
      updatedAt: doc.data().updatedAt,
    }));

    // Get the last document for pagination
    const lastVisibleDoc = membersSnapshot.docs[membersSnapshot.docs.length - 1];

    // Determine if there are more members to fetch
    const hasMore = membersSnapshot.docs.length === pageSize;

    return { members, lastVisibleDoc, hasMore };
  } catch (error: any) {
    console.error("Unable to get members:", error.message);
    throw error;
  }
}


export async function updateMember({
  memberId,
  data,
}: {
  memberId: string;
  data: Partial<{
    fullName: string;
    address: string;
    contactNumber: string;
    email: string;
    admissionDate: string;
    expiryDate: string;
    profileImage: string;
    document: string;
    dueAmount: number;
    totalAmount: number;
    paidAmount: number;
    discount: number;
    advanceAmount: number;
    planId: string;
    plan: string;
  }>;
}) {
  try {
    if (!memberId) {
      throw new Error("Member ID is required for updating.");
    }

    const memberRef = doc(db, "members", memberId);

    await updateDoc(memberRef, {
      ...data,
      updatedAt: new Date(), // Update timestamp
    });

    console.log("Member updated successfully:", memberId);
    return true;
  } catch (error: any) {
    console.error("Error updating member:", error.message);
    throw error; // Propagate error
  }
}


export async function deleteMember({ id, }: { id: string }) {
  try {
    const memberRef = doc(db, 'members', id)
    await deleteDoc(memberRef)
    return id
  } catch (error: any) {
    console.error('Unable to delete member:', error.message);
    throw error;
  }
}

export async function getMemberById({ id }: { id: string }) {
  try {
    const memberRef = doc(db, 'members', id)
    const memberSnapshot = await getDoc(memberRef)
    if (!memberSnapshot.exists()) {
      throw new Error(`Member with ID ${id} does not exist`)
    }
    return { 
      id: memberSnapshot.id, 
      fullName: memberSnapshot.data().fullName,
      address: memberSnapshot.data().address,
      contactNumber: memberSnapshot.data().contactNumber,
      email: memberSnapshot.data().email,
      addmissionDate: memberSnapshot.data().addmissionDate.toDate(),
      expiryDate: memberSnapshot.data().expiryDate.toDate(),
      status: memberSnapshot.data().status,
      seatNumber: memberSnapshot.data().seatNumber,
      profileImage: memberSnapshot.data().profileImage,
      document: memberSnapshot.data().document,
      dueAmount: memberSnapshot.data().dueAmount,
      totalAmount: memberSnapshot.data().totalAmount,
      paidAmount: memberSnapshot.data().paidAmount,
      discount: memberSnapshot.data().discount,
      advanceAmount: memberSnapshot.data().advanceAmount,
      planId: memberSnapshot.data().planId,
      plan: memberSnapshot.data().plan,
      createdAt: memberSnapshot.data().createdAt,
      updatedAt: memberSnapshot.data().updatedAt
     }
  } catch (error: any) {
    console.error("Unable to get member:", error.message)
    throw error
  }
}

export async function totalMemberCount({ currentUser, libraryId }: { currentUser: any, libraryId: string }) {
  try {
    // const currentUser = getAuth().currentUser
    if (!currentUser) {
      throw new Error("User not authenticated. Redirecting to sign-in...")
    }
    const q = query(collection(db, "members"), where("admin", "==", currentUser.uid), where("libraryId", "==", libraryId))
    const membersSnapshot = await getDocs(q)
    return membersSnapshot.size
  } catch (error: any) {
    console.error("Unable to get member count:", error.message)
    throw error
  }
}

export async function liveMemberCount({ currentUser, libraryId }: { currentUser: any, libraryId: string }) {
  try {
    // const currentUser = getAuth().currentUser
    if (!currentUser) {
      throw new Error("User not authenticated. Redirecting to sign-in...")
    }
    const q = query(
      collection(db, "members"), 
      where("admin", "==", currentUser.uid), 
      where("expiryDate", ">=", new Date()),
      where("libraryId", "==", libraryId)
    )
    const membersSnapshot = await getDocs(q)
    return membersSnapshot.size
  } catch (error: any) {
    console.error("Unable to get live member count:", error.message)
    throw error
  }
}

export async function InactiveMemberCount({ currentUser, libraryId }: { currentUser: any, libraryId: string }) {
  try {
    // const currentUser = getAuth().currentUser
    if (!currentUser) {
      throw new Error("User not authenticated. Redirecting to sign-in...")
    }
    const q = query(
      collection(db, "members"), 
      where("admin", "==", currentUser.uid),
      where("libraryId", "==", libraryId),
       where("expiryDate", "<", new Date())
      )
    const membersSnapshot = await getDocs(q)
    return membersSnapshot.size
  } catch (error: any) {
    console.error("Unable to get inactive member count:", error.message)
    throw error
  }
}

export async function paidAmountCount({ currentUser, libraryId }: { currentUser: any, libraryId: string }) {
  try {
    // const currentUser = getAuth().currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated. Redirecting to sign-in...");
    }

    // Query to get all members with status "Live" under the current admin
    const q = query(
      collection(db, "members"),
      where("admin", "==", currentUser.uid),
      where("libraryId", "==", libraryId)
    );
    const membersSnapshot = await getDocs(q);

    // Calculate the total paid amount
    const paidAmount = membersSnapshot.docs
      .map((doc) => Number(doc.data().paidAmount) || 0) // Convert string to number and default to 0 if invalid
      .reduce((acc, amount) => acc + amount, 0); // Sum all amounts

    return paidAmount;
  } catch (error: any) {
    console.error("Unable to get paid amount count:", error.message)
    throw error
  }
}

export async function totalAmountCount({ currentUser, libraryId }: { currentUser: any, libraryId: string }) {
  try {
    // const currentUser = getAuth().currentUser
    if (!currentUser) {
      throw new Error("User not authenticated. Redirecting to sign-in...")
    }
    const q = query(collection(db, "members"), where("admin", "==", currentUser.uid), where("libraryId", "==", libraryId))
    const membersSnapshot = await getDocs(q)
    const totalAmount = membersSnapshot.docs
      .map((doc) => Number(doc.data().totalAmount) || 0) // Convert string to number and default to 0 if invalid
      .reduce((acc, amount) => acc + amount, 0)
    return totalAmount
  } catch (error: any) {
    console.error("Unable to get total amount count:", error.message)
    throw error
  }
}

export async function dueAmountCount({ currentUser, libraryId }: { currentUser: any, libraryId: string }) {
  try {
    // const currentUser = getAuth().currentUser
    if (!currentUser) {
      throw new Error("User not authenticated. Redirecting to sign-in...")
    }
    const q = query(collection(db, "members"), where("admin", "==", currentUser.uid), where("libraryId", "==", libraryId))
    const membersSnapshot = await getDocs(q)
    const dueAmount = membersSnapshot.docs
      .map((doc) => Number(doc.data().dueAmount) || 0) // Convert string to number and default to 0 if invalid
      .reduce((acc, amount) => acc + amount, 0)
    return dueAmount
  } catch (error: any) {
    console.error("Unable to get due amount count:", error.message)
    throw error
  }
}

export const saveAttendance = async ({ currentUser, attendanceData, libraryId }: { currentUser: any, attendanceData: { date: string; members: { id: string; fullName: string; isPresent: boolean }[] }, libraryId: string }) => {
  try {
    // const currentUser = getAuth().currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated. Redirecting to sign-in...");
    }

    const attendanceCollection = collection(db, "attendance");

    // Check if attendance for the given date already exists
    const q = query(
      attendanceCollection,
      where("date", "==", attendanceData.date),
      where("admin", "==", currentUser.uid),
      where("libraryId", "==", libraryId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Update existing attendance record
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, {
        members: attendanceData.members,
        timestamp: new Date(),
      });
      console.log("Attendance updated for date:", attendanceData.date);
      return docRef.id;
    } else {
      // Create a new attendance record
      const docRef = await addDoc(attendanceCollection, {
        date: attendanceData.date,
        members: attendanceData.members,
        admin: currentUser.uid,
        libraryId,
        timestamp: new Date(),
      });
      console.log("Attendance saved with ID:", docRef.id);
      return docRef.id;
    }
  } catch (error) {
    console.error("Error saving attendance:", error);
    throw error;
  }
};

export const getAttendanceByDate = async ({ currentUser, date, libraryId }: { currentUser: any, date: string, libraryId: string }) => {
  try {
    // const currentUser = getAuth().currentUser
    if (!currentUser) {
      throw new Error("User not authenticated. Redirecting to sign-in...")
    }
    const attendanceCollection = collection(db, "attendance");
    const q = query(attendanceCollection, where("date", "==", date), where("admin", "==", currentUser.uid), where("libraryId", "==", libraryId))
    const attendanceSnapshot = await getDocs(q)
    const attendance = attendanceSnapshot.docs.map((doc) => ({
      id: doc.id,
      date: doc.data().date,
      members: doc.data().members.map((member: any) => ({
        id: member.id,
        fullName: member.fullName,
        isPresent: member.isPresent,
      })),
      admin: doc.data().admin,
      timestamp: doc.data().timestamp.toDate(),
    }))
    return attendance
  } catch (error) {
    console.error("Error getting attendance:", error)
    throw error
  }
}

export const getAttendanceById = async (id: string) => {
  try {
    const attendanceCollection = collection(db, "attendance");
    const docRef = doc(attendanceCollection, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        date: docSnap.data().date,
        members: docSnap.data().members,
        admin: docSnap.data().admin,
        timestamp: docSnap.data().timestamp.toDate(),
      }
    } else {
      throw new Error("Attendance not found");
    }
  } catch (error) {
    console.error("Error getting attendance:", error);
    throw error;
  }
}

export const addSeats = async ({ currentUser, numberOfSeats, libraryId, roomType, roomNumber }: {
  currentUser: any;
  numberOfSeats: number;
  libraryId: string;
  roomType: 'AC' | 'Non-AC' | 'Dormitory';
  roomNumber: string;
}) => {
  try {
    if (!currentUser) {
      throw new Error("User not authenticated. Redirecting to sign-in...");
    }

    // Query to find existing seats in the same room
    const q = query(
      collection(db, "seats"),
      where("admin", "==", currentUser.uid),
      where("libraryId", "==", libraryId),
      where("roomType", "==", roomType),
      where("roomNumber", "==", roomNumber)
    );

    const seatSnapshot = await getDocs(q);
    const currentSeatCount = seatSnapshot.size;

    // Add new seats to the room
    for (let i = 0; i < numberOfSeats; i++) {
      await addDoc(collection(db, "seats"), {
        seatId: `${roomNumber}-bed-${currentSeatCount + i + 1}`,
        isAllocated: false,
        allocatedTo: null,
        memberName: null,
        memberExpiryDate: null,
        admin: currentUser.uid,
        libraryId: libraryId,
        roomType: roomType,
        roomNumber: roomNumber,
      });
    }

    return `Added ${numberOfSeats} beds to ${roomType} room ${roomNumber}`;
  } catch (error) {
    console.error("Error adding beds:", error);
    throw error;
  }
};

export const deleteSeat = async (seatId: string) => {
  try {
    const seatDoc = doc(collection(db, "seats"), seatId);
    await deleteDoc(seatDoc);
    return {
      success: true,
      message: `Seat ${seatId} deleted successfully`
    };
  } catch (error) {
   return {
     success: false,
     message: `Error deleting seat: ${error}`
   }
  }
}

export const allotSeat = async (seatId: string, memberId: string, memberName: string, expiryDate: Date) => {
  try {
    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated. Please sign in again.");
    }

    // Get seat document
    const seatCollection = collection(db, "seats");
    const seatDoc = doc(seatCollection, seatId);
    const seatData = await getDoc(seatDoc);

    // Validate seat exists
    if (!seatData.exists()) {
      throw new Error("Seat not found. Please try again.");
    }

    const seat = seatData.data();

    // Validate seat is not already allocated
    if (seat.isAllocated) {
      throw new Error("This seat is already allocated to another member.");
    }

    // Check if member already has a seat
    const memberSeatsQuery = query(
      collection(db, "seats"),
      where("allocatedTo", "==", memberId)
    );
    const memberSeats = await getDocs(memberSeatsQuery);
    
    if (!memberSeats.empty) {
      throw new Error("This member already has an allocated seat.");
    }

    // Validate expiry date
    if (expiryDate < new Date()) {
      throw new Error("Member's subscription has expired. Please renew the subscription first.");
    }

    // Update seat allocation
    await updateDoc(seatDoc, {
      isAllocated: true,
      allocatedTo: memberId,
      memberName: memberName,
      memberExpiryDate: expiryDate,
      lastUpdated: new Date(),
      updatedBy: currentUser.uid
    });

    return {
      success: true,
      message: `Seat ${seat.seatId} has been allocated to ${memberName}`,
      data: {
        seatId: seat.seatId,
        roomNumber: seat.roomNumber,
        roomType: seat.roomType,
        memberName,
        expiryDate
      }
    };
  } catch (error) {
    console.error("Error allocating seat:", error);
    throw error;
  }
}

export const fetchSeats = async ({currentUser, libraryId }: { currentUser: any, libraryId: string }) => {
  try {
    const q = query(collection(db, "seats"),where("admin", "==", currentUser.uid), where("libraryId", "==", libraryId), orderBy("seatId", "asc"),);
    const seatCollection = await getDocs(q);
    const seats = seatCollection.docs.map(doc => ({
      id: doc.id,
      seatId: doc.data().seatId,
      isAllocated: doc.data().isAllocated,
      allocatedTo: doc.data().allocatedTo,
      memberName: doc.data().memberName,
      memberExpiryDate: doc.data().memberExpiryDate,
      roomType: doc.data().roomType,
      roomNumber: doc.data().roomNumber
    }));
    return seats;
  } catch (error) {
    console.error("Error fetching seats:", error);
    throw error;
  }
}

export const deallocateSeat = async (seatId: string) => {
  try {
    const currentUser = getAuth().currentUser
    if (!currentUser) {
      throw new Error("User not authenticated. Redirecting to sign-in...")
    }
    const seatCollection = collection(db, "seats");
    const seatDoc = doc(seatCollection, seatId);
    const seatData = await getDoc(seatDoc);
    if (!seatData.exists()) {
      throw new Error("Seat not found");
    }
    if (!seatData.data().isAllocated) {
      throw new Error("Seat is not allocated");
    }
    await updateDoc(seatDoc, {
      isAllocated: false,
      allocatedTo: null,
    });
    return `Seat ${seatId} is deallocated`;
  } catch (error) {
    console.error("Error deallocating seat:", error);
    throw error;
  }
}

export const fetchSeatByMemberId = async (memberId: string) => {
  try {
    const q = query(collection(db, "seats"), where("allocatedTo", "==", memberId));
    const seatCollection = await getDocs(q);
    const seats = seatCollection.docs.map(doc => ({
      id: doc.id,
      seatId: doc.data().seatId,
      isAllocated: doc.data().isAllocated,
      allocatedTo: doc.data().allocatedTo,
      memberName: doc.data().memberName,
      memberExpiryDate: doc.data().memberExpiryDate
    }));
    return seats;
  } catch (error) {
    console.error("Error fetching seats by member ID:", error);
    throw error;
  }
}

export const fetchAttendanceByMemberId = async (memberId: string) => {
  try {
    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated. Redirecting to sign-in...");
    }

    const attendanceCollection = collection(db, "attendance");

    // Query attendance records for the current admin
    const q = query(
      attendanceCollection,
      where("admin", "==", currentUser.uid),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);

    // Filter attendance records to find entries for the specified member
    const attendanceRecords: {
      id: string;
      date: string;
      status: boolean;
    }[] = [];

    querySnapshot.forEach((doc) => {
      const attendanceData = doc.data();
      const memberAttendance = attendanceData.members.find(
        (member: { id: string }) => member.id === memberId
      );

      if (memberAttendance) {
        attendanceRecords.push({
          id: doc.id,
          date: attendanceData.date,
          status: memberAttendance.isPresent,
        });
      }
    });

    // console.log("Attendance records fetched for member:", memberId);
    return attendanceRecords;
  } catch (error) {
    console.error("Error fetching attendance by member ID:", error);
    throw error;
  }
}

 

 export const addItem = async ({currentUser, libraryId, description, amount, type }: {currentUser: any, libraryId: string, description: string, amount: number, type: string}) => {
    try {
      const docRef = await addDoc(collection(db, "finance"), {
        userId: currentUser.uid,
        libraryId,
        description,
        amount,
        type,
      });
      return {id: docRef.id, description, amount, type }
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

export const updateItem = async (item: any) => {
    try {
      if (item.id) {
        await updateDoc(doc(db, "finance", item.id), {
          description: item.description,
          amount: item.amount,
          type: item.type,
        });
        return item
      }
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

export const fetchItems = async ({currentUser, libraryId}: {currentUser: any, libraryId: string})=> {
try {
  const q = query(collection(db, "finance"), where("userId", "==", currentUser.uid));
  const querySnapshot = await getDocs(q);
  const data = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    description: doc.data().description,
    amount: doc.data().amount,
    type: doc.data().type,
  })) 
  return data
} catch (error) {
  
}
}

export   const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, "finance", id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };
