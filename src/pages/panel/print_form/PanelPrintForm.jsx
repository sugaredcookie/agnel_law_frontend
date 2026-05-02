/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  PDFDownloadLink,
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  PDFViewer,
  Image,
  Link,
} from "@react-pdf/renderer";
import { getSingleFormDataForAdmin } from "../../../utils/Api";
import { useParams } from "react-router-dom";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
  },
  header: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
  },
  schoolInfo: {
    flex: 1,
    textAlign: "center",
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 900,
    marginBottom: 2,
    color: "#eab308",
  },
  schoolAddress: {
    fontSize: 10,
    marginBottom: 2,
  },
  sectionContainer: {
    marginBottom: 15,
    position: "relative",
    paddingTop: 15,
  },
  section: {
    border: "1pt solid black",
    padding: 0, // Remove padding to make inner borders touch the container
    marginTop: 5,
  },
  heading: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    padding: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
  },
  label: { fontWeight: "bold" },
  text: { marginBottom: 3 },
  row: {
    flexDirection: "row",
    marginBottom: 0,
    borderBottom: "0.5pt solid #000",
    minHeight: 20,
    padding: 0,
  },
  cell25: {
    width: "25%",
    borderRight: "0.5pt solid #000",
    padding: 2,
  },
  cell50: {
    width: "50%",
    borderRight: "0.5pt solid #000",
    padding: 2,
  },
  cell33: {
    width: "33.33%",
    borderRight: "0.5pt solid #000",
    padding: 2,
  },
  cell: {
    flex: 1,
    borderRight: "0.5pt solid #000",
    padding: 2,
  },
  tableHeader: {
    fontWeight: "bold",
    textDecoration: "underline",
    backgroundColor: "#f0f0f0",
    padding: 4,
  },
  documentList: {
    marginTop: 5,
    marginBottom: 10,
    padding: 4,
    borderBottom: "0.5pt solid #000",
  },
  smallText: { fontSize: 9, marginBottom: 5 },
  button: {
    padding: "10px 20px",
    margin: "10px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  previewContainer: { width: "100%", height: "80vh", marginBottom: 20 },
  underline: { textDecoration: "underline" },
  documentRow: {
    flexDirection: "row",
    marginBottom: 0, // Remove margin to make borders touch
    padding: 0, // Remove padding to make borders touch
  },
  documentCell: {
    width: "50%",
    padding: 4,
    borderRight: "1pt solid black",
    borderBottom: "1pt solid black",
    minHeight: 25, // Add minimum height for consistent cells
  },
  documentCellLast: {
    width: "50%",
    padding: 4,
    borderBottom: "1pt solid black",
    minHeight: 25,
  },
  studentImageContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  studentImage: {
    width: 90,
    height: 110,
    border: "1pt solid black",
  },
  applicationContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  applicationSection: {
    width: "75%",
    paddingRight: 5,
  },
  imageSection: {
    width: "25%",
    alignItems: "center",
  },
  documentLink: {
    color: "#0000EE",
    textDecoration: "underline",
    fontSize: 9,
  },
});

