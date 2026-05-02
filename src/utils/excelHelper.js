export const createExcelBlob = (data, headers, sheetName = "Sheet1") => {
  const headerRow = headers
    .map((h) => (typeof h === "string" ? h : h.label || h.key))
    .join("\t");
  const dataRows = data.map((row) => {
    return headers
      .map((h) => {
        const key = typeof h === "string" ? h : h.key;
        const value = row[key] || "";
        return typeof value === "string" && value.includes("\t")
          ? `"${value}"`
          : value;
      })
      .join("\t");
  });

  const tsvContent = [headerRow, ...dataRows].join("\n");
  return new Blob([tsvContent], { type: "text/tab-separated-values" });
};

export const downloadExcel = (data, filename, headers, sheetName) => {
  const blob = createExcelBlob(data, headers, sheetName);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const downloadBlobAsExcel = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const downloadAPIResponse = async (apiCall, filename) => {
  try {
    const response = await apiCall();
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadBlobAsExcel(blob, filename);
    return { success: true };
  } catch (error) {
    console.error("Error downloading Excel:", error);
    return { success: false, error };
  }
};
