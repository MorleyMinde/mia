// Test timestamp creation
const dateStr = "2024-11-20";
const timeStr = "14:30";
const timestamp = new Date(`${dateStr}T${timeStr}:00`);
console.log("Created timestamp:", timestamp);
console.log("Is valid?", !isNaN(timestamp.getTime()));
console.log("getTime():", timestamp.getTime());
console.log("toISOString():", timestamp.toISOString());
