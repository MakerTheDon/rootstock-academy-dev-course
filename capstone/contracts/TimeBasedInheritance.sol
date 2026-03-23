// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TimeBasedInheritance {
    struct Asset {
        address owner;
        address beneficiary;
        uint256 lastCheckIn;
        bool isActive;
    }
    
    mapping(bytes32 => Asset) public assets;
    uint256 public constant CHECK_IN_PERIOD = 90 days;
    
    event AssetRegistered(bytes32 indexed assetId, address indexed owner, address indexed beneficiary, uint256 timestamp);
    event CheckedIn(bytes32 indexed assetId, address indexed owner, uint256 timestamp);
    event InheritanceClaimed(bytes32 indexed assetId, address indexed newOwner, uint256 timestamp);
    
    function registerAsset(bytes32 assetId, address beneficiary) external {
        require(assets[assetId].owner == address(0), "Asset already registered");
        require(beneficiary != address(0), "Invalid beneficiary");
        require(beneficiary != msg.sender, "Cannot set self as beneficiary");
        
        assets[assetId] = Asset({
            owner: msg.sender,
            beneficiary: beneficiary,
            lastCheckIn: block.timestamp,
            isActive: true
        });
        
        emit AssetRegistered(assetId, msg.sender, beneficiary, block.timestamp);
    }
    
    function checkIn(bytes32 assetId) external {
        Asset storage asset = assets[assetId];
        require(asset.owner == msg.sender, "Not the owner");
        require(asset.isActive, "Asset already claimed");
        
        asset.lastCheckIn = block.timestamp;
        
        emit CheckedIn(assetId, msg.sender, block.timestamp);
    }
    
    function claimInheritance(bytes32 assetId) external {
        Asset storage asset = assets[assetId];
        require(asset.beneficiary == msg.sender, "Not the beneficiary");
        require(asset.isActive, "Asset already claimed");
        require(block.timestamp > asset.lastCheckIn + CHECK_IN_PERIOD, "Owner still active");
        
        asset.owner = msg.sender;
        asset.beneficiary = address(0);
        asset.isActive = false;
        
        emit InheritanceClaimed(assetId, msg.sender, block.timestamp);
    }
    
    function getAsset(bytes32 assetId) external view returns (
        address owner,
        address beneficiary,
        uint256 lastCheckIn,
        bool isActive,
        uint256 timeUntilClaim
    ) {
        Asset storage asset = assets[assetId];
        uint256 deadline = asset.lastCheckIn + CHECK_IN_PERIOD;
        uint256 timeUntil = block.timestamp >= deadline ? 0 : deadline - block.timestamp;
        return (asset.owner, asset.beneficiary, asset.lastCheckIn, asset.isActive, timeUntil);
    }
}
