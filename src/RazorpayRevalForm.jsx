import { useEffect, useRef } from "react";

const RazorpayRevalForm = ({
  order_id,
  key_id,
  user,
  callback_url,
  revalApplicationId,
  applicationType,
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
      <input type="hidden" name="notes[paymentType]" value="revaluation" />
      {revalApplicationId && (
        <input
          type="hidden"
          name="notes[revalApplicationId]"
          value={revalApplicationId}
        />
      )}
      {applicationType && (
        <input
          type="hidden"
          name="notes[applicationType]"
          value={applicationType}
        />
      )}
    </form>
  );
};

export default RazorpayRevalForm;
