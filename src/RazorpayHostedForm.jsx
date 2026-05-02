import { useEffect, useRef } from "react";

const RazorpayHostedForm = ({
  order_id,
  key_id,
  user,
  callback_url,
  applicationId,
  studentId,
  feeStructureId,
  academicYear,
  installmentNumber,
  isFullPayment,
}) => {
  const formRef = useRef();

  useEffect(() => {
    if (formRef.current) {
      formRef.current.submit();
    }
  }, []);

  return (
    <form
      ref={formRef}
      action="https://api.razorpay.com/v1/checkout/embedded"
      method="POST"
      style={{ display: "none" }}
    >
      <input type="hidden" name="key_id" value={key_id} />
      <input type="hidden" name="order_id" value={order_id} />
      <input type="hidden" name="callback_url" value={callback_url} />
      <input type="hidden" name="prefill[name]" value={user?.name || ""} />
      <input type="hidden" name="prefill[email]" value={user?.email || ""} />
      <input type="hidden" name="prefill[contact]" value={user?.mobile || ""} />

      {/* Application payment fields */}
      {applicationId && (
        <input
          type="hidden"
          name="notes[applicationId]"
          value={applicationId}
        />
      )}

      {/* Student fee payment fields */}
      {studentId && (
        <input type="hidden" name="notes[studentId]" value={studentId} />
      )}
      {feeStructureId && (
        <input
          type="hidden"
          name="notes[feeStructureId]"
          value={feeStructureId}
        />
      )}
      {academicYear && (
        <input type="hidden" name="notes[academicYear]" value={academicYear} />
      )}

      {/* Common fields */}
      <input
        type="hidden"
        name="notes[installmentNumber]"
        value={installmentNumber || ""}
      />
      <input type="hidden" name="notes[isFullPayment]" value={isFullPayment} />
      <input
        type="hidden"
        name="notes[paymentType]"
        value={studentId ? "student_fee" : "application"}
      />
    </form>
  );
};

export default RazorpayHostedForm;
