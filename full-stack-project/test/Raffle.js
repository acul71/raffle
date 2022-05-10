const { expect } = require("chai");
//const ethers  = require("ethers");
//const { ethers } = require("hardhat");

describe("Raffle contract", function () {
  it("Test test", async function () {
    const [owner] = await ethers.getSigners();
    console.log('owner=', owner.address)

    const Raffle = await ethers.getContractFactory("Raffle");
    /*
    uint256 entranceFee, 
    uint256 interval, 
    address vrfCoordinatorV2, 
    bytes32 gasLane, // keyhash
    uint64 subscriptionId,
    uint32 callbackGasLimit
    */
    const hardhatToken = await Raffle.deploy(
      0.1*Ether,
      100000,
      '0xh98fh394hf394hf4',
      '9340239',
      12,
      0.01*Ether


    );

    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });
});