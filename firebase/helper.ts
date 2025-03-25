import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/utils/firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/utils/firebaseConfig";
import { SeatData } from "@/types/MemberProfile";

import { shareAsync } from "expo-sharing"
import * as Print from "expo-print"


// Upload image to Firebase Storage
export const uploadImageToFirebase = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const filename = uri.substring(uri.lastIndexOf("/") + 1);
  const storageRef = ref(storage, `uploads/${filename}`);

  try {
    const snapshot = await uploadBytes(storageRef, blob);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Error uploading file: ", error);
    throw error;
  }
};

// Fetch available seats
export const fetchSeats = async (): Promise<SeatData[]> => {
  const seatsCollection = collection(db, "seats");
  const snapshot = await getDocs(seatsCollection);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SeatData));
};


interface InvoiceData {
  invoiceNumber: string;
  date: string;
  memberName: string;
  membershipId: string;
  planName: string;
  amount: number;
  // Additional member details
  address: string;
  contactNumber: string;
  email: string;
  admissionDate: string;
  expiryDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  discount: number;
}

export async function generateAndShareInvoice(data: InvoiceData) {
  const htmlContent = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #6B46C1; }
          .invoice-details, .member-details, .plan-details { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Invoice</h1>
        <div class="invoice-details">
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p><strong>Date:</strong> ${data.date}</p>
        </div>
        <div class="member-details">
          <h2>Member Details</h2>
          <p><strong>Name:</strong> ${data.memberName}</p>
          <p><strong>Membership ID:</strong> ${data.membershipId}</p>
          <p><strong>Address:</strong> ${data.address}</p>
          <p><strong>Contact Number:</strong> ${data.contactNumber}</p>
          <p><strong>Email:</strong> ${data.email}</p>
        </div>
        <div class="plan-details">
          <h2>Plan Details</h2>
          <p><strong>Plan:</strong> ${data.planName}</p>
          <p><strong>Admission Date:</strong> ${data.admissionDate}</p>
          <p><strong>Expiry Date:</strong> ${data.expiryDate}</p>
        </div>
        <table>
          <tr>
            <th>Description</th>
            <th>Amount</th>
          </tr>
          <tr>
            <td>Total Amount</td>
            <td>₹${data.totalAmount}</td>
          </tr>
          <tr>
            <td>Paid Amount</td>
            <td>₹${data.paidAmount}</td>
          </tr>
          <tr>
            <td><strong>Due Amount</strong></td>
            <td><strong>₹${data.dueAmount}</strong></td>
          </tr>
          <tr>
            <td><strong>Discount</strong></td>
            <td><strong>₹${data.discount}</strong></td>
          </tr>
        </table>
        <div style="margin-top: 40px; text-align: center;">
          <p>Thank you for your business!</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating or sharing invoice:', error);
    throw error;
  }
}