const getFormattedDate = () => {
  const now = new Date();
  return `${now.getFullYear()}${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
};

const MyDocument = ({ data }) => (
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
        <Image
          src="/naac.png" // Replace with actual logo path
          style={styles.logo}
        />
      </View>

      <View style={styles.applicationContainer}>
        <View style={styles.applicationSection}>
          <View style={styles.sectionContainer}>
            <Text style={styles.heading}>APPLICATIONS</Text>
            <View style={styles.section}>
              <View style={styles.row}>
                <Text style={styles.cell50}>
                  Course Applied for: {data?.course}
                </Text>
                <Text style={styles.cell50}>
                  Application No: {data?.applicationNumber}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.imageSection}>
          {data?.studentDetails?.studentImage && (
            <Image
              src={data.studentDetails.studentImage}
              style={styles.studentImage}
            />
          )}
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.heading}>CANDIDATE INFORMATION</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.cell50}>
              First Name: {data?.studentDetails?.firstName}
            </Text>
            <Text style={styles.cell50}>
              Middle Name: {data?.studentDetails?.middleName}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cell50}>
              Last Name: {data?.studentDetails?.lastName}
            </Text>
            <Text style={styles.cell50}>
              DOB: {data?.studentDetails?.dateOfBirth}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cell50}>
              Blood Group: {data?.studentDetails?.bloodGroup}
            </Text>
            <Text style={styles.cell50}>
              Birth Place: {data?.studentDetails?.birthPlace}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cell50}>
              Caste Category: {data?.studentDetails?.casteCategory}
            </Text>
            <Text style={styles.cell50}>
              Caste: {data?.studentDetails?.caste}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cell50}>
              Aadhar: {data?.studentDetails?.aadharCardNumber}
            </Text>
            <Text style={styles.cell50}>
              Religion: {data?.studentDetails?.religion}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cell50}>
              Mobile: {data?.studentDetails?.studentMobileNumber}
            </Text>
            <Text style={styles.cell50}>
              Email: {data?.studentDetails?.emailAddress}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cell50}>
              PRN No: {data?.studentDetails?.prnNumber}
            </Text>
            <Text style={styles.cell50}>
              ABC No: {data?.studentDetails?.abcNumber}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cell50}>
              CAP Application ID: {data?.studentDetails?.capApplicationId}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.heading}>ACADEMIC BACKGROUND</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.cell25}>Exam Level</Text>
            <Text style={styles.cell25}>Marks</Text>
            <Text style={styles.cell25}>School / College</Text>
            <Text style={styles.cell25}>Passing Year</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cell25}>MAH-CET</Text>
            <Text style={styles.cell25}>
              {data?.academicQualifications?.cetExam?.obtainedMarks} /{" "}
              {data?.academicQualifications?.cetExam?.maximumMarks}
            </Text>
            <Text style={styles.cell25}>--</Text>
            <Text style={styles.cell25}>
              {data?.academicQualifications?.cetExam?.examYear}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cell25}>X</Text>
            <Text style={styles.cell25}>
              {data?.academicQualifications?.tenth?.percentage}%
            </Text>
            <Text style={styles.cell25}>
              {data?.academicQualifications?.tenth?.institution}
            </Text>
            <Text style={styles.cell25}>
              {data?.academicQualifications?.tenth?.yearOfPassing}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cell25}>XII</Text>
            <Text style={styles.cell25}>
              {data?.academicQualifications?.twelfth?.percentage}%
            </Text>
            <Text style={styles.cell25}>
              {data?.academicQualifications?.twelfth?.institution}
            </Text>
            <Text style={styles.cell25}>
              {data?.academicQualifications?.twelfth?.yearOfPassing}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.heading}>FAMILY INFORMATION</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.cell50}>
              Father's Full Name: {data?.familyBackground?.fatherName}
            </Text>
            <Text style={styles.cell50}>
              Mother's Full Name: {data?.familyBackground?.motherName}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cell50}>
              Father's Email ID: {data?.familyBackground?.fatherEmail}
            </Text>
            <Text style={styles.cell50}>
              Mother's Email ID: {data?.familyBackground?.motherEmail}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cell50}>
              Father's Mobile No.: {data?.familyBackground?.fatherMobileNo}
            </Text>
            <Text style={styles.cell50}>
              Mother's Mobile No.: {data?.familyBackground?.motherMobileNo}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cell50}>
              Father's Occupation: {data?.familyBackground?.fatherOccupation}
            </Text>
            <Text style={styles.cell50}>
              Mother's Occupation: {data?.familyBackground?.motherOccupation}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cell50}>
              Family Annual Income: {data?.familyBackground?.familyAnnualIncome}
            </Text>
            <Text style={styles.cell50}>
              Lawyer/Judge in Family:{" "}
              {data?.familyBackground?.isLawyerOrJudge ? "Yes" : "No"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.heading}>DOCUMENTS ATTACHED</Text>
        <View style={styles.section}>
          {Array.from({
            length: Math.ceil((data?.certificates?.length || 0) / 2),
          }).map((_, rowIndex) => (
            <View key={rowIndex} style={styles.documentRow}>
              <View style={styles.documentCell}>
                {data?.certificates?.[rowIndex * 2] && (
                  <Link
                    src={data.certificates[rowIndex * 2].fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {rowIndex * 2 + 1}. {data.certificates[rowIndex * 2].type}
                  </Link>
                )}
              </View>
              <View style={styles.documentCellLast}>
                {data?.certificates?.[rowIndex * 2 + 1] && (
                  <Link
                    src={data.certificates[rowIndex * 2 + 1].fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {rowIndex * 2 + 2}.{" "}
                    {data.certificates[rowIndex * 2 + 1].type}
                  </Link>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.heading}>UNDERTAKING</Text>
        <View style={styles.section}>
          <Text style={styles.smallText}>
            I promise that I will inform the college immediately in writing in
            case I decided to discontinue my studies or change the college in
            the middle of the academic year. • I understand that my admission is
            subject to my production of the transfer certificate issued under
            the signature of the Principal of the College / School Last
            attended. • I am aware that my admission to the course applied is
            provisional until my original documents are verified by my earlier
            Board/University and subsequent confirmation of my eligibility/
            enrollment by the University of Mumbai. If my eligibility
            /enrollment is denied under any circumstance, I will abide by the
            decision of the ASL/University of Mumbai/DHE/CET CELL. • I am aware
            of the rules regarding attendance in the college and will not
            indulge in any unfair means while appearing in the examination. I am
            aware that my mobile phone or any other gadgets will be confiscated
            by the college authorities and proceed as per the rules of the
            University. • I undertake that all the information provided in the
            application forms is correct to the best of my knowledge. If any
            information is found to be wrong, I agree to abide by the
            College/University rules.• I hereby undertake to abide by the rules
            and regulations made by the College authorities from time to time in
            regard to the conduct of students both in and outside the College
            and I also undertake to submit to the normal enforcement of the same
            to the satisfaction of the management whose decision in all matters
            will be final. • I further declare that I am not enrolled for any
            other academic or professional course of any other University or
            Board/ Institution other than the add-on course as mentioned under
            the Bar Council of India rules. • I agree to attend the classes
            regularly and secure minimum 75% attendance for each subject,
            failing which the institution will not allow me to appear for the
            examination if I am admitted to the course.
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

const PanelPrintForm = () => {
  const [data, setData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    if (id) fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await getSingleFormDataForAdmin(id);
      setData(response);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      {data ? (
        <>
          <button
            style={styles.button}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>

          {showPreview && (
            <PDFViewer style={styles.previewContainer}>
              <MyDocument data={data} />
            </PDFViewer>
          )}

          <PDFDownloadLink
            document={<MyDocument data={data} />}
            fileName={`Student_Form_${
              data?.studentDetails?.firstName || ""
            }_${getFormattedDate()}.pdf`}
          >
            {({ loading }) => (
              <button style={styles.button} disabled={loading}>
                {loading ? "Preparing PDF..." : "Download PDF"}
              </button>
            )}
          </PDFDownloadLink>
        </>
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
};

export default PanelPrintForm;
