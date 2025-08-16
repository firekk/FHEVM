import { ethers } from "hardhat";
import { VotingDemo, FinanceDemo } from "../typechain-types";

async function main() {
  console.log("🚀 Starting FHEVM dApp deployment...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer address:", deployer.address);

  // 部署 VotingDemo 合约
  console.log("🗳️  Deploying VotingDemo contract...");
  const votingDescription = "是否采用 FHE 技术进行隐私保护？";
  const votingDuration = 3600; // 1小时
  const VotingDemoFactory = await ethers.getContractFactory("VotingDemo");
  const votingDemo: VotingDemo = await VotingDemoFactory.deploy(votingDescription, votingDuration);
  await votingDemo.waitForDeployment();
  console.log("✅ VotingDemo deployed to:", votingDemo.target);

  // 部署 FinanceDemo 合约
  console.log("💰 Deploying FinanceDemo contract...");
  const FinanceDemoFactory = await ethers.getContractFactory("FinanceDemo");
  const financeDemo: FinanceDemo = await FinanceDemoFactory.deploy();
  await financeDemo.waitForDeployment();
  console.log("✅ FinanceDemo deployed to:", financeDemo.target);

  // 为 FinanceDemo 注册用户
  console.log("👥 Registering initial users...");
  const initialBalance = ethers.parseEther("100");
  const encryptedProfile = ethers.id("Admin Profile");
  await financeDemo.registerUser(deployer.address, initialBalance, encryptedProfile);
  console.log("✅ Admin registered in finance system");

  // 注册投票者
  const voterWeight = 10;
  await votingDemo.registerVoter(voterWeight);
  console.log("✅ Admin registered as voter");

  // 输出部署信息
  console.log("\n🎉 Deployment completed successfully!");
  console.log("=====================================");
  console.log("VotingDemo Contract:", votingDemo.target);
  console.log("FinanceDemo Contract:", financeDemo.target);
  console.log("Admin Address:", deployer.address);
  console.log("=====================================");

  // 保存部署信息到文件
  const deploymentInfo = {
    votingDemo: votingDemo.target,
    financeDemo: financeDemo.target,
    adminAddress: deployer.address,
    votingDescription,
    votingDuration,
    network: await ethers.provider.getNetwork(),
    timestamp: new Date().toISOString(),
  };

  // 写入部署信息文件
  import("fs").then(fs => {
    fs.writeFileSync(
      "./deployment-info.json",
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("📄 Deployment info saved to deployment-info.json");
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });