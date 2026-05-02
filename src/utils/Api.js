import axios from "axios";

//export const baseURL = "https://lms.raphaedu.com/backend/api"; // Default: production
//export const baseURL = "http://localhost:8000/api"; // Local development
export const baseURL =
  process.env.REACT_APP_BASE_HOST_URL || "https://lms.raphaedu.com/backend/api";
  // "http://localhost:8001/api";
const instance = axios.create({
  baseURL,
});

// Add a request interceptor
instance.interceptors.request.use(
  function (config) {
    const token =
      localStorage.getItem("studentToken") ||
      localStorage.getItem("examinerToken") ||
      localStorage.getItem("adminToken") ||
      localStorage.getItem("facultyToken") ||
      localStorage.getItem("userToken") ||
      localStorage.getItem("nonTeachingStaffToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

export function clearAuthTokens() {
  localStorage.removeItem("userToken");
  localStorage.removeItem("studentToken");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("facultyToken");
  localStorage.removeItem("examinerToken");
  localStorage.removeItem("isAdmin");
localStorage.removeItem("nonTeachingStaffToken");
  localStorage.removeItem("nonTeachingStaffData");
}

// Add a response interceptor
instance.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired
      clearAuthTokens();
      // Redirect to login page
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

export const examinerLoginAPI = async (userData) => {
  try {
    const response = await instance.post("/examiner/login", userData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAtktCatalogAPI = async (examSessionId) => {
  try {
    const response = await instance.get("/atkt/catalog", {
      params: examSessionId ? { examSessionId } : {},
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const submitAtktFormAPI = async (formData) => {
  try {
    const response = await instance.post("/atkt/forms", formData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAtktFormsAPI = async (filters = {}) => {
  try {
    const response = await instance.get("/atkt/forms", {
      params: filters,
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadAtktFormsExcelAPI = async (filters = {}) => {
  try {
    const response = await instance.get("/atkt/forms/download-excel", {
      params: filters,
      responseType: "blob",
      headers: {
        Authorization:
          "Bearer " +
          (localStorage.getItem("adminToken") ||
            localStorage.getItem("examinerToken")),
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getAtktStatusAPI = async () => {
  try {
    const response = await instance.get("/atkt/status");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const toggleAtktStatusAPI = async () => {
  try {
    const response = await instance.put("/atkt/status");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMyAtktFormAPI = async (examSessionId) => {
  try {
    const response = await instance.get("/atkt/my-form", {
      params: examSessionId ? { examSessionId } : {},
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateAtktFormAPI = async (id, updates) => {
  try {
    const response = await instance.put(`/atkt/forms/${id}`, updates, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteAtktFormAPI = async (id) => {
  try {
    const response = await instance.delete(`/atkt/forms/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createManualAtktFormAPI = async (formData) => {
  try {
    const response = await instance.post("/atkt/forms/manual", formData, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ATKT Admin/Examiner Session Management APIs
export const getAtktSessionsAPI = async (filters = {}) => {
  try {
    const response = await instance.get("/atkt-admin/sessions", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createAtktSessionAPI = async (sessionData) => {
  try {
    const response = await instance.post("/atkt-admin/sessions", sessionData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateAtktSessionAPI = async (sessionId, updates) => {
  try {
    const response = await instance.put(
      `/atkt-admin/sessions/${sessionId}`,
      updates,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const activateAtktSessionAPI = async (sessionId) => {
  try {
    const response = await instance.put(
      `/atkt-admin/sessions/${sessionId}/activate`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deactivateAtktSessionAPI = async (sessionId) => {
  try {
    const response = await instance.put(
      `/atkt-admin/sessions/${sessionId}/deactivate`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const closeAtktSessionAPI = async (sessionId) => {
  try {
    const response = await instance.put(
      `/atkt-admin/sessions/${sessionId}/close`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteAtktSessionAPI = async (sessionId) => {
  try {
    const response = await instance.delete(`/atkt-admin/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSubjectConfigsAPI = async (sessionId) => {
  try {
    const response = await instance.get("/atkt-admin/subject-configs", {
      params: { examSessionId: sessionId },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createSubjectConfigAPI = async (sessionId, configData) => {
  try {
    const response = await instance.post(
      "/atkt-admin/subject-configs",
      { ...configData, examSessionId: sessionId },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateSubjectConfigAPI = async (configId, updates) => {
  try {
    const response = await instance.put(
      `/atkt-admin/subject-configs/${configId}`,
      updates,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteSubjectConfigAPI = async (configId) => {
  try {
    const response = await instance.delete(
      `/atkt-admin/subject-configs/${configId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const bulkCreateSubjectConfigsAPI = async (sessionId, configsArray) => {
  try {
    const response = await instance.post(
      "/atkt-admin/subject-configs/bulk",
      { configurations: configsArray, examSessionId: sessionId },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAtktBatchNamesAPI = async () => {
  try {
    const response = await instance.get("/atkt/batch-names");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadAtktHallTicketAPI = async (formId) => {
  try {
    const response = await instance.get(`/atkt/forms/${formId}/hall-ticket`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const bulkDownloadAtktHallTicketsAPI = async (filters = {}) => {
  try {
    const response = await instance.get(
      "/atkt/forms/bulk-download-hall-tickets",
      {
        params: filters,
        responseType: "blob",
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ATKT Bulk Hall Ticket Job-based APIs
export const startAtktBulkHallTicketJobAPI = async (filters = {}) => {
  try {
    const response = await instance.get(
      "/atkt/start-bulk-hall-ticket-generation",
      {
        params: filters,
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAtktBulkHallTicketJobStatusAPI = async (jobId) => {
  try {
    const response = await instance.get(
      `/atkt/bulk-hall-ticket-status/${jobId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadAtktBulkHallTicketResultAPI = async (jobId) => {
  try {
    const response = await instance.get(
      `/atkt/bulk-download-result/${jobId}`,
      {
        responseType: "blob",
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const changeStudentPassword = async ({
  currentPassword,
  newPassword,
}) => {
  return instance.post("/students/change-password", {
    currentPassword,
    newPassword,
  });
};

export const registerAPI = async (userData) => {
  try {
    const response = await instance.post("/user/register", userData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const loginAPI = async (userData) => {
  try {
    const response = await instance.post("/user/login", userData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// student API - FIXED: Changed from /students to /student
export const studentLoginAPI = async (userData) => {
  try {
    const response = await instance.post("/students/login", userData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// User forgot password
export const forgotPassAPI = async (userData) => {
  try {
    const response = await instance.post("/user/forgot-password", userData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Student forgot password - FIXED: Changed from /students to /student
export const forgotStudentPassAPI = async (userData) => {
  try {
    const response = await instance.post(
      "/students/forgot-password",
      userData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
// form
export const submitStep1 = async (userData) => {
  try {
    const response = await instance.post(
      "/form/register-application",
      userData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getFormLists = async (userData) => {
  try {
    const response = await instance.get("/form/get-applications", {
      params: userData,
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProgramByName = async (programName) => {
  try {
    const response = await instance.get(`/program/fee-by-name/${programName}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getSingleFormData = async (id) => {
  try {
    const response = await instance.get(`/form/get-single-application/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateApplicationForm = async (userData) => {
  try {
    const response = await instance.post("/form/update-application", userData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// admin routes
export const getFormListsForAdmin = async (userData) => {
  try {
    const response = await instance.get("/form/get-applications-for-admin", {
      params: userData,
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getSingleFormDataForAdmin = async (id) => {
  try {
    const response = await instance.get(
      `/form/get-single-application-for-admin/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const submitStep1ForAdmin = async (userData) => {
  try {
    const response = await instance.post(
      "/form/register-application",
      userData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateApplicationFormForAdmin = async (userData) => {
  try {
    const response = await instance.post("/form/update-application", userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// leads
export const createLeadCaptureLinkViaAdmin = async (userData) => {
  try {
    const response = await instance.post("/lead/create-new-link", userData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getAllLinkViaAdmin = async (userData) => {
  try {
    const response = await instance.get("/lead/get-all-links", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSingleLinkViaAdmin = async (userData) => {
  try {
    const response = await instance.get(`/lead/get-link/${userData.id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const UpdateLinkViaAdmin = async (userData) => {
  try {
    const response = await instance.put(
      `/lead/update-link/${userData.id}`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteLinkViaAdmin = async (userData) => {
  try {
    const response = await instance.delete(`/lead/delete-link/${userData.id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSingleLinkForLandingWithIdAndUniqueId = async (userData) => {
  try {
    const response = await instance.get(
      `/lead/get-link-with-id-unique/${userData.id}/${userData.uniqueId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getFormListsForAdminFilters = async (
  filters = {},
  { page = 1, limit = 10, includeIds = false } = {},
) => {
  try {
    const response = await instance.post(
      "/form/get-applications-for-admin-filters",
      { ...filters, page, limit, includeIds },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// razorpay
export const getRazorPayACCKey = async () => {
  try {
    const response = await instance.post(
      `/payments/get-key`,
      {}, // Empty body for POST request
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRazorPayACCKeyStudent = async () => {
  try {
    const response = await instance.get(`/payments/get-key-student`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createCheckoutOfRazorPay = async (userData) => {
  try {
    const response = await instance.post(
      `/payments/create-checkout`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPaymentTypesAPI = async () => {
  try {
    const response = await instance.get("/payments/payment-types");
    return response.data;
  } catch (error) {
    console.error("Error fetching payment types:", error);
    return null;
  }
};

export const getApplicationPaymentStatus = async (applicationId) => {
  try {
    const response = await instance.get(
      `/payments/status/application/${applicationId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyHostedPayment = async (userData) => {
  try {
    const response = await instance.post(
      `/payments/verify-hosted-payment`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const capturePaymentOfRazorPay = async (userData) => {
  try {
    const response = await instance.post(
      `/payments/capture-payment`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// landing page
export const captureLead = async (userData) => {
  try {
    const response = await instance.post(
      `/landing/capture-landing-page-lead`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAdmissionLeadsForAdmin = async (userData) => {
  try {
    const response = await instance.post(
      `/landing/get-all-landing-page-leads`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ----------------------------------------
export const createDepartmentViaAdmin = async (userData) => {
  try {
    const response = await instance.post(
      "/department/create-new-department",
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllDepartmentsViaAdmin = async (userData) => {
  try {
    const response = await instance.get("/department/get-all-departments", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteDepartmentViaAdmin = async (userData) => {
  try {
    const response = await instance.delete(
      `/department/delete-a-department/${userData.id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const UpdateDepartmentViaAdmin = async (userData) => {
  try {
    const response = await instance.put(
      `/department/update-a-department/${userData.id}`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getSingleDepartmentViaAdmin = async (userData) => {
  try {
    const response = await instance.get(
      `/department/get-department/${userData.id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//-----------------------
export const createProgramViaAdmin = async (userData) => {
  try {
    const response = await instance.post(
      "/program/create-new-program",
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getAllProgramsViaAdmin = async () => {
  try {
    const response = await instance.get("/program/get-all-programs", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteProgramViaAdmin = async (userData) => {
  try {
    const response = await instance.delete(
      `/program/delete-a-program/${userData.id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const UpdateProgramViaAdmin = async (userData) => {
  try {
    const response = await instance.put(
      `/program/update-a-program/${userData.id}`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSingleProgramViaAdmin = async (userData) => {
  try {
    const response = await instance.get(`/program/get-program/${userData.id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkProgramCapacity = async (programName) => {
  try {
    const response = await instance.get(`/program/is-full/${programName}`);
    return response.data.isFull;
  } catch (error) {
    console.error("Error checking program capacity:", error);
    return false;
  }
};

//-----------------
export const createBatchViaAdmin = async (userData) => {
  try {
    const response = await instance.post("/batch/create-new-batch", userData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllBatchesViaAdmin = async (userData) => {
  try {
    const response = await instance.get("/batch/get-all-batches", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteBatchViaAdmin = async (userData) => {
  try {
    console.log(userData.id);
    const response = await instance.delete(
      `/batch/delete-a-batch/${userData.id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const UpdateBatchViaAdmin = async (userData) => {
  try {
    const response = await instance.put(
      `/batch/update-a-batch/${userData.id}`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSingleBatchViaAdmin = async (userData) => {
  try {
    const response = await instance.get(`/batch/get-batch/${userData.id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const promoteBatchById = async (userData) => {
  try {
    const response = await instance.put(
      `/batch/promote-batch/${userData.id}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const demoteBatchById = async (userData) => {
  try {
    const response = await instance.put(
      `/batch/demote-batch/${userData.id}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//-----------------------
// Batch Groups - grouping multiple batches together
export const createBatchGroupViaAdmin = async (data) => {
  try {
    const response = await instance.post("/batch-groups/create", data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllBatchGroupsViaAdmin = async () => {
  try {
    const response = await instance.get("/batch-groups/all", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBatchGroupByIdViaAdmin = async (id) => {
  try {
    const response = await instance.get(`/batch-groups/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateBatchGroupViaAdmin = async (id, data) => {
  try {
    const response = await instance.put(`/batch-groups/${id}`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteBatchGroupViaAdmin = async (id) => {
  try {
    const response = await instance.delete(`/batch-groups/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addBatchesToGroupViaAdmin = async (groupId, batchIds) => {
  try {
    const response = await instance.put(
      `/batch-groups/${groupId}/add-batches`,
      { batchIds },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeBatchesFromGroupViaAdmin = async (groupId, batchIds) => {
  try {
    const response = await instance.put(
      `/batch-groups/${groupId}/remove-batches`,
      { batchIds },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const rearrangeStudentsInGroupViaAdmin = async (groupId, { maxPerBatch = 90, dryRun = false } = {}) => {
  try {
    const response = await instance.post(
      `/batch-groups/${groupId}/rearrange-students`,
      { maxPerBatch, dryRun },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//-----------------------
// similar add update delete faculty
export const facultyLoginAPI = async (userData) => {
  try {
    const response = await instance.post("/faculty/login", userData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const facultyForgotPassAPI = async (userData) => {
  try {
    const response = await instance.post("/faculty/forgot-password", userData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createFacultyViaAdmin = async (userData) => {
  try {
    console.log(userData);
    const response = await instance.post(
      "/faculty/create-new-faculty",
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getAllFacultiesViaAdmin = async (userData) => {
  try {
    const response = await instance.get("/faculty/get-all-faculties", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    // Ensure the return value is always { faculties: [...] } with facultyName property
    let faculties = [];
    if (Array.isArray(response.data)) {
      faculties = response.data;
    } else if (Array.isArray(response.data.faculties)) {
      faculties = response.data.faculties;
    } else if (Array.isArray(response.data.data)) {
      faculties = response.data.data;
    }
    // Fallback: filter only those with facultyName property
    faculties = faculties.filter((f) => f.facultyName);
    return { faculties };
  } catch (error) {
    throw error;
  }
};
export const deleteFacultyViaAdmin = async (userData) => {
  try {
    const response = await instance.delete(
      `/faculty/delete-a-faculty/${userData.id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const UpdateFacultyViaAdmin = async (userData) => {
  try {
    const response = await instance.put(
      `/faculty/update-a-faculty/${userData.id}`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getSingleFacultyViaAdmin = async (userData) => {
  try {
    const response = await instance.get(`/faculty/get-faculty/${userData.id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const mailFacultyLoginDetailsViaAdmin = async (id) => {
  try {
    const response = await instance.post(
      `/faculty/mail-details-faculty/${id}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//-----------------------------
// similar add update delete subject
export const createSubjectViaAdmin = async (userData) => {
  try {
    const response = await instance.post(
      "/subject/create-new-subject",
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getAllSubjectsViaAdmin = async (userData) => {
  try {
    const response = await instance.get("/subject/get-all-subjects", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const deleteSubjectViaAdmin = async (userData) => {
  try {
    const response = await instance.delete(
      `/subject/delete-a-subject/${userData.id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const UpdateSubjectViaAdmin = async (userData) => {
  try {
    const response = await instance.put(
      `/subject/update-a-subject/${userData.id}`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getSingleSubjectViaAdmin = async (userData) => {
  try {
    const response = await instance.get(`/subject/get-subject/${userData.id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadSubjectsExcelViaAdmin = async () => {
  try {
    const response = await instance.get("/subject/download-excel", {
      responseType: "blob",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Backward compatibility

export const downloadFacultiesExcelViaAdmin = async () => {
  try {
    const response = await instance.get("/faculty/download-excel", {
      responseType: "blob",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

//----------------------------------------
// similar add update delete grade
export const createGradeSchemeViaAdmin = async (userData) => {
  // Only send allowed fields: program, gradeSchemeName, grades
  const payload = {
    program: userData.program,
    gradeSchemeName: userData.gradeSchemeName,
    grades: userData.grades,
  };
  try {
    const response = await instance.post("/grade/create-new-scheme", payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const addGradeToSchemeViaAdmin = async (userData) => {
  try {
    const response = await instance.post(
      `/grade/add-new-grade/${userData.id}`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getAllGradeSchemesViaAdmin = async () => {
  try {
    const response = await instance.get("/grade/get-all-gradeSchemes", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getGradeSchemeByIdViaAdmin = async (id) => {
  try {
    const response = await instance.get(`/grade/get-gradeScheme/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const updateGradeSchemeViaAdmin = async (id, data) => {
  try {
    const response = await instance.put(
      `/grade/update-gradeScheme/${id}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const deleteGradeSchemeViaAdmin = async (id) => {
  try {
    const response = await instance.delete(`/grade/delete-gradeScheme/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// -----------------------------

// Admit Student
export const admitStudentViaAdmin = async (id, data) => {
  try {
    const response = await instance.post(`/students/admitStudent/${id}`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const admitMultipleStudentsViaAdmin = async (data) => {
  try {
    const response = await instance.post("/students/admit-multiple", data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const startBulkAdmissionJob = async (data) => {
  try {
    const response = await instance.post("/students/admit-multiple", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAdmissionJobStatus = async (jobId) => {
  try {
    const response = await instance.get(`/students/admission-job/${jobId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllAdmissionJobs = async () => {
  try {
    const response = await instance.get("/students/admission-jobs");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Cancel student admission (archives the student)
export const cancelStudentAdmissionViaAdmin = async (id, note = "") => {
  try {
    const response = await instance.patch(
      `/students/cancel-admission/${id}`,
      { note },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error canceling student admission:", error);
    throw error;
  }
};

// get all subjects of a batch
export const getAllSubjectsOfBatchViaAdmin = async (id) => {
  try {
    const response = await instance.get(
      `/batch/get-all-subjects-of-batch/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// get all students for a batch
export const getAllStudentsForABatchViaAdmin = async (batchName, subjectId) => {
  try {
    let url = `/students/students-for-batch?batchName=${batchName}`;
    if (subjectId) {
      url += `&subjectId=${subjectId}`;
    }
    const response = await instance.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// get all students
export const getAllStudentsViaAdmin = async (page = 1, filters = {}) => {
  try {
    const queryParams = new URLSearchParams({ page, ...filters }).toString();
    const response = await instance.get(`/students?${queryParams}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// get all students via examiner (read-only)
export const getAllStudentsViaExaminer = async (page = 1, filters = {}) => {
  try {
    const queryParams = new URLSearchParams({ page, ...filters }).toString();
    const response = await instance.get(`/students?${queryParams}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("examinerToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// get all programs via examiner
export const getAllProgramsViaExaminer = async () => {
  try {
    const response = await instance.get("/program/get-all-programs", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("examinerToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// get all batches via examiner
export const getAllBatchesViaExaminer = async () => {
  try {
    const response = await instance.get("/batch/get-all-batches", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("examinerToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get student by ID via examiner (read-only)
export const getStudentByIdViaExaminer = async (studentId) => {
  try {
    const response = await instance.get(`/students/${studentId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("examinerToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadAllStudentsExcel = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await instance.get(`/students/download?${queryParams}`, {
      responseType: "blob",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get student by ID with full details
export const getStudentByIdViaAdmin = async (studentId) => {
  try {
    const response = await instance.get(`/students/${studentId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update student certificate status
export const updateStudentCertificateStatusViaAdmin = async (studentId, certificateId, data) => {
  try {
    const response = await instance.patch(
      `/students/${studentId}/certificates/${certificateId}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create student directly by admin
export const createStudentByAdmin = async (studentData, photoFile, signFile) => {
  try {
    const formData = new FormData();
    
    // Append all student data fields
    Object.keys(studentData).forEach((key) => {
      if (studentData[key] !== undefined && studentData[key] !== null && studentData[key] !== "") {
        formData.append(key, studentData[key]);
      }
    });

    // Append files if provided
    if (photoFile) {
      formData.append("photo", photoFile);
    }
    if (signFile) {
      formData.append("sign", signFile);
    }

    const response = await instance.post("/students/create-by-admin", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Backward compatibility

export const generateIdCards = async (studentIds) => {
  try {
    const response = await instance.post(
      "/students/generate-id-cards",
      { studentIds },
      {
        responseType: "blob",
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error generating ID cards:", error);
    throw error;
  }
};

export const startIdCardJob = async (studentIds) => {
  try {
    const response = await instance.post("/students/generate-id-cards", {
      studentIds,
    });
    return response.data;
  } catch (error) {
    console.error("Error starting ID card job:", error);
    throw error;
  }
};

export const getIdCardJobStatus = async (jobId) => {
  try {
    const response = await instance.get(
      `/students/generate-id-cards/status/${jobId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error getting job status:", error);
    throw error;
  }
};

export const cancelIdCardJob = async (jobId) => {
  try {
    const response = await instance.delete(
      `/students/generate-id-cards/cancel/${jobId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error canceling ID card job:", error);
    throw error;
  }
};

export const downloadIdCardZip = async (jobId) => {
  try {
    const response = await instance.get(
      `/students/generate-id-cards/download/${jobId}`,
      { responseType: "blob" },
    );
    const blob = new Blob([response.data], { type: "application/zip" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const disposition = response.headers["content-disposition"] || "";
    const match = disposition.match(/filename="?([^"]+)"?/i);
    link.download = match ? match[1] : `id-cards-${jobId}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading ID card zip:", error);
    throw error;
  }
};

export const getStudentApplication = async (id) => {
  try {
    const response = await instance.get(`/form/get-single-application/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// update student marks

export const updateStudentMarksViaAdmin = async (marksData) => {
  try {
    const response = await instance.post(
      "/students/update-student-marks",
      marksData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating student marks:",
      error.response || error.message,
    );
    throw error;
  }
};

// add timetable to batch
export const addTimetableToBatchViaAdmin = async (id, timetableData) => {
  try {
    const response = await instance.put(
      `/batch/add-timetable-to-batch/${id}`, // PUT request as it's updating existing data
      { timetable: timetableData }, // Wrap timetableData inside a 'timetable' key
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`, // Use template literals for cleaner token insertion
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error adding timetable to batch:", error);
    throw error;
  }
};

export const fetchTimetableOfBatchViaAdmin = async (batchId) => {
  try {
    const response = await instance.get(
      `/batch/get-timetable-of-batch/${batchId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`, // Token for authentication
        },
      },
    );

    return response.data.timetable;
  } catch (error) {
    console.error("Error fetching timetable for batch:", error);
    throw error;
  }
};

// fetch all events
export const fetchAllEventsViaAdmin = async () => {
  try {
    const response = await instance.get("/events/get-all-events", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// create event
export const createEventViaAdmin = async (eventData) => {
  try {
    const response = await instance.post(
      "/events/create-new-event",
      eventData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// send mail
export const sendMailViaAdmin = async ({
  subject,
  message,
  recipientEmails,
}) => {
  try {
    const response = await instance.post(
      "/sendmail",
      { subject, message, recipientEmails },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// add feedback question
export const addQuestionViaAdmin = async ({ question, feedbackType }) => {
  try {
    const response = await instance.post(
      "/feedback/add-question",
      { question, feedbackType },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// remove feedback question
export const removeQuestionViaAdmin = async ({ question, feedbackType }) => {
  try {
    const response = await instance.put(
      "/feedback/remove-question",
      { question, feedbackType },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// get all feedback questions
export const getAllFacultyFeedbackQuestionsViaAdmin = async () => {
  try {
    const response = await instance.get("/feedback/get-faculty-questions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// get all feedback questions
export const getAllSubjectFeedbackQuestionsViaAdmin = async () => {
  try {
    const response = await instance.get("/feedback/get-subject-questions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// mark attendance via admin
export const markAttendanceViaAdmin = async ({
  batch,
  subjectId,
  date,
  attendance,
}) => {
  try {
    const response = await instance.post(
      "/attendance/mark-attendance",
      { batch, subjectId, date, attendance },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// fetch attendance via admin
export const fetchAttendanceViaAdmin = async ({ batchId, date, subjectId }) => {
  try {
    const response = await instance.get("/attendance/fetch-attendance", {
      params: { batchId, date, subjectId },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// assignments
export const createAssignment = async (data) => {
  try {
    console.log(data);
    const response = await instance.post("/assignments/create", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeAssignment = async (id) => {
  try {
    const response = await instance.delete(`/assignments/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchAssignmentsOfFaculty = async (id) => {
  try {
    const response = await instance.get(`/assignments/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchAssignmentsBySubject = async (subjectId, facultyId, batchId = null) => {
  try {
    // Use batch-specific route if batchId provided for proper isolation
    const url = batchId
      ? `/assignments/subject/${subjectId}/${facultyId}/${batchId}`
      : `/assignments/subject/${subjectId}/${facultyId}`;
    const response = await instance.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchStudentAssignments = async (batchId, subjectIds) => {
  try {
    const response = await instance.post(`/assignments/studentAssignments`, {
      batchId,
      subjectIds,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const submitAssignment = async (data) => {
  try {
    const response = await instance.post("/assignments/submit", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAssignmentSubmissions = async (assignmentId) => {
  try {
    const response = await instance.get(
      `/assignments/submissions/${assignmentId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStudentSubmissionStatus = async (assignmentId, studentId) => {
  try {
    const response = await instance.get(
      `/assignments/submission-status/${assignmentId}/${studentId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteSubmission = async (assignmentId, studentId) => {
  try {
    const response = await instance.delete(
      `/assignments/delete-submission/${assignmentId}/${studentId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchAssignmentsOfBatch = async (batchId) => {
  try {
    const response = await instance.get(
      `/assignments/batchAssignments/${batchId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// report card
export const getReportCard = async (studentId) => {
  try {
    const response = await instance.get(`/reportCard/${studentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCertificateStatus = async (
  applicationId,
  certificateId,
  updateData,
) => {
  try {
    const response = await instance.put(
      `/form/verify-certificate/${applicationId}/${certificateId}`,
      updateData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const rejectApplicationViaAdmin = async (id, data) => {
  try {
    console.log(id, data);
    const response = await instance.post(
      `/form/reject-application/${id}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadStudentDataViaAdmin = async (data) => {
  try {
    const response = await instance.post(`/students/upload-excel`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadFacultyDataViaAdmin = async (data) => {
  try {
    const response = await instance.post(`/faculty/upload-excel`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadSubjectDataViaAdmin = async (data) => {
  try {
    const response = await instance.post(`/subject/upload-excel`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fee Management APIs
export const getStudentFeeData = async (academicYear) => {
  try {
    const response = await instance.get(`/fees/student/${academicYear}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("studentToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStudentApplicationFee = async () => {
  try {
    const response = await instance.get("/fees/student/application-fee", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("studentToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createApplicationFeeCheckoutStudent = async (paymentData) => {
  try {
    const response = await instance.post(
      "/payments/student/application-fee/create-checkout",
      paymentData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("studentToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createStudentFeeCheckout = async (paymentData) => {
  try {
    const response = await instance.post(
      "/payments/student-fee/create-checkout",
      paymentData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("studentToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStudentReceipts = async (academicYear) => {
  try {
    const response = await instance.get(
      `/receipts/student?academicYear=${academicYear}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("studentToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllReceipts = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.batch) params.append("batch", filters.batch);
    if (filters.academicYear)
      params.append("academicYear", filters.academicYear);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const response = await instance.get(`/receipts/all?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadReceiptsExcel = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.batch) params.append("batch", filters.batch);
    if (filters.academicYear)
      params.append("academicYear", filters.academicYear);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.receiptType) params.append("receiptType", filters.receiptType);

    const response = await instance.get(
      `/receipts/unified/download-excel?${params.toString()}`,
      {
        responseType: "blob",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPendingPayments = async (filters = {}, page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.batch) params.append("batch", filters.batch);
    if (filters.academicYear)
      params.append("academicYear", filters.academicYear);
    if (filters.paymentStatus)
      params.append("paymentStatus", filters.paymentStatus);
    params.append("page", page);
    params.append("limit", limit);

    const response = await instance.get(
      `/receipts/pending-payments?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadPendingPaymentsExcel = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.batch) params.append("batch", filters.batch);
    if (filters.academicYear)
      params.append("academicYear", filters.academicYear);
    if (filters.paymentStatus)
      params.append("paymentStatus", filters.paymentStatus);

    const response = await instance.get(
      `/receipts/download-pending-payments?${params.toString()}`,
      {
        responseType: "blob",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Manual Payment APIs
export const recordManualPayment = async (paymentData) => {
  try {
    const response = await instance.post("/receipts/manual-payment", paymentData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const reverseManualPayment = async (paymentId, reason) => {
  try {
    const response = await instance.post(
      `/receipts/manual-payment/${paymentId}/reverse`,
      { reason },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStudentFeeDetails = async (studentId, academicYear = null) => {
  try {
    const params = new URLSearchParams();
    if (academicYear) params.append("academicYear", academicYear);
    
    const response = await instance.get(
      `/receipts/student-fee-details/${studentId}?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getManualPayments = async (filters = {}, page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.academicYear) params.append("academicYear", filters.academicYear);
    if (filters.batch) params.append("batch", filters.batch);
    if (filters.includeReversed) params.append("includeReversed", "true");
    params.append("page", page);
    params.append("limit", limit);

    const response = await instance.get(
      `/receipts/manual-payments?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin Fee Management APIs
export const createFeeStructure = async (feeData) => {
  try {
    const response = await instance.post("/fees/structure", feeData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllFeeStructures = async () => {
  try {
    const response = await instance.get("/fees/structures", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const controlPaymentAcceptance = async (feeStructureId, controlData) => {
  try {
    const response = await instance.put(
      `/fees/control/${feeStructureId}`,
      controlData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateFeeStructure = async (feeStructureId, feeData) => {
  try {
    const response = await instance.put(
      `/fees/structure/${feeStructureId}`,
      feeData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createRubricsSubjectViaAdmin = async (data) => {
  try {
    const response = await instance.post(
      "/rubrics-subjects/create-new-rubrics-subject",
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error creating rubrics subject:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getAllRubricsSubjectsViaAdmin = async () => {
  try {
    const response = await instance.get(
      "/rubrics-subjects/get-all-rubrics-subjects",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching rubrics subjects:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getRubricsSubjectByIdViaAdmin = async (id) => {
  try {
    const response = await instance.get(
      `/rubrics-subjects/get-rubrics-subject/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching rubrics subject:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const uploadStudentAttendance = async (records) => {
  return await instance.post("/attendance/student/upload", { records });
};

export const fetchStudentAttendance = async () => {
  return await instance.get("/attendance/student/all");
};

export const clearStudentAttendance = async () => {
  return await instance.delete("/attendance/student/clear");
};

// GroupbyStudents API functions
export const createGroupViaAdmin = async (groupData) => {
  try {
    console.log("Sending group data to API:", groupData);
    const adminToken = localStorage.getItem("adminToken");
    console.log("Admin token exists:", !!adminToken);
    console.log(
      "Admin token:",
      adminToken ? adminToken.substring(0, 20) + "..." : "null",
    );

    const response = await instance.post("/groupby-students", groupData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + adminToken,
      },
    });
    console.log("API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("API error details:", error.response?.data || error.message);
    throw error;
  }
};

export const getGroupsBySubjectViaAdmin = async (subjectId) => {
  try {
    const response = await instance.get(
      `/groupby-students/subject/${subjectId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllGroupsViaAdmin = async (token) => {
  try {
    const authToken = token || localStorage.getItem("adminToken");
    if (!authToken) {
      throw new Error("No admin or faculty token found");
    }
    const response = await instance.get("/groupby-students", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + authToken,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateGroupViaAdmin = async (groupId, groupData) => {
  try {
    const response = await instance.put(
      `/groupby-students/${groupId}`,
      groupData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteGroupViaAdmin = async (groupId) => {
  try {
    const response = await instance.delete(`/groupby-students/${groupId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStudentsForRandomSelectionViaAdmin = async () => {
  try {
    const response = await instance.get("/groupby-students/students/random", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadApplicationsExcel = async (filters) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await instance.get(`/form/download-excel?${queryParams}`, {
      responseType: "blob", // Important for file downloads
      headers: {
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Backward compatibility

export const getAllBatchesAPI = () => instance.get("/batch/get-all-batches");
export const getSubjectsByBatchAPI = (batchId) =>
  instance.get(`/batch/get-all-subjects-of-batch/${batchId}`);
export const getStudentsByBatchAPI = (batchId) =>
  instance.get(`/students/batch/${batchId}`);
export const updateStudentMarksAPI = (data) =>
  instance.post("/students/update-student-marks", data);

export const calculateSgpaAPI = (studentId) =>
  instance.get(`/reportCard/sgpa/${studentId}`);
export const getMyMarksAPI = () => instance.get("/students/my-marks");

// Student profile & elective selection
export const getMyProfileAPI = () => instance.get("/students/my-profile");
export const getMyElectivesAPI = () => instance.get("/students/my-electives");
export const submitElectiveSelectionAPI = (subjectIds) =>
  instance.post("/students/my-electives", { subjectIds });

// Profile update requests (student side)
export const getMyProfileRequestsAPI = () =>
  instance.get("/profile-requests/student/pending");
export const submitProfileRequestAPI = (requestId, value) =>
  instance.post(`/profile-requests/student/${requestId}/submit`, { value });

// Profile update requests (admin side)
const adminHeaders = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + localStorage.getItem("adminToken"),
  },
});
export const createProfileRequestAdmin = (data) =>
  instance.post("/profile-requests", data, adminHeaders());
export const getAllProfileRequestsAdmin = () =>
  instance.get("/profile-requests", adminHeaders());
export const getProfileRequestByIdAdmin = (id) =>
  instance.get(`/profile-requests/${id}`, adminHeaders());
export const updateProfileRequestAdmin = (id, data) =>
  instance.patch(`/profile-requests/${id}`, data, adminHeaders());

// Notes API
export const uploadNote = async (formData) => {
  const response = await instance.post(`/notes/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getFacultyNotes = async () => {
  const response = await instance.get(`/notes/faculty`);
  return response.data;
};

export const getNotes = async (batchId, subjectId) => {
  const response = await instance.get(`/notes/${batchId}/${subjectId}`);
  return response.data;
};

export const deleteNote = async (id) => {
  const response = await instance.delete(`/notes/${id}`);
  return response.data;
};

export const getFacultyDetails = async () => {
  const response = await instance.get(`/faculty/my-details`);
  return response.data;
};

export const getFacultySubjectsByBatch = async (batchId) => {
  const response = await instance.get(`/faculty/batch/${batchId}/subjects`);
  return response.data;
};

export const getStudentNotes = async () => {
  const response = await instance.get(`/students/my-notes`);
  return response.data;
};

export const getStudentsBySubject = async (subjectId, batchId = null) => {
  const url = batchId
    ? `/students/subjects/${subjectId}?batchId=${batchId}`
    : `/students/subjects/${subjectId}`;
  return await instance.get(url);
};

export const downloadMarksTemplate = async (subjectId, batchId = null) => {
  const url = batchId
    ? `/students/subjects/${subjectId}/marks-template?batchId=${batchId}`
    : `/students/subjects/${subjectId}/marks-template`;
  const response = await instance.get(url, {
    responseType: "blob",
  });
  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url2 = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url2;
  a.download = `marks-template-${subjectId}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url2);
  return response;
};

export const uploadMarks = async (subjectId, formData, batchId = null) => {
  const url = batchId
    ? `/students/subjects/${subjectId}/upload-marks?batchId=${batchId}`
    : `/students/subjects/${subjectId}/upload-marks`;
  return await instance.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateStudentDetailsViaAdmin = async (id, data) => {
  try {
    const response = await instance.patch(
      `/students/update-student/${id}`,
      data,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateStudentPhotoAndSignViaAdmin = async (id, data) => {
  try {
    const response = await instance.post(
      `/students/update-photo-sign/${id}`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetStudentPasswordViaAdmin = async (
  id,
  email = null,
  type = "reset",
) => {
  try {
    const response = await instance.post(`/students/reset-password/${id}`, {
      email,
      type,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

//----------------------- INSTALLMENT SETTINGS API -----------------------
export const getAllInstallmentSettingsViaAdmin = async () => {
  try {
    const response = await instance.get(
      "/payments/get-all-installment-settings",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSingleInstallmentSettingViaAdmin = async (userData) => {
  try {
    const response = await instance.get(
      `/payments/get-installment-setting/${userData.id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createInstallmentSettingViaAdmin = async (userData) => {
  try {
    const response = await instance.post(
      "/payments/create-installment-setting",
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const UpdateInstallmentSettingViaAdmin = async (userData) => {
  try {
    const response = await instance.put(
      `/payments/update-installment-setting/${userData.id}`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteInstallmentSettingViaAdmin = async (userData) => {
  try {
    const response = await instance.delete(
      `/payments/delete-installment-setting/${userData.id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const toggleInstallmentSettingViaAdmin = async (userData) => {
  try {
    const response = await instance.patch(
      `/payments/toggle-installment-setting/${userData.id}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getInstallmentOptionsForProgram = async (
  programId,
  paymentType = "application",
) => {
  try {
    const response = await instance.get(
      `/payments/installment-options/${programId}/${paymentType}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ---------------- ATKT PAYMENT / RECEIPT APIS ----------------
export const getAllAtktPaymentsViaAdmin = async () => {
  try {
    const response = await instance.get(`/receipts/atkt/payments`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAtktReceipt = async (atktFormId) => {
  try {
   
    const response = await instance.get(
      `/receipts/atkt/receipt/${atktFormId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer " +
            (localStorage.getItem("studentToken") ||
              localStorage.getItem("adminToken")),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ---------------- UNIFIED RECEIPT APIS ----------------
export const getUnifiedReceipts = async (filters = {}, page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    params.append("page", page);
    params.append("limit", limit);
    const response = await instance.get(
      `/receipts/unified?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUnifiedReceiptById = async (receiptId) => {
  try {
    const response = await instance.get(`/receipts/unified/${receiptId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadReceiptPDF = async (
  receiptId,
  receiptIds = null,
  format = "modern",
) => {
  try {
    if (receiptIds && receiptIds.length > 0) {
      const response = await instance.post(
        `/receipts/unified/download-bulk`,
        { receiptIds, format },
        {
          headers: {
            "Content-Type": "application/json",
          },
          responseType: "blob",
        },
      );
      return response.data;
    } else {
      const response = await instance.get(
        `/receipts/unified/${receiptId}/download`,
        {
          params: { format },
          responseType: "blob",
        },
      );
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

// ==================== REGULAR EXAM APIS ====================

// Session Management
export const getRegularExamSessionsAPI = async (filters = {}) => {
  try {
    const response = await instance.get("/regular-exams/sessions", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createRegularExamSessionAPI = async (sessionData) => {
  try {
    const response = await instance.post(
      "/regular-exams/sessions",
      sessionData,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateRegularExamSessionAPI = async (sessionId, updates) => {
  try {
    const response = await instance.put(
      `/regular-exams/sessions/${sessionId}`,
      updates,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const activateRegularExamSessionAPI = async (sessionId) => {
  try {
    const response = await instance.put(
      `/regular-exams/sessions/${sessionId}/activate`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deactivateRegularExamSessionAPI = async (sessionId) => {
  try {
    const response = await instance.put(
      `/regular-exams/sessions/${sessionId}/deactivate`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const closeRegularExamSessionAPI = async (sessionId) => {
  try {
    const response = await instance.put(
      `/regular-exams/sessions/${sessionId}/close`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteRegularExamSessionAPI = async (sessionId) => {
  try {
    const response = await instance.delete(
      `/regular-exams/sessions/${sessionId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getActiveRegularExamSessionAPI = async () => {
  try {
    const response = await instance.get("/regular-exams/sessions/active");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Subject Configuration
export const getRegularExamSubjectConfigsAPI = async (sessionId) => {
  try {
    const response = await instance.get("/regular-exams/subject-configs", {
      params: { examSessionId: sessionId },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createRegularExamSubjectConfigAPI = async (configData) => {
  try {
    const response = await instance.post(
      "/regular-exams/subject-configs",
      configData,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateRegularExamSubjectConfigAPI = async (configId, updates) => {
  try {
    const response = await instance.put(
      `/regular-exams/subject-configs/${configId}`,
      updates,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteRegularExamSubjectConfigAPI = async (configId) => {
  try {
    const response = await instance.delete(
      `/regular-exams/subject-configs/${configId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const bulkCreateRegularExamSubjectConfigsAPI = async (data) => {
  try {
    const response = await instance.post(
      "/regular-exams/subject-configs/bulk",
      data,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Enrollment Management
export const autoEnrollRegularExamStudentsAPI = async (sessionId) => {
  try {
    const response = await instance.post(
      `/regular-exams/sessions/${sessionId}/auto-enroll`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeInactiveRegularExamEnrollmentsAPI = async (sessionId) => {
  try {
    const response = await instance.delete(
      `/regular-exams/sessions/${sessionId}/remove-inactive`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const refreshRegularExamEnrollmentSubjectsAPI = async (sessionId) => {
  try {
    const response = await instance.put(
      `/regular-exams/sessions/${sessionId}/refresh-subjects`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Sync Enrollments (unified job)
export const startSyncRegularExamEnrollmentsAPI = async (sessionId) => {
  try {
    const response = await instance.post(
      `/regular-exams/sessions/${sessionId}/sync-enrollments`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSyncRegularExamEnrollmentsStatusAPI = async (jobId) => {
  try {
    const response = await instance.get(
      `/regular-exams/sync-enrollments/status/${jobId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRegularExamEnrollmentsAPI = async (filters = {}) => {
  try {
    const response = await instance.get("/regular-exams/enrollments", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMyRegularExamEnrollmentAPI = async () => {
  try {
    const response = await instance.get(
      "/regular-exams/enrollments/my-enrollment",
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRegularExamBatchNamesAPI = async (sessionId) => {
  try {
    const response = await instance.get(
      "/regular-exams/enrollments/batch-names",
      {
        params: { examSessionId: sessionId },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAvailableBatchesAPI = async (filters = {}) => {
  try {
    const response = await instance.get("/regular-exams/batches/available", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadRegularExamHallTicketAPI = async (enrollmentId) => {
  try {
    const response = await instance.get(
      `/regular-exams/enrollments/${enrollmentId}/hall-ticket`,
      {
        responseType: "blob",
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const bulkDownloadRegularExamHallTicketsAPI = async (filters = {}) => {
  try {
    const response = await instance.get(
      "/regular-exams/enrollments/bulk-download-hall-tickets",
      {
        params: filters,
        responseType: "blob",
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadRegularExamEnrollmentsExcelAPI = async (filters = {}) => {
  try {
    const response = await instance.get(
      "/regular-exams/enrollments/download-excel",
      {
        params: filters,
        responseType: "blob",
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const startBulkRegularExamHallTicketJobAPI = async (filters = {}) => {
  try {
    const response = await instance.get(
      "/regular-exams/enrollments/bulk-download-hall-tickets/start",
      {
        params: filters,
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBulkRegularExamHallTicketJobStatusAPI = async (jobId) => {
  try {
    const response = await instance.get(
      `/regular-exams/enrollments/bulk-download-status/${jobId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadBulkRegularExamHallTicketResultAPI = async (jobId) => {
  try {
    const response = await instance.get(
      `/regular-exams/enrollments/bulk-download-result/${jobId}`,
      {
        responseType: "blob",
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ==================== EXAM RESULTS APIs ====================

// Get all exam sessions for marks entry
export const getExamSessionsForMarksAPI = async (filters = {}) => {
  try {
    const response = await instance.get("/exam-results/sessions", { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get filters for a session
export const getSessionFiltersAPI = async (sessionId, sessionType) => {
  try {
    const response = await instance.get(`/exam-results/sessions/${sessionId}/${sessionType}/filters`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get subjects for a session
export const getSessionSubjectsAPI = async (sessionId, sessionType, filters = {}) => {
  try {
    const response = await instance.get(`/exam-results/sessions/${sessionId}/${sessionType}/subjects`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get students for subject marks entry
export const getStudentsForSubjectMarksAPI = async (sessionId, sessionType, subjectId, filters = {}) => {
  try {
    const response = await instance.get(
      `/exam-results/sessions/${sessionId}/${sessionType}/subjects/${subjectId}/students`,
      { params: filters }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Save marks for a single student
export const saveStudentMarksAPI = async (data) => {
  try {
    const response = await instance.post("/exam-results/marks", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Bulk save marks
export const bulkSaveMarksAPI = async (data) => {
  try {
    const response = await instance.post("/exam-results/marks/bulk", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Download marks template for a subject
export const downloadSubjectMarksTemplateAPI = async (sessionId, sessionType, subjectId, filters = {}) => {
  try {
    const response = await instance.get(
      `/exam-results/sessions/${sessionId}/${sessionType}/subjects/${subjectId}/template`,
      {
        params: filters,
        responseType: "blob",
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Parse uploaded marks Excel (preview changes)
export const parseUploadedMarksAPI = async (sessionId, sessionType, subjectId, data) => {
  try {
    const response = await instance.post(
      `/exam-results/sessions/${sessionId}/${sessionType}/subjects/${subjectId}/parse-upload`,
      { data }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get session results
export const getSessionResultsAPI = async (sessionId, filters = {}) => {
  try {
    const response = await instance.get(`/exam-results/sessions/${sessionId}/results`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get student's enrolled exam sessions (for student panel)
export const getMyExamSessionsAPI = async () => {
  try {
    const response = await instance.get("/exam-results/my-sessions");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get student's published results for a session
export const getMyPublishedResultsAPI = async (sessionId, sessionType) => {
  try {
    const response = await instance.get(`/exam-results/my-results/${sessionId}`, {
      params: { sessionType },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get student result history
export const getStudentResultHistoryAPI = async (studentId, filters = {}) => {
  try {
    const response = await instance.get(`/exam-results/students/${studentId}/history`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ==================== MARK CHANGE REQUEST APIs ====================

export const createMarkChangeRequestAPI = async (data) => {
  try {
    const response = await instance.post("/mark-change-requests", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMyMarkChangeRequestsAPI = async (params) => {
  try {
    const response = await instance.get("/mark-change-requests/my-requests", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPendingMarkChangeRequestsAPI = async (params) => {
  try {
    const response = await instance.get("/mark-change-requests/pending", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const reviewMarkChangeRequestAPI = async (id, data) => {
  try {
    const response = await instance.patch(`/mark-change-requests/${id}/review`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ==================== SUBJECT LINKING APIs ====================

// Get all admin panel subjects for linking dropdown
export const getSubjectsForLinkingAPI = async () => {
  try {
    const response = await instance.get("/regular-exams/subjects-for-linking");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get subject configs with linking status
export const getSubjectConfigsForLinkingAPI = async (examSessionId) => {
  try {
    const response = await instance.get("/regular-exams/subject-configs-for-linking", {
      params: { examSessionId },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Link a single subject
export const linkSubjectAPI = async (configId, examSubjectId, subjectId) => {
  try {
    const response = await instance.put(
      `/regular-exams/subject-configs/${configId}/link-subject/${examSubjectId}`,
      { subjectId }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Bulk link subjects
export const bulkLinkSubjectsAPI = async (configId, links) => {
  try {
    const response = await instance.put(
      `/regular-exams/subject-configs/${configId}/bulk-link-subjects`,
      { links }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ATKT Subject Linking APIs
// Get ATKT subject configs with linking status
export const getAtktSubjectConfigsForLinkingAPI = async (examSessionId) => {
  try {
    const response = await instance.get("/atkt-admin/subject-configs-for-linking", {
      params: { examSessionId },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Link a single ATKT subject
export const linkAtktSubjectAPI = async (configId, examSubjectId, subjectId) => {
  try {
    const response = await instance.put(
      `/atkt-admin/subject-configs/${configId}/link-subject/${examSubjectId}`,
      { subjectId }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Bulk link ATKT subjects
export const bulkLinkAtktSubjectsAPI = async (configId, links) => {
  try {
    const response = await instance.put(
      `/atkt-admin/subject-configs/${configId}/bulk-link-subjects`,
      { links }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ==================== ARCHIVED STUDENTS APIs ====================

// Get all archived students with pagination and filters
export const getArchivedStudentsViaAdmin = async (page = 1, filters = {}) => {
  try {
    const queryParams = new URLSearchParams({ page, ...filters }).toString();
    const response = await instance.get(`/students/archived?${queryParams}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get archived student by ID
export const getArchivedStudentByIdViaAdmin = async (id) => {
  try {
    const response = await instance.get(`/students/archived/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get archive statistics
export const getArchiveStatsViaAdmin = async () => {
  try {
    const response = await instance.get("/students/archived/stats", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Restore archived student back to active
export const restoreArchivedStudentViaAdmin = async (archivedStudentId, restoreStatus = "active") => {
  try {
    const response = await instance.post(
      `/students/archived/${archivedStudentId}/restore`,
      { restoreStatus },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Archive student with custom reason
export const archiveStudentWithReasonViaAdmin = async (studentId, reason, note = "") => {
  try {
    const response = await instance.post(
      `/students/archive/${studentId}`,
      { reason, note },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get archived students via examiner (read-only)
export const getArchivedStudentsViaExaminer = async (page = 1, filters = {}) => {
  try {
    const queryParams = new URLSearchParams({ page, ...filters }).toString();
    const response = await instance.get(`/students/archived?${queryParams}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("examinerToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ==================== ARCHIVED STUDENT PERMISSIONS APIs ====================

export const updateArchivedPermissionsViaAdmin = async (id, permissions) => {
  try {
    const response = await instance.patch(
      `/students/archived/${id}/permissions`,
      { permissions },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const bulkUpdateArchivedPermissionsViaAdmin = async (permissions, filter = {}) => {
  try {
    const response = await instance.patch(
      `/students/archived/bulk-permissions`,
      { permissions, ...filter },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ==================== ELECTIVE SESSION APIs ====================

export const getElectiveSessionsAPI = async (params = {}) => {
  try {
    const qs = new URLSearchParams(params).toString();
    const response = await instance.get(`/elective-sessions?${qs}`, adminHeaders());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createElectiveSessionAPI = async (data) => {
  try {
    const response = await instance.post("/elective-sessions", data, adminHeaders());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getElectiveSessionAPI = async (id) => {
  try {
    const response = await instance.get(`/elective-sessions/${encodeURIComponent(id)}`, adminHeaders());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateElectiveSessionAPI = async (id, data) => {
  try {
    const response = await instance.patch(`/elective-sessions/${encodeURIComponent(id)}`, data, adminHeaders());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteElectiveSessionAPI = async (id) => {
  try {
    const response = await instance.delete(`/elective-sessions/${encodeURIComponent(id)}`, adminHeaders());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getElectiveSessionSelectionsAPI = async (id) => {
  try {
    const response = await instance.get(`/elective-sessions/${encodeURIComponent(id)}/selections`, adminHeaders());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const exportElectiveSessionSelectionsAPI = async (id) => {
  try {
    const response = await instance.get(`/elective-sessions/${encodeURIComponent(id)}/selections/export`, {
      ...adminHeaders(),
      responseType: "blob",
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const lockElectiveSessionAPI = async (id) => {
  try {
    const response = await instance.post(`/elective-sessions/${encodeURIComponent(id)}/lock`, {}, adminHeaders());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const lockElectiveStudentAPI = async (sessionId, studentId) => {
  try {
    const response = await instance.post(
      `/elective-sessions/${encodeURIComponent(sessionId)}/lock-student/${encodeURIComponent(studentId)}`,
      {},
      adminHeaders(),
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const unlockElectiveStudentAPI = async (sessionId, studentId) => {
  try {
    const response = await instance.post(
      `/elective-sessions/${encodeURIComponent(sessionId)}/unlock-student/${encodeURIComponent(studentId)}`,
      {},
      adminHeaders(),
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// --- Revaluation / Photocopy APIs ---

export const getRevalCatalogAPI = async () => {
  try {
    const response = await instance.get("/reval/catalog");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const submitRevalApplicationAPI = async (formData) => {
  try {
    const response = await instance.post("/reval/apply", formData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMyRevalApplicationsAPI = async () => {
  try {
    const response = await instance.get("/reval/my-applications");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Reval Admin/Examiner Session Management
export const getRevalSessionsAPI = async (filters = {}) => {
  try {
    const response = await instance.get("/reval-admin/sessions", {
      params: filters,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("examinerToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createRevalSessionAPI = async (sessionData) => {
  try {
    const response = await instance.post("/reval-admin/sessions", sessionData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("examinerToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateRevalSessionAPI = async (sessionId, updates) => {
  try {
    const response = await instance.put(
      `/reval-admin/sessions/${sessionId}`,
      updates,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("examinerToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const activateRevalSessionAPI = async (sessionId) => {
  try {
    const response = await instance.put(
      `/reval-admin/sessions/${sessionId}/activate`,
      {},
      {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("examinerToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deactivateRevalSessionAPI = async (sessionId) => {
  try {
    const response = await instance.put(
      `/reval-admin/sessions/${sessionId}/deactivate`,
      {},
      {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("examinerToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const closeRevalSessionAPI = async (sessionId) => {
  try {
    const response = await instance.put(
      `/reval-admin/sessions/${sessionId}/close`,
      {},
      {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("examinerToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteRevalSessionAPI = async (sessionId) => {
  try {
    const response = await instance.delete(`/reval-admin/sessions/${sessionId}`, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("examinerToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRevalSubjectConfigsAPI = async (sessionId) => {
  try {
    const response = await instance.get("/reval-admin/subject-configs", {
      params: { sessionId },
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("examinerToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createRevalSubjectConfigAPI = async (sessionId, configData) => {
  try {
    const response = await instance.post(
      "/reval-admin/subject-configs",
      { ...configData, sessionId },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("examinerToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateRevalSubjectConfigAPI = async (configId, updates) => {
  try {
    const response = await instance.put(
      `/reval-admin/subject-configs/${configId}`,
      updates,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("examinerToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteRevalSubjectConfigAPI = async (configId) => {
  try {
    const response = await instance.delete(
      `/reval-admin/subject-configs/${configId}`,
      {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("examinerToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const bulkCreateRevalSubjectConfigsAPI = async (sessionId, configsArray) => {
  try {
    const response = await instance.post(
      "/reval-admin/subject-configs/bulk",
      { sessionId, configurations: configsArray },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("examinerToken"),
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRevalApplicationsAPI = async (sessionId, filters = {}) => {
  try {
    const response = await instance.get("/reval-admin/applications", {
      params: { sessionId, ...filters },
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("examinerToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRevalBatchGroupsAPI = async () => {
  try {
    const response = await instance.get("/reval-admin/batch-groups-with-subjects", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("examinerToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadRevalApplicationsExcelAPI = async (filters = {}) => {
  try {
    const response = await instance.get("/reval-admin/applications/download-excel", {
      params: filters,
      responseType: "blob",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("examinerToken"),
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};


//leave management

// Faculty: Apply for leave
// Faculty: Apply for leave
export const applyLeaveAPI = async (leaveData) => {
  try {
    const token = localStorage.getItem("facultyToken");
    console.log("Faculty Token:", token ? "Present" : "Missing");
    console.log("Leave Data being sent:", leaveData);
    
    const response = await instance.post("/leaves/apply", leaveData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("API Error Details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    
    // Log the full error object
    if (error.response?.data) {
      console.log("Full error response:", JSON.stringify(error.response.data, null, 2));
    }
    
    throw error;
  }
};

// Faculty: Get my leaves
export const getMyLeavesAPI = async (page = 1, limit = 10, status = "") => {
  try {
    const token = localStorage.getItem("facultyToken");
    const params = new URLSearchParams({ page, limit });
    if (status) params.append("status", status);
    
    const response = await instance.get(`/leaves/my-leaves?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Faculty: Get leave balance/stats
export const getLeaveBalanceAPI = async () => {
  try {
    // This endpoint might need to be created if not exists
    // For now, we'll calculate from my-leaves
    const response = await getMyLeavesAPI(1, 100);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin: Get all leave requests
export const getAllLeavesAdminAPI = async (filters = {}, page = 1, limit = 10) => {
  try {
    const token = localStorage.getItem("adminToken");
    const params = new URLSearchParams({ page, limit });
    
    if (filters.status) params.append("status", filters.status);
    if (filters.leaveType) params.append("leaveType", filters.leaveType);
    if (filters.fromDate) params.append("fromDate", filters.fromDate);
    if (filters.toDate) params.append("toDate", filters.toDate);
    
    const response = await instance.get(`/leaves/all?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin: Approve leave
export const approveLeaveAdminAPI = async (leaveId) => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await instance.put(`/leaves/approve/${leaveId}`, {}, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin: Reject leave
export const rejectLeaveAdminAPI = async (leaveId, rejectionReason) => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await instance.put(`/leaves/reject/${leaveId}`, { rejectionReason }, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin: Get leave statistics
export const getLeaveStatisticsAdminAPI = async () => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await instance.get("/leaves/statistics", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

//non teaching staffs
export const getAllNonTeachingStaffViaAdmin = async () => {
  try {
    const response = await instance.get('/non-teaching-staff/all', {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSingleNonTeachingStaffViaAdmin = async (data) => {
  try {
    const response = await instance.get(`/non-teaching-staff/${data.id}`, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createNonTeachingStaffViaAdmin = async (data) => {
  try {
    const response = await instance.post('/non-teaching-staff/create', data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateNonTeachingStaffViaAdmin = async (data) => {
  try {
    const response = await instance.put(`/non-teaching-staff/update/${data.id}`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteNonTeachingStaffViaAdmin = async (data) => {
  try {
    const response = await instance.delete(`/non-teaching-staff/delete/${data.id}`, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const mailNonTeachingStaffLoginDetailsViaAdmin = async (id) => {
  try {
    const response = await instance.post(`/non-teaching-staff/mail-details/${id}`, {}, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadNonTeachingStaffExcelViaAdmin = async () => {
  try {
    const response = await instance.get('/non-teaching-staff/download-excel', {
      responseType: 'blob',
      headers: {
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadNonTeachingStaffExcelViaAdmin = async (formData) => {
  try {
    const response = await instance.post('/non-teaching-staff/upload-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: "Bearer " + localStorage.getItem("adminToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllDesignationsViaAdmin = async () => {
  try {
    return {
      designations: [
        { id: "lab-assistant", name: "Lab Assistant" },
        { id: "accountant", name: "Accountant" },
        { id: "librarian", name: "Librarian" },
        { id: "office-staff", name: "Office Staff" },
        { id: "security", name: "Security" },
        { id: "cleaner", name: "Cleaner" },
        { id: "driver", name: "Driver" },
        { id: "technician", name: "Technician" },
        { id: "administrative-officer", name: "Administrative Officer" },
        { id: "finance-officer", name: "Finance Officer" },
        { id: "hr-assistant", name: "HR Assistant" },
        { id: "it-support", name: "IT Support" },
      ]
    };
  } catch (error) {
    throw error;
  }
};

export const nonTeachingStaffLoginAPI = async (userData) => {
  try {
    const response = await instance.post("/non-teaching-staff/login", userData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const nonTeachingStaffForgotPassAPI = async (userData) => {
  try {
    const response = await instance.post("/non-teaching-staff/forgot-password", userData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

instance.interceptors.request.use(
  function (config) {
    const token =
      localStorage.getItem("studentToken") ||
      localStorage.getItem("examinerToken") ||
      localStorage.getItem("adminToken") ||
      localStorage.getItem("facultyToken") ||
      localStorage.getItem("userToken") ||
      localStorage.getItem("nonTeachingStaffToken"); // ADD THIS LINE
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);
// Non-Teaching Staff: Apply for leave
export const applyNonTeachingStaffLeaveAPI = async (leaveData) => {
  try {
    const backendData = {
      leaveType: leaveData.leaveType.toUpperCase(),
      fromDate: leaveData.startDate,
      toDate: leaveData.endDate,
      reason: leaveData.reason,
      proofDocument: leaveData.proofDocument
    };
    
    const response = await instance.post("/leaves/apply", backendData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("nonTeachingStaffToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Non-Teaching Staff: Get my leaves
export const getNonTeachingStaffLeavesAPI = async (filters = {}, page = 1, limit = 10) => {
  try {
    const params = new URLSearchParams({ page, limit });
    if (filters.status) params.append("status", filters.status);
    
    const response = await instance.get(`/leaves/my-leaves?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("nonTeachingStaffToken"),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Non-Teaching Staff: Get leave statistics/dashboard stats
export const getNonTeachingStaffLeaveStatsAPI = async () => {
  try {
    const response = await getNonTeachingStaffLeavesAPI({}, 1, 100);
    const leaves = response.leaves || [];
    
    const stats = {
      total: leaves.length,
      pending: leaves.filter(l => l.status === 'PENDING').length,
      approved: leaves.filter(l => l.status === 'APPROVED').length,
      rejected: leaves.filter(l => l.status === 'REJECTED').length,
    };
    
    return { data: stats };
  } catch (error) {
    console.error("Error fetching leave stats:", error);
    return { data: { total: 0, pending: 0, approved: 0, rejected: 0 } };
  }
};

// Non-Teaching Staff: Change password
export const changeNonTeachingStaffPasswordAPI = async (passwordData) => {
  try {
    const token = localStorage.getItem("nonTeachingStaffToken");
    const response = await instance.post("/non-teaching-staff/change-password", passwordData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Non-Teaching Staff: Get profile details (if needed separately)
export const getNonTeachingStaffProfileAPI = async () => {
  try {
    const token = localStorage.getItem("nonTeachingStaffToken");
    const response = await instance.get("/non-teaching-staff/profile", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// admin: Get all non-teaching staff leave requests
export const getAllNonTeachingStaffLeavesAdminAPI = async (filters = {}, page = 1, limit = 10) => {
  try {
    const token = localStorage.getItem("adminToken");
    const params = new URLSearchParams({ page, limit });
    
    if (filters.status) params.append("status", filters.status);
    if (filters.leaveType) params.append("leaveType", filters.leaveType);
    if (filters.fromDate) params.append("fromDate", filters.fromDate);
    if (filters.toDate) params.append("toDate", filters.toDate);
    if (filters.staffId) params.append("staffId", filters.staffId);
    
    const response = await instance.get(`/leaves/non-teaching/all?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin: Approve non-teaching staff leave
export const approveNonTeachingStaffLeaveAdminAPI = async (leaveId) => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await instance.put(`/leaves/non-teaching/approve/${leaveId}`, {}, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin: Reject non-teaching staff leave
export const rejectNonTeachingStaffLeaveAdminAPI = async (leaveId, rejectionReason) => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await instance.put(`/leaves/non-teaching/reject/${leaveId}`, { rejectionReason }, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin: Get non-teaching staff leave statistics
export const getNonTeachingStaffLeaveStatisticsAdminAPI = async () => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await instance.get("/leaves/non-teaching/statistics", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadNonTeachingStaffLeavesExcelAdminAPI = async (filters = {}) => {
  try {
    const token = localStorage.getItem("adminToken");
    const params = new URLSearchParams(filters).toString();
    const response = await instance.get(`/leaves/non-teaching/download-excel?${params}`, {
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ==================== RESULT CARD APIs ====================

export const getMultiResultListAPI = async (configId) => {
  try {
    const response = await instance.get(`/results/${configId}/list`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadMultiResultLinksExcelAPI = async (configId) => {
  try {
    const response = await instance.get(`/results/${configId}/download-links`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const startMultiResultBulkJobAPI = async (configId, params = {}) => {
  try {
    const response = await instance.get(`/results/${configId}/bulk-download/start`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMultiResultBulkStatusAPI = async (jobId) => {
  try {
    const response = await instance.get(`/results/bulk-download-status/${jobId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadMultiResultBulkResultAPI = async (jobId) => {
  try {
    const response = await instance.get(`/results/bulk-download-result/${jobId}`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ==================== RESULT CONFIG MANAGEMENT APIs ====================

export const getResultConfigsAPI = async () => {
  try {
    const response = await instance.get("/result-configs");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getResultConfigAPI = async (id) => {
  try {
    const response = await instance.get(`/result-configs/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createResultConfigAPI = async (data) => {
  try {
    const response = await instance.post("/result-configs", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateResultConfigAPI = async (id, data) => {
  try {
    const response = await instance.put(`/result-configs/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const archiveResultConfigAPI = async (id) => {
  try {
    const response = await instance.delete(`/result-configs/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadResultConfigExcelAPI = async (id, formData) => {
  try {
    const response = await instance.post(`/result-configs/${id}/upload-excel`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteResultConfigExcelDataAPI = async (id) => {
  try {
    const response = await instance.delete(`/result-configs/${id}/excel-data`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const syncResultConfigFromSessionAPI = async (configId, body = {}) => {
  try {
    const response = await instance.post(`/result-configs/${configId}/sync-from-session`, body);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const compareResultConfigRollsAPI = async (configIdA, configIdB) => {
  try {
    const response = await instance.post("/result-configs/compare-rolls", { configIdA, configIdB });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadResultTemplateAPI = async (data = {}) => {
  try {
    const response = await instance.post("/result-configs/download-template", data, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const exportResultConfigExcelAPI = async (id) => {
  try {
    const response = await instance.get(`/result-configs/${id}/export-excel`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ==================== RESULT CONFIG PUBLISH/UNPUBLISH ====================

export const getResultConfigPublishStatusAPI = async (configId) => {
  const response = await instance.get(`/result-configs/${configId}/publish-status`);
  return response.data;
};

export const publishResultConfigAPI = async (configId, data = {}) => {
  const response = await instance.post(`/result-configs/${configId}/publish`, data);
  return response.data;
};

export const unpublishResultConfigAPI = async (configId) => {
  const response = await instance.post(`/result-configs/${configId}/unpublish`);
  return response.data;
};

export const toggleRestrictedAPI = async (configId, rollNos, restricted) => {
  const response = await instance.patch(`/result-configs/${configId}/toggle-restricted`, { rollNos, restricted });
  return response.data;
};

// ==================== PARSED RESULT CRUD (Table View) ====================

export const getParsedResultsAPI = async (configId) => {
  try {
    const response = await instance.get(`/result-configs/${configId}/parsed-results`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateParsedResultAPI = async (configId, resultId, data) => {
  try {
    const response = await instance.patch(`/result-configs/${configId}/parsed-results/${resultId}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addParsedResultAPI = async (configId, data) => {
  try {
    const response = await instance.post(`/result-configs/${configId}/parsed-results`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteParsedResultAPI = async (configId, resultId) => {
  try {
    const response = await instance.delete(`/result-configs/${configId}/parsed-results/${resultId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const lookupStudentByRollAPI = async (rollNo) => {
  try {
    const response = await instance.get(`/result-configs/lookup-student`, { params: { rollNo } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAuditLogAPI = async (configId, { limit = 50, skip = 0 } = {}) => {
  try {
    const response = await instance.get(`/result-configs/${configId}/audit`, { params: { limit, skip } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const revertAuditAPI = async (configId, auditId) => {
  try {
    const response = await instance.post(`/result-configs/${configId}/audit/${auditId}/revert`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllSubjectsViaExaminer = async () => {
  try {
    const response = await instance.get("/subject/get-all-subjects");
    return response.data;
  } catch (error) {
    throw error;
  }
};