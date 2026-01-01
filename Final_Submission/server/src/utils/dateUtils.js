/**
 * Shared Date Utility Library
 * Standard format for all applications: ISO 8601 (YYYY-MM-DD) for storage
 * Display format: DD-MM-YYYY for user interfaces
 */

/**
 * Parse various date formats and return a JavaScript Date object at UTC midnight
 * Accepts: ISO 8601, DD-MM-YYYY, YYYY-MM-DD, Excel serial numbers
 * @param {string|number|Date} input - Date input in various formats
 * @returns {Date|null} - Date object at UTC midnight or null if invalid
 */
function parseDate(input) {
    if (!input) return null;

    // Already a Date object
    if (input instanceof Date) {
        return normalizeToUTCMidnight(input);
    }

    // Handle Excel Serial Number (e.g., 45868)
    const num = Number(input);
    if (!isNaN(num) && num > 25569 && num < 60000) {
        // Excel base date is Dec 30, 1899
        const excelBaseDate = new Date(1899, 11, 30);
        const jsDate = new Date(excelBaseDate.getTime() + num * 86400000);
        return normalizeToUTCMidnight(jsDate);
    }

    const str = String(input).trim();

    // Try DD-MM-YYYY format (e.g., "15-07-2025" or "15/07/2025")
    const ddmmyyyyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (ddmmyyyyMatch) {
        const day = parseInt(ddmmyyyyMatch[1], 10);
        const month = parseInt(ddmmyyyyMatch[2], 10) - 1; // 0-indexed
        const year = parseInt(ddmmyyyyMatch[3], 10);

        if (isValidDate(year, month, day)) {
            return new Date(Date.UTC(year, month, day));
        }
        return null;
    }

    // Try DD-MMM-YY format (e.g., "15-Jan-25" or "22-Jun-25")
    const ddmmmyyMatch = str.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
    if (ddmmmyyMatch) {
        const day = parseInt(ddmmmyyMatch[1], 10);
        const monthName = ddmmmyyMatch[2];
        const year = 2000 + parseInt(ddmmmyyMatch[3], 10); // Assume 20xx

        const monthMap = {
            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };

        const month = monthMap[monthName.toLowerCase()];
        if (month !== undefined && isValidDate(year, month, day)) {
            return new Date(Date.UTC(year, month, day));
        }
        return null;
    }

    // Try ISO format or other standard formats
    const date = new Date(str);
    if (isNaN(date.getTime())) {
        return null;
    }

    return normalizeToUTCMidnight(date);
}

/**
 * Normalize a Date object to UTC midnight
 * @param {Date} date - Date object
 * @returns {Date} - Date at UTC midnight
 */
function normalizeToUTCMidnight(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return null;
    }

    return new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    ));
}

/**
 * Check if year, month, day form a valid date
 * @param {number} year - Full year (e.g., 2025)
 * @param {number} month - Month (0-11)
 * @param {number} day - Day (1-31)
 * @returns {boolean} - True if valid
 */
function isValidDate(year, month, day) {
    if (month < 0 || month > 11) return false;
    if (day < 1 || day > 31) return false;

    const date = new Date(year, month, day);
    return date.getFullYear() === year &&
           date.getMonth() === month &&
           date.getDate() === day;
}

/**
 * Format Date object to ISO date string (YYYY-MM-DD)
 * This is the standard format for API responses and storage
 * @param {Date|string} dateInput - Date object or string
 * @returns {string} - ISO date string (YYYY-MM-DD)
 */
function formatISO(dateInput) {
    const date = dateInput instanceof Date ? dateInput : parseDate(dateInput);
    if (!date) return '';

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Format Date object to DD-MM-YYYY string for user display
 * @param {Date|string} dateInput - Date object or string
 * @returns {string} - DD-MM-YYYY formatted string
 */
function formatDDMMYYYY(dateInput) {
    const date = dateInput instanceof Date ? dateInput : parseDate(dateInput);
    if (!date) return '';

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();

    return `${day}-${month}-${year}`;
}

/**
 * Format Date object to DD-MMM-YY string (e.g., "15-Jan-25")
 * @param {Date|string} dateInput - Date object or string
 * @returns {string} - DD-MMM-YY formatted string
 */
function formatDDMMMYY(dateInput) {
    const date = dateInput instanceof Date ? dateInput : parseDate(dateInput);
    if (!date) return '';

    const day = String(date.getUTCDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getUTCMonth()];
    const year = String(date.getUTCFullYear()).slice(-2);

    return `${day}-${month}-${year}`;
}

/**
 * Validate DD-MM-YYYY string format
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} - True if valid DD-MM-YYYY
 */
function isValidDDMMYYYY(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return false;

    const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!match) return false;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);

    return isValidDate(year, month, day);
}

/**
 * Get month name from Date
 * @param {Date|string} dateInput - Date object or string
 * @returns {string} - Month name (e.g., "January")
 */
function getMonthName(dateInput) {
    const date = dateInput instanceof Date ? dateInput : parseDate(dateInput);
    if (!date) return '';

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return monthNames[date.getUTCMonth()];
}

/**
 * Get month number (1-12) from Date
 * @param {Date|string} dateInput - Date object or string
 * @returns {number} - Month number (1-12)
 */
function getMonthNumber(dateInput) {
    const date = dateInput instanceof Date ? dateInput : parseDate(dateInput);
    if (!date) return 0;

    return date.getUTCMonth() + 1;
}

/**
 * Clone a Date object
 * @param {Date} date - Date to clone
 * @returns {Date} - Cloned date
 */
function cloneDate(date) {
    if (!(date instanceof Date)) return null;
    return new Date(date.getTime());
}

// Export for Node.js (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseDate,
        normalizeToUTCMidnight,
        formatISO,
        formatDDMMYYYY,
        formatDDMMMYY,
        isValidDDMMYYYY,
        isValidDate,
        getMonthName,
        getMonthNumber,
        cloneDate
    };
}

// Export for ES6 modules
if (typeof exports !== 'undefined') {
    exports.parseDate = parseDate;
    exports.normalizeToUTCMidnight = normalizeToUTCMidnight;
    exports.formatISO = formatISO;
    exports.formatDDMMYYYY = formatDDMMYYYY;
    exports.formatDDMMMYY = formatDDMMMYY;
    exports.isValidDDMMYYYY = isValidDDMMYYYY;
    exports.isValidDate = isValidDate;
    exports.getMonthName = getMonthName;
    exports.getMonthNumber = getMonthNumber;
    exports.cloneDate = cloneDate;
}
