import { useEffect, useRef } from "react";

const RazorpayATKTForm = ({
  order_id,
  key_id,
  user,
  callback_url,
  atktFormId,
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

      {/* Force ATKT payment type to be recognized on callback */}
      <input type="hidden" name="notes[paymentType]" value="atkt" />
      {atktFormId && (
        <input type="hidden" name="notes[atktFormId]" value={atktFormId} />
      )}
    </form>
  );
};

export default RazorpayATKTForm;
