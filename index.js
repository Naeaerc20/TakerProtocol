// index.js
const inquirer = require("inquirer");
const figlet = require("figlet");
const clear = require("console-clear");
const fs = require("fs");
const { ethers } = require("ethers");
const {
  ACTIVATION_CONTRACT,
  RPC_URL,
  CHAIN_ID,
  TX_EXPLORER,
  ACTIVATION_METHOD_ID
} = require("./ABI");

(async function main() {
  clear();
  console.log(figlet.textSync("TakerProtocol"));
  console.log("✨ Welcome to Taker Protocol Node Activation Bot! ✨");
  console.log("👑 Script created by Naeaex for Farmers \n");

  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "isContinuous",
      message: "Do you want to activate the node continuously (every 24 hours)?"
    }
  ]);

  if (answers.isContinuous) {
    console.log("🔁 You have chosen continuous activation. This will repeat every 24 hours. \n");
    await activateNodeProcess();
    console.log("🕓 Next activation in 24 hours...");
    setInterval(async () => {
      await activateNodeProcess();
      console.log("🕓 Next activation in 24 hours...");
    }, 24 * 60 * 60 * 1000);
  } else {
    console.log("⏳ Single activation process started... \n");
    await activateNodeProcess();
    console.log("✅ Single activation process complete! Exiting...");
    process.exit(0);
  }
})();

async function activateNodeProcess() {
  try {
    const wallets = JSON.parse(fs.readFileSync("./wallets.json", "utf-8"));
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL, {
      chainId: CHAIN_ID,
      name: "Taker"
    });

    for (let walletObj of wallets) {
      const walletAddress = walletObj.wallet;
      const privateKey = walletObj.privateKey;
      const signer = new ethers.Wallet(privateKey, provider);

      console.log(`🚀 Activating Node for Wallet [${walletAddress}]...`);

      try {
        const gasPrice = await provider.getGasPrice();
        const feeData = await provider.getFeeData();
        const maxFeePerGas = feeData.maxFeePerGas;
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

        const txResponse = await signer.sendTransaction({
          to: ACTIVATION_CONTRACT,
          data: ACTIVATION_METHOD_ID,
          gasLimit: Math.floor(Math.random() * (500000 - 250000 + 1)) + 250000,
          maxFeePerGas: maxFeePerGas,
          maxPriorityFeePerGas: maxPriorityFeePerGas
        });

        console.log(`📡 Tx Sent! - ${TX_EXPLORER}${txResponse.hash}`);
        const receipt = await txResponse.wait(1);
        console.log(`✅ Tx Included in Block Number [${receipt.blockNumber}]`);
      } catch (error) {
        if (error.code === "INSUFFICIENT_FUNDS") {
          console.log(`💸 Wallet [${walletAddress}] has insufficient funds for the transaction.`);
        } else if (error.code === "CALL_EXCEPTION") {
          console.log(`⚠️  Call exception occurred for Wallet [${walletAddress}].`);
        } else {
          console.log(`❌ Failed to send activation for Wallet [${walletAddress}]:`, error.message);
        }
      }
      console.log("");
    }
  } catch (err) {
    console.error("❌ Error in activateNodeProcess:", err.message);
  }
}
