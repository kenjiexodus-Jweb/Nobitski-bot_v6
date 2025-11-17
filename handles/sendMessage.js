const axios = require("axios");

/**
 * Send a message to a Facebook user via Messenger API.
 * @param {string} senderId - The recipient's Facebook user ID.
 * @param {object} messageData - The message payload (e.g., { text: "Hello!" }).
 * @param {string} pageAccessToken - The Facebook Page access token.
 */
async function sendMessage(senderId, messageData, pageAccessToken) {
  const url = `https://graph.facebook.com/v17.0/me/messages?access_token=${pageAccessToken}`;

  try {
    const response = await axios.post(url, {
      recipient: { id: senderId },
      message: messageData
    });

    console.log(`✅ Message sent to ${senderId}:`, messageData);
    return response.data;

  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error("❌ Error sending message:", errData);

    // Optional: retry once if it's a temporary error
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      console.warn("⚠️ Retrying message send...");
      return sendMessage(senderId, messageData, pageAccessToken);
    }
  }
}

module.exports = { sendMessage };