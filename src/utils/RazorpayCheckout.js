// import { toast } from "react-toastify";
// import {
//   capturePaymentOfRazorPay,
//   createCheckoutOfRazorPay,
//   getRazorPayACCKey,
// } from "./Api";

// const paymentOptions = {
//   amount: 199,
//   currency: "INR",
//   name: "AGNEL SCHOOL OF LAW",
//   description: "Application Submission...",
//   image: "/agnel-logo.png",
//   notes: {
//     address: "AGNEL SCHOOL OF LAW, Vashi, Navi Mumbai",
//   },
//   theme: { color: "#EA3565" },
// };

// const handleCallback = async (data, id, onSuccess) => {
//   const paymentId = data?.razorpay_payment_id;
//   const orderId = data?.razorpay_order_id;
//   const signature = data?.razorpay_signature;
//   const applicationId = id;

//   const payloadObj = {
//     paymentId,
//     orderId,
//     signature,
//     applicationId,
//   };

//   try {
//     const response = await capturePaymentOfRazorPay(payloadObj);
//     toast.success("Payment Completed... ");
//     console.log(response);
//     if (onSuccess) {
//       onSuccess();
//     }
//   } catch (error) {
//     console.log(error);
//     toast.warn("Something went wrong..., Please try again.");
//   }
// };

// export const payFees = async (id, onSuccess) => {
//   try {
//     const checkoutObj = {
//       amount: paymentOptions.amount,
//       currency: paymentOptions.currency,
//       applicationNumber: id,
//     };

//     // create a checkout and get order id
//     const checkoutRes = await createCheckoutOfRazorPay(checkoutObj);

//     if (checkoutRes?.id) {
//       // get the razorpay key and user details
//       const keyData = await getRazorPayACCKey();

//       if (keyData?.key) {
//         // create a option object
//         const options = {
//           key: keyData?.key,
//           amount: paymentOptions.amount * 100, // amount in paise
//           currency: paymentOptions.currency,
//           name: paymentOptions.name,
//           description: paymentOptions.description,
//           image: paymentOptions.image,
//           order_id: checkoutRes?.id,
//           handler: (response) => handleCallback(response, id, onSuccess),
//           prefill: {
//             name: keyData?.userDetails?.name,
//             email: keyData?.userDetails?.email,
//             contact: keyData?.userDetails?.mobile,
//           },
//           notes: {
//             address: paymentOptions.notes.address,
//             applicationId: id,
//           },
//           theme: {
//             color: paymentOptions.theme.color,
//           },
//         };

//         // initilize the razorpay payment
//         if (typeof window.Razorpay === "undefined") {
//           toast.error("Razorpay SDK not loaded. Please refresh and try again.");
//           return;
//         }
//         const razorPay = new window.Razorpay(options);
//         // call the open method
//         razorPay.open();

//         // handle the errors
//         razorPay.on("payment.failed", function (response) {
//           console.log(response.error);
//           toast.warn("Payment Failed..., Please try again.");
//         });
//       }
//     }
//   } catch (error) {
//     console.log(error);
//     toast.warn("Payment Failed..., Please try again.");
//   }
// };

import {
  createCheckoutOfRazorPay,
  getRazorPayACCKey,
  createStudentFeeCheckout,
  getRazorPayACCKeyStudent,
  createApplicationFeeCheckoutStudent,
} from "./Api";

export const payFees = async (
  id,
  setHostedCheckoutData,
  type = "full",
  installmentNumber = null,
) => {
  try {
    const checkoutObj = {
      currency: "INR",
      applicationNumber: id,
      installmentNumber,
      isFullPayment: type === "full",
    };

    // Backend will calculate the amount based on installmentNumber and isFullPayment
    const order = await createCheckoutOfRazorPay(checkoutObj);
    const keyData = await getRazorPayACCKey();

    if (order?.id && keyData?.key) {
      setHostedCheckoutData({
        key_id: keyData.key,
        order_id: order.id,
        callback_url: `https://lms.raphaedu.com/backend/api/payments/verify-hosted-payment`,
        // callback_url: `http://localhost:8000/api/payments/verify-hosted-payment`,
        user: keyData.userDetails,
        applicationId: id,
        installmentNumber,
        isFullPayment: type === "full",
      });
    }
  } catch (error) {
    console.error("Hosted Checkout Setup Failed:", error);
  }
};

export const payStudentFees = async (
  feeStructureId,
  academicYear,
  setHostedCheckoutData,
  type = "full",
  installmentNumber = null,
) => {
  try {
    const checkoutObj = {
      feeStructureId,
      academicYear,
      installmentNumber,
      isFullPayment: type === "full",
    };

    // Create student fee checkout
    const response = await createStudentFeeCheckout(checkoutObj);
    console.log("Student Fee Checkout Response:", response);
    if (response.success) {
      const keyData = await getRazorPayACCKeyStudent();

      if (response.order?.id && keyData?.key) {
        setHostedCheckoutData({
          key_id: keyData.key,
          order_id: response.order.id,
          callback_url: `https://lms.raphaedu.com/backend/api/payments/verify-hosted-payment`,
          // callback_url: `http://localhost:8000/api/payments/verify-hosted-payment`,
          user: keyData.userDetails,
          studentId: response.student._id,
          feeStructureId,
          academicYear,
          installmentNumber,
          isFullPayment: type === "full",
        });
      }
    }
  } catch (error) {
    console.error("Student Fee Hosted Checkout Setup Failed:", error);
    throw error;
  }
};

export const payApplicationFeeStudent = async (
  applicationId,
  setHostedCheckoutData,
  type = "full",
  installmentNumber = null,
) => {
  try {
    const checkoutObj = {
      applicationId,
      installmentNumber,
      isFullPayment: type === "full",
    };

    const response = await createApplicationFeeCheckoutStudent(checkoutObj);
    console.log("Application Fee Checkout Response:", response);
    
    if (response.success) {
      const keyData = await getRazorPayACCKeyStudent();

      if (response.order?.id && keyData?.key) {
        setHostedCheckoutData({
          key_id: keyData.key,
          order_id: response.order.id,
          callback_url: `https://lms.raphaedu.com/backend/api/payments/verify-hosted-payment`,
          // callback_url: `http://localhost:8000/api/payments/verify-hosted-payment`,
          user: keyData.userDetails,
          applicationId,
          installmentNumber,
          isFullPayment: type === "full",
        });
      }
    }
  } catch (error) {
    console.error("Application Fee Hosted Checkout Setup Failed:", error);
    throw error;
  }
};
