import { useEffect, useRef } from "react";

const RazorpayStudentFeeForm = ({
  order_id,
  key_id,
  user,
  callback_url,
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

      {/* Student fee specific fields */}
      <input type="hidden" name="notes[studentId]" value={studentId} />
      <input
        type="hidden"
        name="notes[feeStructureId]"
        value={feeStructureId}
      />
      <input type="hidden" name="notes[academicYear]" value={academicYear} />
      <input type="hidden" name="notes[paymentType]" value="student_fee" />
      {/* Installment fields commented for now, enable later if needed */}
      {/**
      <input
        type="hidden"
        name="notes[installmentNumber]"
        value={installmentNumber || ""}
      />
      <input type="hidden" name="notes[isFullPayment]" value={isFullPayment} />
      */}
    </form>
  );
};

export default RazorpayStudentFeeForm;
