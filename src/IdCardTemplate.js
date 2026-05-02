const IdCardTemplate = (student) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ID Card Template</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Rubik', sans-serif;
        }
        .id-card {
            width: 570px;
            height: 370px;
        }
    </style>
</head>
<body class="bg-gray-100 flex justify-center p-4">
    <div class="w-full max-w-5xl mx-auto">
        <div class="flex flex-col items-center gap-8">
            <!-- Front of the Card -->
            <div id="id-card-front-container">
                <div class="id-card bg-white border-2 border-gray-900 rounded-lg shadow-lg flex flex-col justify-between overflow-hidden">
                    <!-- Header -->
                    <div class="p-2 flex items-center justify-between">
                        <div class="w-24 flex justify-center items-center flex-shrink-0">
                            <img src="${student.agnelLogoBase64}" alt="Logo" class="w-35 h-35">
                        </div>
                        <div class="text-center flex-grow px-2">
                            <p class="text-sm font-semibold">AGNEL CHARITIES</p>
                            <h1 class="text-base font-bold text-gray-900">AGNEL SCHOOL OF LAW</h1>
                            <div class="text-[10px] text-gray-600 leading-tight mt-1">
                                <p>AGNEL TECHNICAL EDUCATION COMPLEX, SECTOR 9A, VASHI, NEAR NOOR MASJID, NAVI MUMBAI, MAHARASHTRA 400703</p>
                                <p>www.agnelschooloflaw.com | +91 2227771000 | asl@agnelschooloflaw.com</p>
                            </div>
                            <div class="text-xs font-bold mt-2 border-2 border-yellow-500 py-0.5 px-2 inline-block">
                                <!-- AY 2025-26 -->
                                ${student.academicYear || ""}
                            </div>
                        </div>
                        <div class="w-24 flex justify-center items-center flex-shrink-0">
                            <img src="${student.naacLogoBase64}" alt="NAAC Logo" class="w-25 h-25">
                        </div>
                    </div>
                    <!-- Body -->
                    <div class="px-2 py-1">
                        <div class="flex items-center justify-center gap-4">
                            <div class="text-sm flex-1">
                                <p><span class="font-bold">NAME:</span> <span class="uppercase">${student.studentDetails.firstName} ${student.studentDetails.middleName} ${student.studentDetails.lastName}</span></p>
                                <p><span class="font-bold">Course:</span> <span class="uppercase">${student.academicDetails.program}</span></p>
                                <p><span class="font-bold">Roll No:</span> ${student.academicDetails.rollNumber}</p>
                                <p><span class="font-bold">Date of Birth:</span> <span class="uppercase">${student.studentDetails.dateOfBirth}</span></p>
                                <p><span class="font-bold">Year of Joining:</span> <span class="uppercase">${student.academicDetails.yearOfJoining}</span></p>
                            </div>
                            <div class="pr-4">
                                <img src="${student.studentPhotoUrl}" alt="Student" class="w-30 h-36 border-2 border-gray-400">
                            </div>
                        </div>
                    </div>
                    <!-- Footer -->
                    <div class="flex justify-between text-xs bg-yellow-400 px-2 py-2 text-center">
                         <div class="w-1/3 flex flex-col items-center">
                            <div class="h-7 w-28 border-b border-black">
                                <img src="${student.studentSignUrl}" alt="Student Signature" class="h-full w-full object-contain" />
                            </div>
                            <p class="mt-2">Student Signature</p>
                         </div>
                         <div class="w-1/3 flex flex-col items-center">
                              <div class="h-7 w-28 border-b border-black">
                                 <img src="${student.principalSignBase64}" alt="Principal Signature" class="h-full w-full object-contain" />
                              </div>
                              <p class="mt-2">Principal</p>
                          </div>
                          <div class="w-1/3 flex flex-col items-center">
                              <div class="h-7 w-28 border-b border-black">
                                 <img src="${student.collegeSealBase64}" alt="College Seal" class="h-full w-full object-contain" />
                              </div>
                              <p class="mt-2">College Seal</p>
                          </div>
                    </div>
                </div>
            </div>
            <!-- Back of the Card -->
            <div id="id-card-back-container">
                <div class="id-card bg-white border-2 border-gray-900 rounded-lg shadow-lg flex flex-col justify-between overflow-hidden">
                    <div class="p-4 text-sm space-y-2">
                        <p><span class="font-bold">Blood Group:</span> ${student.studentDetails.bloodGroup || ""}</p>
                        <p><span class="font-bold">Mobile No:</span> ${student.studentDetails.studentMobileNumber}</p>
                        <p><span class="font-bold">E-Mail:</span> ${student.studentDetails.emailAddress}</p>
                        <p><span class="font-bold">Address:</span> ${student.studentDetails.address || ""}</p>
                        <p class="mt-8">
                            <span class="font-bold">If Found please return to:</span><br>
                            Agnel School of Law,<br>
                            Sector-9A, Vashi, Navi Mumbai,<br>
                            Maharashtra, India, PIN - 400703.
                        </p>
                    </div>
                    <div class="bg-yellow-400 p-2 text-center text-black text-xs">
                        This card is the property of Agnel School of Law and must be surrendered upon request.
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;

export default IdCardTemplate;
