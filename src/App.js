import ChangePassword from "./pages/student/ChangePassword";
import { BrowserRouter as Router } from "react-router-dom";
import { Route, Routes, Navigate } from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./assets/vendors/mdi/css/materialdesignicons.min.css";
import "./assets/vendors/css/vendor.bundle.base.css";
import "./assets/css/style.css";

import Dashboard from "./pages/user/Dashboard";
import Forms from "./pages/student/Forms";
import ForgotPass from "./pages/student/auth/ForgotPass";
import Multisteps from "./pages/student/form_steps/Multisteps";
import Preview from "./pages/student/form_steps/Preview";
import PanelDashboard from "./pages/panel/PanelDashboard";
import PanelForms from "./pages/panel/PanelForms";
import PanelMultisteps from "./pages/panel/form_steps/PanelMultisteps";
import PanelPreview from "./pages/panel/form_steps/PanelPreview";
import PanelPrintForm from "./pages/panel/print_form/PanelPrintForm";
import LeadsList from "./pages/panel/leads/LeadsList";
import LinkForm from "./pages/panel/leads/LinkForm";
import LandingPage1 from "./pages/landingpages/LandingPage1";
import AdmissionsLists from "./pages/panel/admissions_list/AdmissionLists";
import Departments from "./pages/panel/departments/Departments";
import DepartmentForm from "./pages/panel/departments/DepartmentForm";
import Programs from "./pages/panel/Programs/Programs";
import ProgramForm from "./pages/panel/Programs/ProgramForm";
import SelectDepartment from "./pages/panel/Programs/SelectDepartment";
import { DepartmentProvider } from "./DepartmentContext";
import AdminLogin from "./pages/panel/auth/AdminLogin";
import AdminPrivateRoute from "./pages/panel/AdminPrivateRoute";
// import StreamForm from "./pages/panel/Programs/StreamForm";
// import { StreamProvider } from "./StreamContext";
import Batches from "./pages/panel/batches/Batches";
import BatchForm from "./pages/panel/batches/BatchForm";
import BatchGroups from "./pages/panel/batch-groups/BatchGroups";
import BatchGroupForm from "./pages/panel/batch-groups/BatchGroupForm";
import BatchGroupView from "./pages/panel/batch-groups/BatchGroupView";
import Faculties from "./pages/panel/Faculties/Faculties";
import FacultyForm from "./pages/panel/Faculties/FacultyForm";
import Subjects from "./pages/panel/Subjects/Subjects";
import SelectProgram from "./pages/panel/Subjects/SelectProgram";
import SubjectForm from "./pages/panel/Subjects/SubjectForm";
import Students from "./pages/panel/Students/Students";
import ArchivedStudents from "./pages/panel/Students/ArchivedStudents";
import ElectiveSessionsPage from "./pages/panel/ElectiveSessions/ElectiveSessionsPage";
import ElectiveSessionDetailPage from "./pages/panel/ElectiveSessions/ElectiveSessionDetailPage";
import ProfileRequests from "./pages/panel/ProfileRequests/ProfileRequests";
import ProfileRequestDetail from "./pages/panel/ProfileRequests/ProfileRequestDetail";
import GradeSchemes from "./pages/panel/GradeSchemes/GradeSchemes";
import GradeSchemeForm from "./pages/panel/GradeSchemes/GradeSchemeForm";
import GradesEntry from "./pages/panel/GradeSchemes/GradesEntry";
import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import FacultyLogin from "./pages/faculty/auth/FacultyLogin";
import MySubjects from "./pages/faculty/MySubjects/MySubjects";
import { FacultyProvider } from "./pages/faculty/FacultyContext";
import { ExaminerProvider } from "./pages/examiner/ExaminerContext";
import ExaminerLogin from "./pages/examiner/ExaminerLogin";
import ExaminerDashboard from "./pages/examiner/ExaminerDashboard";
import ExaminerMarkEntry from "./pages/examiner/ExaminerMarkEntry";
import ExaminerStudents from "./pages/examiner/Students/ExaminerStudents";
import SgpaCalculator from "./pages/examiner/SgpaCalculator";
import ExaminerATKTSubmissions from "./pages/examiner/ExaminerATKTSubmissions";
import ATKTSessionManagement from "./pages/examiner/ATKTSessionManagement";
import ATKTSubjectConfig from "./pages/examiner/ATKTSubjectConfig";
import ATKTSessionSubmissions from "./pages/examiner/ATKTSessionSubmissions";
import RegularExamSessionManagement from "./pages/examiner/RegularExamSessionManagement";
import RegularExamSubjectConfig from "./pages/examiner/RegularExamSubjectConfig";
import RegularExamEnrollments from "./pages/examiner/RegularExamEnrollments";
import SubjectLinking from "./pages/examiner/SubjectLinking";
import RevalSessionManagement from "./pages/examiner/RevalSessionManagement";
import RevalSubjectConfig from "./pages/examiner/RevalSubjectConfig";
import RevalApplications from "./pages/examiner/RevalApplications";
import ResultCardDetail from "./pages/examiner/ResultCardDetail";
import ResultConfigManagement from "./pages/examiner/ResultConfigManagement";
import ResultAuditLog from "./pages/examiner/ResultAuditLog";
import ExportTemplate from "./pages/examiner/ExportTemplate";
import StudentRegularExam from "./pages/student/StudentRegularExam";
import StudentRevaluation from "./pages/student/StudentRevaluation";
import TimeTable from "./pages/panel/TimeTables/TimeTable";
import Calender from "./pages/panel/AcademicCalender/Calender";
import Notifications from "./pages/panel/NotificationCenter/Notifications";
import Feedback from "./pages/panel/Feedback/Feedback";
import Attendance from "./pages/faculty/Attendance/Attendance";
// import Attendance from "./pages/panel/Attendance";
import StudentTimetable from "./pages/student/Timetable/StudentTimetable";
import { StudentProvider } from "./pages/student/StudentContext";
import StudentLogin from "./pages/student/auth/StudentLogin";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProfile from "./pages/student/StudentProfile";
import ElectiveSelection from "./pages/student/ElectiveSelection";
import Assignment from "./pages/faculty/Assignment/Assignment";
import StudentAssignment from "./pages/student/StudentAssignment/StudentAssignment";
import ReportCard from "./pages/faculty/ReportCard";
import Login from "./pages/user/auth/Login";
import Register from "./pages/user/auth/Register";
import FeeStructure from "./pages/student/FeeStructure";
import StudentNotes from "./pages/student/Notes/StudentNotes";
import FeeManagement from "./pages/panel/FeeManagement";
import FeeStructures from "./pages/panel/FeeStructures";
import PaymentHistory from "./pages/panel/PaymentHistory";
import PendingPaymentsNew from "./pages/panel/PendingPaymentsNew";
import ManualPaymentsHistory from "./pages/panel/ManualPaymentsHistory";
import PaymentSuccess from "./PaymentSuccess";
import PaymentFailed from "./PaymentFailed";
import FeeReceipts from "./pages/panel/FeeReceipts";
import PendingPayments from "./pages/panel/PendingPayments";
import StudentATKTForm from "./pages/student/StudentATKTForm";
import AllReceipts from "./pages/student/AllReceipts";
import RubricsMarkingFaculty from "./pages/faculty/RubricsMarking";
import InstallmentSettings from "./pages/panel/InstallmentSettings/InstallmentSettings"; // eslint-disable-line no-unused-vars
import InstallmentSettingsForm from "./pages/panel/InstallmentSettings/InstallmentSettingsForm"; // eslint-disable-line no-unused-vars
import InstallmentSettingsView from "./pages/panel/InstallmentSettings/InstallmentSettingsView"; // eslint-disable-line no-unused-vars
import AcademicCalender from "./pages/faculty/AcademicCalender";
import Notes from "./pages/faculty/Notes/Notes";
import ViewMarks from "./pages/student/ViewMarks";
import AdmissionJobs from "./pages/panel/AdmissionJobs";
import AllLeaves from "./pages/faculty/Leave/AllLeaves";
import ApplyLeave from "./pages/faculty/Leave/ApplyLeave";
import LeaveRequests from "./pages/panel/Leaves/LeaveRequests";
import LeaveStatistics from "./pages/panel/Leaves/LeaveStatistics";
import NonTeachingStaff from "./pages/panel/NonTeachingStaff/NonTeachingStaff";
import NonTeachingStaffForm from "./pages/panel/NonTeachingStaff/NonTeachingStaffForm";
import NonTeachingStaffLogin from "./pages/Non-teaching staff/auth/NonTeachingStaffLogin";
import NonTeachingStaffChangePassword from "./pages/Non-teaching staff/auth/NonTeachingStaffChangePassword";
import NonTeachingStaffApplyLeave from "./pages/Non-teaching staff/leaves/NonTeachingStaffApplyLeave";
import NonTeachingStaffLeaveHistory from "./pages/Non-teaching staff/leaves/NonTeachingStaffLeaveHistory";
import NonTeachingStaffDashboard from "./pages/Non-teaching staff/NonTeachingStaffDashboard";
import NonTeachingStaffProfile from "./pages/Non-teaching staff/NonTeachingStaffProfile";
import NonTeachingStaffDashboardLayout from "./pages/Non-teaching staff/NonTeachingStaffDashboardLayout";
import ProtectedNonTeachingStaffRoute from "./pages/Non-teaching staff/ProtectedNonTeachingStaffRoute";

