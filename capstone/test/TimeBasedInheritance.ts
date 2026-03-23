import { expect } from "chai";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { TimeBasedInheritance } from "../typechain-types";

describe("TimeBasedInheritance", function () {
  let contract: TimeBasedInheritance;
  let owner: SignerWithAddress;
  let beneficiary: SignerWithAddress;
  let otherUser: SignerWithAddress;
  
  const ASSET_ID = ethers.keccak256(ethers.toUtf8Bytes("My Digital Asset"));
  const CHECK_IN_PERIOD = 90 * 24 * 60 * 60; // 90 days in seconds

  beforeEach(async function () {
    // Get signers
    [owner, beneficiary, otherUser] = await ethers.getSigners();
    
    // Deploy contract
    const TimeBasedInheritanceFactory = await ethers.getContractFactory("TimeBasedInheritance");
    contract = await TimeBasedInheritanceFactory.deploy();
    await contract.waitForDeployment();
  });

  describe("Registration", function () {
    it("should register a new asset", async function () {
      await expect(contract.registerAsset(ASSET_ID, beneficiary.address))
        .to.emit(contract, "AssetRegistered")
        .withArgs(ASSET_ID, owner.address, beneficiary.address, await ethers.provider.getBlock("latest").then(b => b!.timestamp));
      
      const asset = await contract.getAsset(ASSET_ID);
      expect(asset.owner).to.equal(owner.address);
      expect(asset.beneficiary).to.equal(beneficiary.address);
      expect(asset.isActive).to.be.true;
      expect(asset.timeUntilClaim).to.equal(CHECK_IN_PERIOD);
    });

    it("should not allow registration with zero beneficiary address", async function () {
      await expect(
        contract.registerAsset(ASSET_ID, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid beneficiary");
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

  describe("Check-in", function () {
    beforeEach(async function () {
      await contract.registerAsset(ASSET_ID, beneficiary.address);
    });

    it("should allow owner to check in", async function () {
      const tx = await contract.checkIn(ASSET_ID);
      await expect(tx)
        .to.emit(contract, "CheckedIn")
        .withArgs(ASSET_ID, owner.address, await ethers.provider.getBlock("latest").then(b => b!.timestamp));
      
      const asset = await contract.getAsset(ASSET_ID);
      expect(asset.timeUntilClaim).to.equal(CHECK_IN_PERIOD);
    });

    it("should not allow non-owner to check in", async function () {
      await expect(
        contract.connect(beneficiary).checkIn(ASSET_ID)
      ).to.be.revertedWith("Not the owner");
    });

    it("should not allow check-in after asset is claimed", async function () {
      // Fast forward past the check-in period
      await network.provider.send("evm_increaseTime", [CHECK_IN_PERIOD + 1]);
      await network.provider.send("evm_mine");
      
      // Claim inheritance
      await contract.connect(beneficiary).claimInheritance(ASSET_ID);
      
      // Try to check in as original owner
      await expect(
        contract.checkIn(ASSET_ID)
      ).to.be.revertedWith("Asset already claimed");
    });
  });

  describe("Inheritance Claim", function () {
    beforeEach(async function () {
      await contract.registerAsset(ASSET_ID, beneficiary.address);
    });

    it("should not allow claim before the check-in period", async function () {
      // Advance half the period
      await network.provider.send("evm_increaseTime", [CHECK_IN_PERIOD / 2]);
      await network.provider.send("evm_mine");
      
      await expect(
        contract.connect(beneficiary).claimInheritance(ASSET_ID)
      ).to.be.revertedWith("Owner still active");
    });

    it("should allow claim after the check-in period", async function () {
      // Fast forward past the check-in period
      await network.provider.send("evm_increaseTime", [CHECK_IN_PERIOD + 1]);
      await network.provider.send("evm_mine");
      
      await expect(contract.connect(beneficiary).claimInheritance(ASSET_ID))
        .to.emit(contract, "InheritanceClaimed")
        .withArgs(ASSET_ID, beneficiary.address, await ethers.provider.getBlock("latest").then(b => b!.timestamp));
      
      const asset = await contract.getAsset(ASSET_ID);
      expect(asset.owner).to.equal(beneficiary.address);
      expect(asset.beneficiary).to.equal(ethers.ZeroAddress);
      expect(asset.isActive).to.be.false;
    });

    it("should not allow non-beneficiary to claim", async function () {
      await network.provider.send("evm_increaseTime", [CHECK_IN_PERIOD + 1]);
      await network.provider.send("evm_mine");
      
      await expect(
        contract.connect(otherUser).claimInheritance(ASSET_ID)
      ).to.be.revertedWith("Not the beneficiary");
    });

    it("should not allow claim after already claimed", async function () {
      await network.provider.send("evm_increaseTime", [CHECK_IN_PERIOD + 1]);
      await network.provider.send("evm_mine");
      
      await contract.connect(beneficiary).claimInheritance(ASSET_ID);
      
      await expect(
        contract.connect(beneficiary).claimInheritance(ASSET_ID)
      ).to.be.revertedWith("Asset already claimed");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await contract.registerAsset(ASSET_ID, beneficiary.address);
    });

    it("should return correct asset details", async function () {
      const asset = await contract.getAsset(ASSET_ID);
      expect(asset.owner).to.equal(owner.address);
      expect(asset.beneficiary).to.equal(beneficiary.address);
      expect(asset.lastCheckIn).to.be.gt(0);
      expect(asset.isActive).to.be.true;
    });

    it("should calculate remaining time correctly", async function () {
      // Advance 30 days
      await network.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
      await network.provider.send("evm_mine");
      
      const asset = await contract.getAsset(ASSET_ID);
      // Should have 60 days remaining
      expect(asset.timeUntilClaim).to.be.closeTo(60 * 24 * 60 * 60, 5);
    });
  });
});