// Service to send WhatsApp notifications
export const sendWhatsAppNotification = async ({ phoneNumber, message }) => {
  // In a real application, this would make an API call to your WhatsApp service
  console.log(`Sending WhatsApp notification to ${phoneNumber}: ${message}`);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    messageId: `msg_${Date.now()}`
  };
  };
  
// Service to validate phone numbers
export const validatePhoneNumber = (phoneNumber) => {
  // Basic phone number validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
  };