function App() {
  return (
    <>
      <DepartmentProvider>
        <FacultyProvider>
          <StudentProvider>
            <ExaminerProvider>
              <Router>
                <Routes>
                  <Route path="/" exact element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-pass" element={<ForgotPass />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/forms" element={<Forms />} />
                  <Route
                    path="/add-new-application-form"
                    element={<Multisteps />}
                  />
                  <Route
                    path="/edit-application-form/:id"
                    element={<Multisteps />}
                  />
                  <Route
                    path="/preview-application-form/:id"
                    element={<Preview />}
                  />

                  <Route element={<AdminPrivateRoute />}>
                    <Route
                      path="/panel-admin"
                      element={<Navigate to="/panel-admin/dashboard" />}
                    />
                    <Route
                      path="/panel-admin/dashboard"
                      element={<PanelDashboard />}
                    />
                    <Route path="/panel-admin/forms" element={<PanelForms />} />
                    <Route
                      path="/panel-admin/add-new-application-form"
                      element={<PanelMultisteps />}
                    />
                    <Route
                      path="/panel-admin/edit-application-form/:id"
                      element={<PanelMultisteps />}
                    />
                    <Route
                      path="/panel-admin/preview-application-form/:id"
                      element={<PanelPreview />}
                    />
                    <Route
                      path="/panel-admin/print-form/:id"
                      element={<PanelPrintForm />}
                    />
                    <Route
                      path="/panel-admin/non-teaching-staff"
                      element={<NonTeachingStaff />}
                    />
                    <Route
                      path="/panel-admin/add-new-non-teaching-staff-form"
                      element={<NonTeachingStaffForm/>}
                    />
                    {/* Leave Management */}
                    <Route
                      path="/panel-admin/leave-requests"
                      element={<LeaveRequests />}
                    />
                    <Route
                      path="/panel-admin/leave-statistics"
                      element={<LeaveStatistics />}
                    />

                    {/* leads */}
                    <Route path="/panel-admin/leads" element={<LeadsList />} />
                    <Route
                      path="/panel-admin/add-new-link-form"
                      element={<LinkForm />}
                    />
                    <Route
                      path="/panel-admin/edit-link-form/:id"
                      element={<LinkForm />}
                    />

                    {/* Departments */}
                    <Route
                      path="/panel-admin/departments"
                      element={<Departments />}
                    />
                    <Route
                      path="/panel-admin/add-new-department-form"
                      element={<DepartmentForm />}
                    />
                    <Route
                      path="/panel-admin/edit-department-form/:id"
                      element={<DepartmentForm />}
                    />

                    {/* Programs */}
                    <Route
                      path="/panel-admin/programs"
                      element={<Programs />}
                    />
                    <Route
                      path="/panel-admin/select-department"
                      element={<SelectDepartment />}
                    />
                    <Route
                      path="/panel-admin/edit-program-form/:id"
                      element={
                        // <StreamProvider>
                        <ProgramForm />
                        // </StreamProvider>
                      }
                    />
                    {/* <Route
                  path="/panel-admin/stream-form"
                  element={
                    <StreamProvider>
                      <StreamForm />
                    </StreamProvider>
                  }
                /> */}
                    {/* <Route
                  path="/panel-admin/stream-form/:id"
                  element={
                    <StreamProvider>
                      <StreamForm />
                    </StreamProvider>
                  }
                /> */}
                    <Route
                      path="/panel-admin/add-new-program-form"
                      element={
                        // <StreamProvider>
                        <ProgramForm />
                        // </StreamProvider>
                      }
                    />

                    {/* Batches */}
                    <Route path="/panel-admin/batches" element={<Batches />} />
                    <Route
                      path="/panel-admin/add-new-batch-form"
                      element={<BatchForm />}
                    />
                    <Route
                      path="/panel-admin/edit-batch-form/:id"
                      element={<BatchForm />}
                    />

                    {/* Batch Groups */}
                    <Route
                      path="/panel-admin/batch-groups"
                      element={<BatchGroups />}
                    />
                    <Route
                      path="/panel-admin/add-batch-group"
                      element={<BatchGroupForm />}
                    />
                    <Route
                      path="/panel-admin/edit-batch-group/:id"
                      element={<BatchGroupForm />}
                    />
                    <Route
                      path="/panel-admin/batch-group/:id"
                      element={<BatchGroupView />}
                    />

                    <Route
                      path="/panel-admin/admission-jobs"
                      element={<AdmissionJobs />}
                    ></Route>
                    <Route
                      path="/panel-admin/admission-jobs/:jobId"
                      element={<AdmissionJobs />}
                    ></Route>

                    {/* Faculties */}
                    <Route
                      path="/panel-admin/faculties"
                      element={<Faculties />}
                    />
                    <Route
                      path="/panel-admin/add-new-faculty-form"
                      element={<FacultyForm />}
                    />
                    <Route
                      path="/panel-admin/edit-faculty-form/:id"
                      element={<FacultyForm />}
                    />

                    {/* Subjects */}
                    <Route
                      path="/panel-admin/subjects"
                      element={<Subjects />}
                    />
                    <Route
                      path="/panel-admin/select-program"
                      element={<SelectProgram />}
                    />
                    <Route
                      path="/panel-admin/add-new-subject-form"
                      element={<SubjectForm />}
                    />
                    <Route
                      path="/panel-admin/edit-subject-form/:id"
                      element={<SubjectForm />}
                    />

                    {/* Students */}
                    <Route
                      path="/panel-admin/students"
                      element={<Students />}
                    />
                    <Route
                      path="/panel-admin/archived-students"
                      element={<ArchivedStudents />}
                    />
                    <Route
                      path="/panel-admin/elective-sessions"
                      element={<ElectiveSessionsPage />}
                    />
                    <Route
                      path="/panel-admin/elective-sessions/:id"
                      element={<ElectiveSessionDetailPage />}
                    />
                    <Route
                      path="/panel-admin/profile-requests"
                      element={<ProfileRequests />}
                    />
                    <Route
                      path="/panel-admin/profile-requests/:id"
                      element={<ProfileRequestDetail />}
                    />

                    {/* Grade Scheme */}
                    <Route
                      path="/panel-admin/grade-schemes"
                      element={<GradeSchemes />}
                    />
                    <Route
                      path="/panel-admin/add-grade-scheme"
                      element={<GradeSchemeForm />}
                    />
                    <Route
                      path="/panel-admin/add-grades"
                      element={<GradesEntry />}
                    />
                    <Route
                      path="/panel-admin/edit-grades/:id"
                      element={<GradesEntry />}
                    />

                    {/* TimeTable */}
                    <Route
                      path="/panel-admin/timetable"
                      element={<TimeTable />}
                    />

                    {/* AcademicCalender */}
                    <Route
                      path="/panel-admin/academic-calender"
                      element={<Calender />}
                    />

                    {/* Notificaion Center */}
                    <Route
                      path="/panel-admin/notification-center"
                      element={<Notifications />}
                    />

                    {/* Feedback */}
                    <Route
                      path="/panel-admin/feedback"
                      element={<Feedback />}
                    />

                    {/* Fee Management */}
                    <Route
                      path="/panel-admin/fee-structures"
                      element={<FeeStructures />}
                    />
                    <Route
                      path="/panel-admin/fee-management"
                      element={<FeeManagement />}
                    />
                    <Route
                      path="/panel-admin/transaction-history"
                      element={<PaymentHistory />}
                    />
                    <Route
                      path="/panel-admin/fee-receipts"
                      element={<FeeReceipts />}
                    />
                    <Route
                      path="/panel-admin/payments"
                      element={<PendingPaymentsNew />}
                    />
                    <Route
                      path="/panel-admin/manual-payments"
                      element={<ManualPaymentsHistory />}
                    />

                    {/* Installment Settings */}
                    <Route
                      path="/panel-admin/installment-settings"
                      element={<InstallmentSettings />}
                    />
                    <Route
                      path="/panel-admin/installment-settings/create"
                      element={<InstallmentSettingsForm />}
                    />
                    <Route
                      path="/panel-admin/installment-settings/edit/:id"
                      element={<InstallmentSettingsForm />}
                    />
                    <Route
                      path="/panel-admin/installment-settings/view/:id"
                      element={<InstallmentSettingsView />}
                    />

                    {/* admission enquiry */}
                    <Route
                      path="/panel-admin/admissions-enquiry"
                      element={<AdmissionsLists />}
                    />
                  </Route>

                  <Route path="/non-teaching-staff/login" element={<NonTeachingStaffLogin />} />

                  <Route 
                    path="/non-teaching-staff" 
                    element={
                      <ProtectedNonTeachingStaffRoute>
                        <NonTeachingStaffDashboardLayout />
                      </ProtectedNonTeachingStaffRoute>
                    }
                  >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<NonTeachingStaffDashboard />} />
                    <Route path="profile" element={<NonTeachingStaffProfile />} />
                    <Route path="apply-leave" element={<NonTeachingStaffApplyLeave />} />
                    <Route path="leave-history" element={<NonTeachingStaffLeaveHistory />} />
                    <Route path="change-password" element={<NonTeachingStaffChangePassword />} />
                  </Route>

                  <Route path="/panel-admin/login" element={<AdminLogin />} />
                  <Route path="/faculty/login" element={<FacultyLogin />} />
                  <Route
                    path="/faculty/dashboard"
                    element={<FacultyDashboard />}
                  />
                  <Route path="/faculty/my-subjects" element={<MySubjects />} />
                  <Route path="/faculty/assignment" element={<Assignment />} />
                  <Route
                    path="/faculty/rubrics-marking"
                    element={<RubricsMarkingFaculty />}
                  />
                  <Route
                    path="/faculty/academic-calender"
                    element={<AcademicCalender />}
                  />
                  <Route path="/faculty/apply-leave" element={<ApplyLeave />} />
                  <Route path="/faculty/all-leaves" element={<AllLeaves />} /> 
                  <Route path="/faculty/notes" element={<Notes />} />
                  <Route path="/faculty/attendance" element={<Attendance />} />
                  <Route path="/examiner/login" element={<ExaminerLogin />} />
                  <Route
                    path="/examiner/dashboard"
                    element={<ExaminerDashboard />}
                  />
                  <Route
                    path="/examiner/mark-entry"
                    element={<ExaminerMarkEntry />}
                  />
                  <Route
                    path="/examiner/sgpa-calculator"
                    element={<SgpaCalculator />}
                  />
                  <Route
                    path="/examiner/students"
                    element={<ExaminerStudents />}
                  />
                  <Route
                    path="/examiner/atkt-submissions"
                    element={<ExaminerATKTSubmissions />}
                  />
                  <Route
                    path="/examiner/atkt-sessions"
                    element={<ATKTSessionManagement />}
                  />
                  <Route
                    path="/examiner/atkt-sessions/:sessionId/subjects"
                    element={<ATKTSubjectConfig />}
                  />
                  <Route
                    path="/examiner/atkt-sessions/:sessionId/submissions"
                    element={<ATKTSessionSubmissions />}
                  />
                  <Route
                    path="/examiner/regular-exam-sessions"
                    element={<RegularExamSessionManagement />}
                  />
                  <Route
                    path="/examiner/regular-exam-sessions/:sessionId/subjects"
                    element={<RegularExamSubjectConfig />}
                  />
                  <Route
                    path="/examiner/regular-exam-sessions/:sessionId/enrollments"
                    element={<RegularExamEnrollments />}
                  />
                  <Route
                    path="/examiner/subject-linking"
                    element={<SubjectLinking />}
                  />
                  <Route
                    path="/examiner/reval-sessions"
                    element={<RevalSessionManagement />}
                  />
                  <Route
                    path="/examiner/reval-sessions/:sessionId/subjects"
                    element={<RevalSubjectConfig />}
                  />
                  <Route
                    path="/examiner/reval-sessions/:sessionId/applications"
                    element={<RevalApplications />}
                  />
                  <Route
                    path="/examiner/result-cards"
                    element={<ResultConfigManagement />}
                  />
                  <Route
                    path="/examiner/export-template"
                    element={<ExportTemplate />}
                  />
                  <Route
                    path="/examiner/result-cards/:configId"
                    element={<ResultCardDetail />}
                  />
                  <Route
                    path="/examiner/result-cards/:configId/audit"
                    element={<ResultAuditLog />}
                  />
                  {/* Student Panel */}
                  <Route path="/student/login" element={<StudentLogin />} />
                  <Route
                    path="/student/timetable"
                    element={<StudentTimetable />}
                  />
                  <Route
                    path="/student/dashboard"
                    element={<StudentDashboard />}
                  />
                  <Route
                    path="/student/assignment"
                    element={<StudentAssignment />}
                  />
                  <Route path="/student/view-marks" element={<ViewMarks />} />
                  <Route
                    path="/student/fee-structure"
                    element={<FeeStructure />}
                  />
                  <Route path="/student/notes" element={<StudentNotes />} />
                  <Route
                    path="/student/change-password"
                    element={<ChangePassword />}
                  />
                  <Route
                    path="/student/atkt-form"
                    element={<StudentATKTForm />}
                  />
                  <Route
                    path="/student/transactions"
                    element={<AllReceipts />}
                  />
                  <Route
                    path="/student/regular-exam"
                    element={<StudentRegularExam />}
                  />
                  <Route
                    path="/student/revaluation"
                    element={<StudentRevaluation />}
                  />
                  <Route
                    path="/student/profile"
                    element={<StudentProfile />}
                  />
                  <Route
                    path="/student/elective-selection"
                    element={<ElectiveSelection />}
                  />
                  <Route path="/reportcard" element={<ReportCard />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/payment-failed" element={<PaymentFailed />} />

                  {/* landing page open to all  */}
                  <Route path="/landing-page-1" element={<LandingPage1 />} />
                </Routes>
              </Router>
            </ExaminerProvider>
          </StudentProvider>
        </FacultyProvider>
      </DepartmentProvider>

      <ToastContainer />
    </>
  );
}

export default App;
