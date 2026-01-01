const parseExcelDate = (dateInput) => {
    if (!dateInput) return null;

    // Handle Excel Serial Number (e.g., 45678)
    const num = Number(dateInput);
    if (!isNaN(num) && num > 25569 && num < 60000) {
        // Excel base date: Dec 30, 1899
        // JavaScript base date: Jan 1, 1970
        // Difference is 25569 days
        const excelBaseDate = new Date(1899, 11, 30);
        const jsDate = new Date(excelBaseDate.getTime() + num * 86400000);
        return jsDate;
    }

    // Handle String (DD-MM-YYYY, YYYY-MM-DD, etc.)
    const str = String(dateInput).trim();

    // Try DD-MM-YYYY format (e.g., "30-07-2025" or "30/07/2025")
    const ddmmyyyyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (ddmmyyyyMatch) {
        const day = parseInt(ddmmyyyyMatch[1], 10);
        const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
        const year = parseInt(ddmmyyyyMatch[3], 10);
        return new Date(Date.UTC(year, month, day));
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

module.exports = { parseExcelDate };
