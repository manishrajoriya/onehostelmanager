import { 
  collection, 
  addDoc, 
  getDoc, 
  where, 
  query, 
  getDocs, 
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData, 
  limit, 
  orderBy, 
  updateDoc,
  doc,
  deleteDoc,
  runTransaction,
  FieldValue,
  serverTimestamp,
  type DocumentReference
} from "firebase/firestore"; 
import { db } from "@/utils/firebaseConfig";

export interface Room {
  id?: string;
  roomNumber: string;
  capacity: number;
  occupiedBeds: number;
  roomType: 'AC' | 'Non-AC' | 'Dormitory';
  students: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RoomUpdate {
  roomNumber?: string;
  capacity?: number;
  occupiedBeds?: number;
  roomType?: 'AC' | 'Non-AC' | 'Dormitory';
  students?: string[];
}

// Validate room data before operations
const validateRoomData = (room: Partial<Room>) => {
  if (!room.roomNumber || typeof room.roomNumber !== 'string') {
    throw new Error('Invalid room number');
  }
  
  if (!room.capacity || typeof room.capacity !== 'number' || room.capacity <= 0) {
    throw new Error('Invalid capacity value');
  }
  
  if (room.occupiedBeds === undefined || typeof room.occupiedBeds !== 'number' || room.occupiedBeds < 0) {
    throw new Error('Invalid occupied beds value');
  }
  
  if (room.occupiedBeds > room.capacity) {
    throw new Error('Occupied beds cannot exceed capacity');
  }
  
  if (!room.roomType || !['AC', 'Non-AC', 'Dormitory'].includes(room.roomType)) {
    throw new Error('Invalid room type');
  }
  
  if (!Array.isArray(room.students)) {
    throw new Error('Students must be an array');
  }
};

export const addRooms = async ({currentUser, libraryId, roomsData}: {currentUser: any, libraryId: string, roomsData:any})=> {
    try {
        if (!currentUser) {
            throw new Error('User not authenticated. Redirecting to sign-in...');
        }
         
        await addDoc(collection(db, 'rooms'), {
            roomNumber: roomsData.roomNumber,
            capacity: roomsData.capacity,
            roomType: roomsData.roomType,
            createdAt: serverTimestamp() as unknown as Date,
            updatedAt: serverTimestamp() as unknown as Date,
            admin: currentUser.uid,
            libraryId: libraryId
        });
        return 'Room added successfully';
        
    } catch (error) {
        console.error('Error adding room:', error);
        throw new Error(`Failed to add room: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export const getRooms = async ({currentUser, libraryId}: {currentUser: any, libraryId: string})=> {
    try {
        if (!currentUser) {
            throw new Error('User not authenticated. Redirecting to sign-in...');
        }
        
        const q = query(collection(db, 'rooms'), where('admin', '==', currentUser.uid), where('libraryId', '==', libraryId));
        const roomsSnapshot = await getDocs(q);
        
        const rooms = roomsSnapshot.docs.map(doc => ({
            id: doc.id,
            roomNumber: doc.data().roomNumber,
            capacity: doc.data().capacity,
            occupiedBeds: doc.data().occupiedBeds,
            roomType: doc.data().roomType,
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
        }));
        
        return rooms;
    } catch (error) {
        console.error('Error getting rooms:', error);
        throw new Error(`Failed to get rooms: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Add a new room with validation and automatic timestamps
 */
export const addRoom = async (room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    validateRoomData(room);
    
    const roomData: Omit<Room, 'id'> = {
      ...room,
      students: room.students || [],
      createdAt: serverTimestamp() as unknown as Date,
      updatedAt: serverTimestamp() as unknown as Date
    };
    
    const docRef = await addDoc(collection(db, 'rooms'), roomData);
    console.log('Room added successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding room:', error);
    throw new Error(`Failed to add room: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Fetch rooms by type with pagination support
 */

export type RoomType = 'AC' | 'Non-AC' | 'Dormitory';

export const fetchRoomsByType = async (roomType: RoomType): Promise<{ rooms: Room[], lastVisible: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    const roomsRef = collection(db, 'rooms');
    const q = query(
      roomsRef,
      where('roomType', '==', roomType),
      orderBy('roomNumber')
    );

    const snapshot = await getDocs(q);
    
    const rooms = snapshot.docs.map(doc => ({
      id: doc.id,
      roomNumber: doc.data().roomNumber || '',
      capacity: doc.data().capacity || 0,
      occupiedBeds: doc.data().occupiedBeds || 0,
      roomType: doc.data().roomType || 'AC',
      students: doc.data().students || [],
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    }));

    return {
      rooms,
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null
    };
  } catch (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }
};


/**
 * Get room by ID
 */
export const getRoomById = async (roomId: string): Promise<Room | null> => {
  try {
    const docRef = doc(db, 'rooms', roomId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Room;
    }
    return null;
  } catch (error) {
    console.error('Error getting room:', error);
    throw new Error(`Failed to get room: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Update room information with transaction for consistency
 */
export const updateRoom = async (roomId: string, updates: RoomUpdate): Promise<void> => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    
    await runTransaction(db, async (transaction) => {
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) {
        throw new Error('Room does not exist');
      }
      
      const currentData = roomSnap.data() as Room;
      const updatedData = {
        ...updates,
        updatedAt: serverTimestamp() as unknown as Date
      };
      
      // Validate the merged data
      validateRoomData({ ...currentData, ...updatedData });
      
      transaction.update(roomRef, updatedData);
    });
    
    console.log('Room updated successfully');
  } catch (error) {
    console.error('Error updating room:', error);
    throw new Error(`Failed to update room: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Delete a room with transaction
 */
export const deleteRoom = async (roomId: string): Promise<void> => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    
    await runTransaction(db, async (transaction) => {
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) {
        throw new Error('Room does not exist');
      }
      
      const roomData = roomSnap.data() as Room;
      if (roomData.occupiedBeds > 0) {
        throw new Error('Cannot delete room with occupied beds');
      }
      
      transaction.delete(roomRef);
    });
    
    console.log('Room deleted successfully');
  } catch (error) {
    console.error('Error deleting room:', error);
    throw new Error(`Failed to delete room: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Assign student to room with capacity check
 */
export const assignStudentToRoom = async (roomId: string, studentId: string): Promise<void> => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    
    await runTransaction(db, async (transaction) => {
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) {
        throw new Error('Room does not exist');
      }
      
      const roomData = roomSnap.data() as Room;
      
      if (roomData.occupiedBeds >= roomData.capacity) {
        throw new Error('Room is at full capacity');
      }
      
      if (roomData.students.includes(studentId)) {
        throw new Error('Student already assigned to this room');
      }
      
      transaction.update(roomRef, {
        occupiedBeds: roomData.occupiedBeds + 1,
        students: [...roomData.students, studentId],
        updatedAt: serverTimestamp()
      });
    });
    
    console.log('Student assigned to room successfully');
  } catch (error) {
    console.error('Error assigning student to room:', error);
    throw new Error(`Failed to assign student: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Remove student from room
 */
export const removeStudentFromRoom = async (roomId: string, studentId: string): Promise<void> => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    
    await runTransaction(db, async (transaction) => {
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) {
        throw new Error('Room does not exist');
      }
      
      const roomData = roomSnap.data() as Room;
      
      if (!roomData.students.includes(studentId)) {
        throw new Error('Student not found in this room');
      }
      
      transaction.update(roomRef, {
        occupiedBeds: roomData.occupiedBeds - 1,
        students: roomData.students.filter(id => id !== studentId),
        updatedAt: serverTimestamp()
      });
    });
    
    console.log('Student removed from room successfully');
  } catch (error) {
    console.error('Error removing student from room:', error);
    throw new Error(`Failed to remove student: ${error instanceof Error ? error.message : String(error)}`);
  }
};





interface Member {
  id: string;
  fullName: string;
  address: string;
  contactNumber: string;
  email: string;
  admissionDate: Date;
  expiryDate: Date;
  profileImage?: string;
  document?: string;
  dueAmount: number;
  totalAmount: number;
  paidAmount: number;
  discount?: number;
  planId: string;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any; // For additional dynamic fields
}

interface PaginationResult {
  members: Member[];
  lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}


export async function getMembers({
  pageSize,
  lastVisible,
  currentUser,
  libraryId,
  filters = {}
}: {
  pageSize: number;
  lastVisible: QueryDocumentSnapshot<DocumentData> | undefined;
  currentUser: any;
  libraryId: string;
  filters?: Record<string, any>;
}): Promise<PaginationResult> {
  try {
    // Validate required parameters
    if (!currentUser?.uid) {
      throw new Error("User not authenticated");
    }
    
    if (!libraryId) {
      throw new Error("Library ID is required");
    }

    if (pageSize <= 0 || pageSize > 100) {
      throw new Error("Page size must be between 1 and 100");
    }

    // Base query with required conditions
    let q = query(
      collection(db, "members"),
      where("admin", "==", currentUser.uid),
      where("libraryId", "==", libraryId),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    // Apply additional filters if provided
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        q = query(q, where(key, "==", value));
      }
    });

    // Apply pagination if a last visible document exists
    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const membersSnapshot = await getDocs(q);

    // Transform documents to Member objects with proper error handling
    const members = membersSnapshot.docs.map((doc) => {
      const data = doc.data();
      
      // Validate required fields
      if (!data.fullName || !data.createdAt) {
        console.warn(`Member ${doc.id} is missing required fields`);
      }

      return {
        id: doc.id,
        fullName: data.fullName || '',
        address: data.address || '',
        contactNumber: data.contactNumber || '',
        email: data.email || '',
        admissionDate: data.admissionDate?.toDate() || new Date(),
        expiryDate: data.expiryDate?.toDate() || new Date(),
        profileImage: data.profileImage,
        document: data.document,
        dueAmount: Number(data.dueAmount) || 0,
        totalAmount: Number(data.totalAmount) || 0,
        paidAmount: Number(data.paidAmount) || 0,
        discount: Number(data.discount) || 0,
        planId: data.planId || '',
        plan: data.plan || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        ...data // Include any additional fields
      };
    });

    // Get the last document for pagination
    const lastVisibleDoc = membersSnapshot.docs.length > 0 
      ? membersSnapshot.docs[membersSnapshot.docs.length - 1] 
      : null;

    // Determine if there are more members to fetch
    const hasMore = membersSnapshot.docs.length === pageSize;

    return { members, lastVisibleDoc, hasMore };
  } catch (error: any) {
    console.error("Error fetching members:", error);
    throw new Error(error.message || "Failed to fetch members");
  }
}

// Helper function to fetch all members (with automatic pagination)
export async function getAllMembers(params: {
  currentUser: any;
  libraryId: string;
  filters?: Record<string, any>;
  batchSize?: number;
}): Promise<Member[]> {
  const batchSize = params.batchSize || 50;
  let allMembers: Member[] = [];
  let lastVisible: QueryDocumentSnapshot<DocumentData> | undefined;
  let hasMore = true;

  while (hasMore) {
    const result = await getMembers({
      pageSize: batchSize,
      lastVisible,
      currentUser: params.currentUser,
      libraryId: params.libraryId,
      filters: params.filters
    });

    allMembers = [...allMembers, ...result.members];
    lastVisible = result.lastVisibleDoc || undefined;
    hasMore = result.hasMore;
  }

  return allMembers;
}