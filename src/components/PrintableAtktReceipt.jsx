import React from "react";
import {
  PDFDownloadLink,
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  PDFViewer,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11 },
  header: { flexDirection: "row", marginBottom: 20, alignItems: "center" },
  logo: { width: 80, height: 80 },
  schoolInfo: { flex: 1, textAlign: "center" },
  schoolName: {
    fontSize: 16,
    fontWeight: 900,
    marginBottom: 2,
    color: "#eab308",
  },
  schoolAddress: { fontSize: 10, marginBottom: 2 },
  label: { fontWeight: "bold" },
  heading: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    padding: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    marginBottom: 10,
  },
  section: { border: "1pt solid black", padding: 10, marginBottom: 15 },
  row: { flexDirection: "row", marginBottom: 5 },
  cell50: { width: "50%", padding: 2 },
  text: { marginBottom: 3 },
  smallText: { fontSize: 9, marginBottom: 5, textAlign: "center" },
  button: {
    padding: "10px 20px",
    margin: "10px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    textDecoration: "none",
  },
  previewContainer: { width: "100%", height: "80vh", marginBottom: 20 },
  list: { paddingLeft: 20 },
  listItem: { marginBottom: 3 },
});

const ReceiptDocument = ({ data }) => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.header}>
        <Image src="/agnel-logo.png" style={styles.logo} />
        <View style={styles.schoolInfo}>
          <Text style={[styles.label, { fontWeight: "bold" }]}>
            Agnel Charities
          </Text>
          <Text style={styles.schoolName}>AGNEL SCHOOL OF LAW</Text>
          <Text style={styles.label}>
            Affiliated to University of Mumbai & Approved by Bar Council of
            India
          </Text>
          <Text style={{ fontWeight: "bold" }}>
            ACCREDITTED 'B++' Grade by NAAC, ISO 9001:2015
          </Text>
          <Text style={styles.schoolAddress}>
            Sector 9A,Vashi ,Navi Mumbai Maharashtra 400703 |
            asl@agnelschooloflaw.com | https://agnelschooloflaw.com |
            Tel.:02227771000
          </Text>
        </View>
        <Image src="/naac.png" style={styles.logo} />
      </View>

      <Text style={styles.heading}>ATKT EXAMINATION PAYMENT RECEIPT</Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.cell50}>
            <Text style={styles.label}>Receipt No:</Text> {data.receiptNumber}
          </Text>
          <Text style={styles.cell50}>
            <Text style={styles.label}>Payment Date:</Text>{" "}
            {new Date(data.paymentDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cell50}>
            <Text style={styles.label}>Transaction ID:</Text>{" "}
            {data.transactionId}
          </Text>
          <Text style={styles.cell50}>
            <Text style={styles.label}>Order ID:</Text> {data.orderId}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={{ ...styles.heading, fontSize: 12, marginBottom: 10 }}>
          Student Details
        </Text>
        <View style={styles.row}>
          <Text style={styles.cell50}>
            <Text style={styles.label}>Student Name:</Text> {data.studentName}
          </Text>
          <Text style={styles.cell50}>
            <Text style={styles.label}>Roll Number:</Text> {data.rollNumber}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cell50}>
            <Text style={styles.label}>Course:</Text> {data.course}
          </Text>
          <Text style={styles.cell50}>
            <Text style={styles.label}>Batch:</Text> {data.batch}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cell50}>
            <Text style={styles.label}>Pattern:</Text> {data.pattern}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={{ ...styles.heading, fontSize: 12, marginBottom: 10 }}>
          Payment Summary
        </Text>
        <View style={styles.row}>
          <Text style={styles.cell50}>
            <Text style={styles.label}>Subjects Count:</Text>{" "}
            {data.subjects?.length || 0}
          </Text>
          <Text style={styles.cell50}>
            <Text style={styles.label}>Amount Paid:</Text> ₹
            {(data.amount || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={{ ...styles.heading, fontSize: 12, marginBottom: 10 }}>
          Subjects Selected
        </Text>
        <View style={styles.list}>
          {data.subjects?.map((s) => (
            <Text key={s.id} style={styles.listItem}>
              {s.label}
            </Text>
          ))}
        </View>
      </View>

      <View
        style={{
          ...styles.section,
          marginTop: 50,
          border: "none",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.smallText}>
            This is a computer-generated receipt for the ATKT examination fee.
            For any discrepancies, please contact the examination cell.
          </Text>
        </View>
        <View style={{ alignItems: "center", marginLeft: 20 }}>
          <Image
            src={`${process.env.REACT_APP_BASE_HOST_URL?.replace("/api", "") || "https://lms.raphaedu.com/backend"}/uploads/images/clg_seal.png`}
            style={{ width: 60, height: 60, marginBottom: 5 }}
          />
          <Text style={{ fontSize: 8, fontWeight: "bold" }}>
            Authorized Seal
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

const PrintableAtktReceipt = ({ data, onClose }) => {
  if (!data) return null;

  const studentName = (data.studentName || "Student")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white max-w-4xl w-full h-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">ATKT Payment Receipt</h2>
          <div className="flex gap-2">
            <PDFDownloadLink
              document={<ReceiptDocument data={data} />}
              fileName={`${studentName}_Receipt_${data.receiptNumber}.pdf`}
              style={styles.button}
            >
              {({ loading }) => (loading ? "Loading..." : "Download PDF")}
            </PDFDownloadLink>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
        <div className="flex-grow">
          <PDFViewer style={{ width: "100%", height: "100%" }}>
            <ReceiptDocument data={data} />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
};

export default PrintableAtktReceipt;
