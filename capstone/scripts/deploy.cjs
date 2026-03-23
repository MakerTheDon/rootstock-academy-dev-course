const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying TimeBasedInheritance contract...");

  const TimeBasedInheritance = await ethers.getContractFactory("TimeBasedInheritance");
  const contract = await TimeBasedInheritance.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("TimeBasedInheritance deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
