import React, { useEffect, useState } from "react";
import {
  getFormLists,
  getProgramByName,
  getInstallmentOptionsForProgram,
} from "../../../utils/Api";
import { NavLink } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CreateIcon from "@mui/icons-material/Create";
import DataTable from "react-data-table-component";
import HideSourceIcon from "@mui/icons-material/HideSource";
import { payFees } from "../../../utils/RazorpayCheckout";
import RazorpayHostedForm from "../../../RazorpayHostedForm";

const FormList = () => {
  const [allForms, setAllForms] = useState([]);
  const [hostedCheckoutData, setHostedCheckoutData] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [applicationFee, setApplicationFee] = useState(0);
  const [installmentOptions, setInstallmentOptions] = useState(null);
  const [loadingPaymentOptions, setLoadingPaymentOptions] = useState(false);

  useEffect(() => {
    fetchAllForms();
  }, []);

  const tableCustomStyles = {
    headRow: {
      style: {
        color: "#fff",
        backgroundColor: "#0F1015",
      },
    },
    striped: {
      default: "black",
    },
  };

  const fetchAllForms = async () => {
    try {
      const response = await getFormLists();
      console.log(response);
      setAllForms(response);
    } catch (error) {}
  };

  const handlePaymentClick = async (row) => {
    try {
      setLoadingPaymentOptions(true);
      setSelectedRow(row);
      setShowPaymentModal(true);

      // Fetch program details
      const programResponse = await getProgramByName(row.course);
      console.log("Program response:", programResponse);
      setApplicationFee(programResponse.applicationFee);

      // Fetch installment options for this program
      if (programResponse._id) {
        try {
          const installmentResponse = await getInstallmentOptionsForProgram(
            programResponse._id,
            "application",
          );
          console.log("Installment options:", installmentResponse.data);
          setInstallmentOptions(installmentResponse.data);
        } catch (installmentError) {
          console.log("No installment options available:", installmentError);
          setInstallmentOptions({ isEnabled: false, options: [] });
        }
      } else {
        console.log("No program ID found, skipping installment options");
        setInstallmentOptions({ isEnabled: false, options: [] });
      }
    } catch (error) {
      console.error("Failed to fetch program details", error);
      setInstallmentOptions({ isEnabled: false, options: [] });
    } finally {
      setLoadingPaymentOptions(false);
    }
  };

  const handlePaymentOption = (paymentType, installmentNumber = null) => {
    payFees(
      selectedRow._id,
      setHostedCheckoutData,
      paymentType,
      installmentNumber,
    );
    setShowPaymentModal(false);
  };

  const columns = [
    {
      name: "SL. No",
      selector: (row, index) => ++index,
    },
    {
      name: "Course Name",
      selector: (row) => row?.course,
      sortable: true,
    },
    {
      name: "Application Number",
      selector: (row) => row?.applicationNumber,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => row?.formStatusFromAdmin,
      sortable: true,
    },
    {
      name: "Stage",
      selector: (row) => row?.stage,
      sortable: true,
    },
    {
      name: "Pay Fees",
      cell: (row) => {
        const status = row?.paymentStatus;

        if (status === "paid") {
          return <span className="badge badge-success">Completed</span>;
        }

        if (row?.stage !== 3) {
          return <span className="badge badge-secondary">Unavailable</span>;
        }

        if (status === "partial") {
          return (
            <button
              className="btn btn-info btn-sm"
              onClick={() => handlePaymentClick(row)}
            >
              Pay Remaining
            </button>
          );
        }

        return (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handlePaymentClick(row)}
          >
            Pay Fees
          </button>
        );
      },
    },
    {
      name: "Payment Status",
      selector: (row) => {
        const status = row?.paymentStatus;
        if (status === "paid") {
          return <span className="badge badge-success">Completed</span>;
        } else if (status === "partial") {
          return <span className="badge badge-warning">Partially Paid</span>;
        } else {
          return <span className="badge badge-danger">Unpaid</span>;
        }
      },
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div style={{ display: "flex", gap: "10px" }}>
          <NavLink
            className="text-info"
            title="View"
            to={`/preview-application-form/${row._id}`}
          >
            <VisibilityIcon />
          </NavLink>

          {row?.stage !== 3 ? (
            <NavLink
              className="text-warning"
              title="Update"
              to={`/edit-application-form/${row._id}`}
            >
              <CreateIcon />
            </NavLink>
          ) : (
            <>
              <NavLink
                className="text-danger"
                title="form submited, now its disbaled."
              >
                <HideSourceIcon />{" "}
              </NavLink>
            </>
          )}

          {/* <NavLink
            className="text-success"
            title="print"
            to={`/print-form/${row._id}`}
          >
            <LocalPrintshopIcon />
          </NavLink> */}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="col-lg-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <h4 className="card-title">Application Forms</h4>
            <p className="card-description">
              Your All forms are listed here...
            </p>
            <div className="table-responsive">
              <DataTable
                columns={columns}
                data={allForms}
                pagination={true}
                customStyles={tableCustomStyles}
              />
              {hostedCheckoutData && (
                <RazorpayHostedForm
                  order_id={hostedCheckoutData.order_id}
                  key_id={hostedCheckoutData.key_id}
                  callback_url={hostedCheckoutData.callback_url}
                  user={hostedCheckoutData.user}
                  applicationId={hostedCheckoutData.applicationId}
                  installmentNumber={hostedCheckoutData.installmentNumber}
                  isFullPayment={hostedCheckoutData.isFullPayment}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ease-in-out">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedRow?.paymentStatus === "partial"
                    ? "Complete Payment"
                    : "Select Payment Option"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedRow?.paymentStatus === "partial"
                    ? "Pay your remaining installment amount"
                    : "Choose how you'd like to pay for your course"}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Loading indicator */}
              {loadingPaymentOptions && (
                <div className="text-center py-4">
                  <div
                    className="spinner-border spinner-border-sm text-primary me-2"
                    role="status"
                  >
                    <span className="sr-only">Loading...</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Loading payment options...
                  </span>
                </div>
              )}

              {/* Show course info */}
              {selectedRow && !loadingPaymentOptions && (
                <div className="bg-gray-50 border rounded-lg p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {selectedRow.course}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Application #{selectedRow.applicationNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-700">
                        Status:
                        <span
                          className={`ms-1 ${
                            selectedRow.paymentStatus === "paid"
                              ? "text-success"
                              : selectedRow.paymentStatus === "partial"
                                ? "text-warning"
                                : "text-danger"
                          }`}
                        >
                          {selectedRow.paymentStatus || "unpaid"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Full Payment Option - Only show if not partial */}
              {!loadingPaymentOptions &&
                selectedRow?.paymentStatus !== "partial" && (
                  <div
                    onClick={() => handlePaymentOption("full")}
                    className="relative group cursor-pointer"
                  >
                    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-400 hover:shadow-md transition-all duration-200 group-hover:bg-green-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              Pay Full Amount
                            </h4>
                            <p className="text-sm text-gray-600">
                              Complete payment in one go
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-green-600">
                            ₹{applicationFee}
                          </span>
                          <div className="text-xs text-green-600 font-medium">
                            Best Value
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        ✓ No additional fees • ✓ Immediate access
                      </div>
                    </div>
                  </div>
                )}

              {/* Dynamic Installment Payment Options */}
              {!loadingPaymentOptions &&
                installmentOptions?.isEnabled &&
                installmentOptions?.options?.length > 0 && (
                  <div className="space-y-3">
                    {installmentOptions.options.map((plan) => {
                      // Filter installments based on payment status
                      const availableInstallments =
                        selectedRow?.paymentStatus === "partial"
                          ? plan.breakdown.filter(
                              (installment) =>
                                installment.installmentNumber > 1,
                            ) // Show remaining installments
                          : plan.breakdown.filter(
                              (installment) =>
                                installment.installmentNumber === 1,
                            ); // Show first installment only

                      return (
                        <div key={plan.planId}>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            {selectedRow?.paymentStatus === "partial"
                              ? "Remaining Payment"
                              : plan.name}
                          </h5>
                          {availableInstallments.map((installment) => (
                            <div
                              key={installment.installmentNumber}
                              onClick={() =>
                                handlePaymentOption(
                                  "installment",
                                  installment.installmentNumber,
                                )
                              }
                              className="relative group cursor-pointer mb-2"
                            >
                              <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all duration-200 group-hover:bg-blue-50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <div>
                                      <h4 className="font-medium text-gray-900">
                                        {selectedRow?.paymentStatus ===
                                        "partial"
                                          ? `Final Payment (${installment.percentage}%)`
                                          : installment.description}
                                      </h4>
                                      <p className="text-sm text-gray-600">
                                        {selectedRow?.paymentStatus ===
                                        "partial"
                                          ? "Complete your remaining payment"
                                          : installment.installmentNumber === 1
                                            ? (() => {
                                                const nextInstallment =
                                                  plan.breakdown.find(
                                                    (b) =>
                                                      b.installmentNumber === 2,
                                                  );
                                                return nextInstallment
                                                  ? `Pay ${installment.percentage}% now, rest in ${nextInstallment.dueAfterDays} days`
                                                  : `Pay ${installment.percentage}% now`;
                                              })()
                                            : `${installment.percentage}% - Due in ${installment.dueAfterDays} days`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-2xl font-bold text-blue-600">
                                      ₹{installment.amount}
                                    </span>
                                    <div className="text-xs text-blue-600 font-medium">
                                      {selectedRow?.paymentStatus === "partial"
                                        ? "Pay Now"
                                        : "First Payment"}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3 text-xs text-gray-500">
                                  ✓ Flexible payment • ✓{" "}
                                  {selectedRow?.paymentStatus === "partial"
                                    ? "Final installment"
                                    : `Installment ${installment.installmentNumber} of ${plan.numberOfInstallments}`}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* Show message if installments not available */}
              {!loadingPaymentOptions &&
                installmentOptions &&
                !installmentOptions.isEnabled && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                      <i className="fas fa-info-circle me-1"></i>
                      Installment payments are not available for this course
                    </p>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="text-xs text-gray-500">
                🔒 Secure payment powered by Razorpay
                {installmentOptions?.isEnabled && (
                  <div className="mt-1">
                    💡 Installment plans configured by admin
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormList;
