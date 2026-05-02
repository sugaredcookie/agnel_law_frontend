import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import PanelDashboardLayout from "./PanelDashboardLayout";
import {
  getAllFeeStructures,
  getPendingPayments,
  getUnifiedReceipts,
} from "../../utils/Api";

const FeeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStructures: 0,
    activeStructures: 0,
    totalCollected: 0,
    totalPending: 0,
    totalReceipts: 0,
    pendingStudents: 0,
    overdueStudents: 0,
  });
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [pendingHighlight, setPendingHighlight] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [structuresRes, pendingRes, receiptsRes] = await Promise.all([
        getAllFeeStructures().catch(() => ({ data: [] })),
        getPendingPayments({}).catch(() => ({ data: [] })),
        getUnifiedReceipts({ receiptType: "" }).catch(() => ({ data: [] })),
      ]);

      const structures = structuresRes.data || [];
      const pending = pendingRes.data || [];
      const receipts = receiptsRes.data || [];

      const activeCount = structures.filter(
        (s) => s.paymentAcceptance?.isAcceptingPayments
      ).length;

      const totalCollected = receipts.reduce(
        (sum, r) => sum + (r.paymentSummary?.amountPaid || 0),
        0
      );

      const totalPendingAmount = pending.reduce(
        (sum, p) => sum + (p.remainingAmount || 0),
        0
      );

      const overdueCount = pending.filter((p) => p.isOverdue).length;

      setStats({
        totalStructures: structures.length,
        activeStructures: activeCount,
        totalCollected,
        totalPending: totalPendingAmount,
        totalReceipts: receipts.length,
        pendingStudents: pending.length,
        overdueStudents: overdueCount,
      });

      setRecentReceipts(receipts.slice(0, 5));
      setPendingHighlight(pending.filter((p) => p.isOverdue).slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <PanelDashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PanelDashboardLayout>
    );
  }

  return (
    <PanelDashboardLayout>
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Fee Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of fee collection and payment status
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Collected"
            value={formatCurrency(stats.totalCollected)}
            icon="mdi-cash-check"
            color="green"
            subtitle={`${stats.totalReceipts} receipts generated`}
          />
          <StatCard
            title="Pending Amount"
            value={formatCurrency(stats.totalPending)}
            icon="mdi-cash-clock"
            color="yellow"
            subtitle={`${stats.pendingStudents} students pending`}
          />
          <StatCard
            title="Active Fee Structures"
            value={stats.activeStructures}
            icon="mdi-file-document-check"
            color="blue"
            subtitle={`of ${stats.totalStructures} total structures`}
          />
          <StatCard
            title="Overdue Payments"
            value={stats.overdueStudents}
            icon="mdi-alert-circle"
            color="red"
            subtitle="Requires attention"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton
              to="/panel-admin/fee-structures"
              icon="mdi-plus-circle"
              label="Create Fee Structure"
              color="blue"
            />
            <QuickActionButton
              to="/panel-admin/payment-history"
              icon="mdi-receipt"
              label="View All Payments"
              color="green"
            />
            <QuickActionButton
              to="/panel-admin/pending-payments"
              icon="mdi-account-alert"
              label="Pending Payments"
              color="yellow"
            />
            <QuickActionButton
              to="/panel-admin/fee-structures"
              icon="mdi-cog"
              label="Fee Settings"
              color="gray"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Receipts */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Recent Payments
              </h2>
              <NavLink
                to="/panel-admin/payment-history"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All
              </NavLink>
            </div>
            <div className="p-4">
              {recentReceipts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No recent payments
                </p>
              ) : (
                <div className="space-y-3">
                  {recentReceipts.map((receipt) => (
                    <div
                      key={receipt._id}
                      className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <i className="mdi mdi-check text-green-600"></i>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">
                            {receipt.studentDetails?.name || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {receipt.receiptNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600 text-sm">
                          {formatCurrency(receipt.paymentSummary?.amountPaid || 0)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {receipt.paymentDetails?.paymentDate
                            ? new Date(
                                receipt.paymentDetails.paymentDate
                              ).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Overdue Payments */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Overdue Payments
              </h2>
              <NavLink
                to="/panel-admin/pending-payments"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All
              </NavLink>
            </div>
            <div className="p-4">
              {pendingHighlight.length === 0 ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <i className="mdi mdi-check-all text-green-600 text-xl"></i>
                  </div>
                  <p className="text-gray-500">No overdue payments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingHighlight.map((payment) => (
                    <div
                      key={payment._id}
                      className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <i className="mdi mdi-alert text-red-600"></i>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">
                            {payment.studentName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.batch}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600 text-sm">
                          {formatCurrency(payment.remainingAmount)}
                        </p>
                        <p className="text-xs text-red-500">Overdue</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PanelDashboardLayout>
  );
};

const StatCard = ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    green: "border-green-500 bg-green-50",
    yellow: "border-yellow-500 bg-yellow-50",
    blue: "border-blue-500 bg-blue-50",
    red: "border-red-500 bg-red-50",
  };

  const iconColors = {
    green: "text-green-600",
    yellow: "text-yellow-600",
    blue: "text-blue-600",
    red: "text-red-600",
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-5 border-l-4 ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${iconColors[color]}`}
        >
          <i className={`mdi ${icon} text-xl`}></i>
        </div>
      </div>
    </div>
  );
};

const QuickActionButton = ({ to, icon, label, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 hover:bg-blue-100 text-blue-700",
    green: "bg-green-50 hover:bg-green-100 text-green-700",
    yellow: "bg-yellow-50 hover:bg-yellow-100 text-yellow-700",
    gray: "bg-gray-50 hover:bg-gray-100 text-gray-700",
  };

  return (
    <NavLink
      to={to}
      className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${colorClasses[color]}`}
    >
      <i className={`mdi ${icon} text-2xl mb-2`}></i>
      <span className="text-sm font-medium text-center">{label}</span>
    </NavLink>
  );
};

export default FeeDashboard;
