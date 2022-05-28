const { ethers } = require("hardhat")

const ENTRANCE_FEE = ethers.utils.parseEther("0.0001") // 100000000000000 wei

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  /*
    chainlink param in in https://docs.chain.link/docs/vrf-contracts/#rinkeby-testnet
    uint256 entranceFee, 
    uint256 interval, 
    address vrfCoordinatorV2, 
    bytes32 gasLane, // keyhash
    uint64 subscriptionId,
    uint32 callbackGasLimit
  */
  const args = [ 
    ENTRANCE_FEE, 
    "600", 
    "0x6168499c0cFfCaCD319c818142124B7A15E857ab", 
    "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", 
    "5226",
    "500000" 
  ]

  const raffle = await deploy("Raffle", {
    from: deployer,
    args: args,
    log: true,
    //waitConfirmation: 6,
  })

}