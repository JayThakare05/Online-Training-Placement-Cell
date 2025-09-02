// Helper functions that can be shared across routes
export function excelDateToSQL(serial) {
  if (!serial) return null;
  const epoch = new Date(1900, 0, serial - 1);
  return epoch.toISOString().slice(0, 10);
}

// Add other helper functions as needed