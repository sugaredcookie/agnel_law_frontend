import { getPaymentTypesAPI } from "./Api";

// Fetched from backend -- this is just the fallback until the API responds.
let paymentTypesCache = null;
let fetchPromise = null;

const fetchPaymentTypes = () => {
  if (!fetchPromise) {
    fetchPromise = getPaymentTypesAPI()
      .then((res) => {
        if (res?.success && res.data) paymentTypesCache = res.data;
      })
      .catch(() => {});
  }
  return fetchPromise;
};

// Kick off the fetch immediately on import
fetchPaymentTypes();

export const getPaymentTypeLabel = (type) =>
  paymentTypesCache?.[type]?.label || type;

export const getPaymentTypeBadgeStyle = (type, variant = "default") => {
  const entry = paymentTypesCache?.[type];
  if (!entry) return "bg-gray-100 text-gray-700";
  return variant === "alt" ? entry.badgeStyleAlt : entry.badgeStyle;
};

export const getPaymentTypeOptions = () => {
  if (!paymentTypesCache) return [];
  return Object.entries(paymentTypesCache).map(([value, { label }]) => ({
    value,
    label,
  }));
};

// For components that need to await the data before rendering filters
export const ensurePaymentTypes = () => fetchPaymentTypes();

export default paymentTypesCache;
