import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange, loading }) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex justify-center items-center mt-4">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1 || loading}
        className="px-4 py-2 mx-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
      >
        Previous
      </button>
      <span className="px-4 py-2">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages || loading}
        className="px-4 py-2 mx-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
