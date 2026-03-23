const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("TimeBasedInheritance", function () {
  let contract;
  let owner;
  let beneficiary;
  let otherUser;
  
  const ASSET_ID = ethers.keccak256(ethers.toUtf8Bytes("My Digital Asset"));
  const CHECK_IN_PERIOD = 90 * 24 * 60 * 60;

  beforeEach(async function () {
    [owner, beneficiary, otherUser] = await ethers.getSigners();
    
    const TimeBasedInheritanceFactory = await ethers.getContractFactory("TimeBasedInheritance");
    contract = await TimeBasedInheritanceFactory.deploy();
    await contract.waitForDeployment();
  });

  it("should register a new asset", async function () {
    await expect(contract.registerAsset(ASSET_ID, beneficiary.address))
      .to.emit(contract, "AssetRegistered");
    
    const asset = await contract.getAsset(ASSET_ID);
    expect(asset.owner).to.equal(owner.address);
    expect(asset.beneficiary).to.equal(beneficiary.address);
    expect(asset.isActive).to.be.true;
  });

  it("should not allow setting self as beneficiary", async function () {
    await expect(
      contract.registerAsset(ASSET_ID, owner.address)
    ).to.be.revertedWith("Cannot set self as beneficiary");
  });

  it("should not allow registering same asset twice", async function () {
    await contract.registerAsset(ASSET_ID, beneficiary.address);
    await expect(
      contract.registerAsset(ASSET_ID, beneficiary.address)
    ).to.be.revertedWith("Asset already registered");
  });
});
