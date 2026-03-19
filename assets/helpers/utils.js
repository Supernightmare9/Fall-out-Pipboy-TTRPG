// Utility Functions
const Utils = {
  // Format timestamp to readable format
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  },
  
  // Get health bar color based on percentage
  getHealthBarColor(current, max) {
    const percent = (current / max) * 100;
    if (percent > 75) return 'success';
    if (percent > 25) return 'warning';
    return 'danger';
  },
  
  // Validate email
  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  
  // Clamp value between min and max
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },
  
  // Deep copy object
  deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  },
  
  // Check if object is empty
  isEmpty(obj) {
    return Object.keys(obj).length === 0;
  },
  
  // Show notification
  showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
};
