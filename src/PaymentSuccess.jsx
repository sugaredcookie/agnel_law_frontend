import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate("/student/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Success Animation Container */}
        <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center">
          <div className="absolute inset-0 bg-white opacity-10"></div>
          <div className="relative z-10">
            {/* Animated Success Icon */}
            <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 animate-bounce">
              <svg
                className="w-10 h-10 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Payment Successful!
            </h1>
            <p className="text-green-100">
              Your payment has been processed successfully
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Thank you for your payment
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Your application fee has been paid successfully. You will receive
              a confirmation email shortly.
            </p>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Transaction Status</span>
              <span className="font-medium text-green-600 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Completed
              </span>
            </div>
          </div>

          {/* Countdown and Action */}
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                <svg
                  className="w-4 h-4 mr-1 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Redirecting in {countdown} seconds
              </div>
            </div>

            <button
              onClick={() => navigate("/forms")}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Go to Forms Now
            </button>
          </div>
        </div>

        {/* Bottom Decoration */}
        <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600"></div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
