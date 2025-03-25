// import React from "react";
// import { View, Text, Button, StyleSheet } from "react-native";
// import * as Print from "expo-print";
// import * as Sharing from "expo-sharing";
// import { MemberDetails } from "@/types/MemberProfile";

// const generateInvoiceHTML = (member: MemberDetails) => {
//   return `
//     <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; padding: 20px; }
//           .container { width: 100%; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; }
//           h1 { color: #6B46C1; }
//           .details { margin-top: 20px; }
//           .details p { margin: 5px 0; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <h1>Invoice</h1>
//           <p><strong>Name:</strong> ${member.fullName}</p>
//           <p><strong>Membership ID:</strong> ${member.id}</p>
//           <p><strong>Plan:</strong> ${member.plan}</p>
//           <p><strong>Admission Date:</strong> ${member.addmissionDate}</p>
//           <p><strong>Expiry Date:</strong> ${member.expiryDate}</p>
//           <p><strong>Total Amount:</strong> ${member.totalAmount}</p>
//           <p><strong>Paid Amount:</strong> ${member.paidAmount}</p>
//           <p><strong>Due Amount:</strong> ${member.dueAmount}</p>
//           <p><strong>Discount:</strong> ${member.discount}</p>
//         </div>
//       </body>
//     </html>
//   `;
// };

// const InvoiceScreen = ({ member }: { member: MemberDetails }) => {
//   const printInvoice = async () => {
//     const { uri } = await Print.printToFileAsync({
//       html: generateInvoiceHTML(member),
//     });
//     await Sharing.shareAsync(uri);
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>Invoice Preview</Text>
//       <Button title="Print/Share Invoice" onPress={printInvoice} />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
//   header: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
// });

// export default InvoiceScreen;
