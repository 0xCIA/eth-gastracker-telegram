const axios = require('axios');
const { etherscanApiKey, telegramBotToken, telegramChatId } = require('./config.js');

const lowGasThreshold = 20;
const midGasThreshold = 25;
const highGasThreshold = 30;
const soHighGasThreshold = 50; 

let prevState = null;

async function getGasPrices() {
  try {
    const rpcUrl = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${etherscanApiKey}`;

    const response = await axios.get(rpcUrl);
    const gasPrices = response.data.result;
    return gasPrices;
  } catch (error) {
    console.error("Error fetching gas price:", error);
    return null;
  }
}

async function sendMessageToTelegram(message) {
  const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
  const params = {
    chat_id: telegramChatId,
    text: message
  };
  try {
    await axios.post(telegramApiUrl, params);
    console.log("Message sent:", message);
  } catch (error) {
    console.error("Error sending message", error);
  }
}


async function trackGasAndSendMessages() {
  while (true) {
    const gasPrices = await getGasPrices();

    if (gasPrices !== null) {
      const proposeGasPriceGwei = gasPrices.ProposeGasPrice
      let currentState = null;
      let message = "";

      if (proposeGasPriceGwei < lowGasThreshold) {
        currentState = "low";
        message = `Gas price is very low — ${proposeGasPriceGwei} GWEI`;
      } else if (proposeGasPriceGwei <= midGasThreshold && proposeGasPriceGwei > lowGasThreshold) {
        currentState = "lowTwo"
        message = `Gas price is low — ${proposeGasPriceGwei} GWEI`
      } else if (proposeGasPriceGwei > midGasThreshold && proposeGasPriceGwei < highGasThreshold) {   
        currentState = "mid";
        message = `Gas price is middle — ${proposeGasPriceGwei} GWEI`;
      } else if (proposeGasPriceGwei >= highGasThreshold && proposeGasPriceGwei < soHighGasThreshold) { 
        currentState = "midTwo";
        message = `Gas price is high — ${proposeGasPriceGwei} GWEI`;
      } else if (proposeGasPriceGwei >= soHighGasThreshold) {
        currentState = "high";
        message = `Suspicious activity has been started. Gas price is so high — ${proposeGasPriceGwei} GWEI`;
      }

      if (currentState !== prevState && message !== "") {
        sendMessageToTelegram(message);
        prevState = currentState;
      }
    }
  }
}

trackGasAndSendMessages();


