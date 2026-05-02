import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason") || "Payment could not be processed";

  const handleRetryPayment = () => {
    navigate("/student/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Error Animation Container */}
        <div className="relative bg-gradient-to-r from-red-500 to-rose-600 px-8 py-12 text-center">
          <div className="absolute inset-0 bg-white opacity-10"></div>
          <div className="relative z-10">
            {/* Animated Error Icon */}
            <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 animate-pulse">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Payment Failed
            </h1>
            <p className="text-red-100">We couldn't process your payment</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              {reason}
            </p>
          </div>

          {/* Error Details */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Payment Error
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Please check your payment details and try again. If the
                  problem persists, contact support.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRetryPayment}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>

        {/* Bottom Decoration */}
        <div className="h-2 bg-gradient-to-r from-red-500 to-rose-600"></div>
      </div>
    </div>
  );
};

export default PaymentFailed;
