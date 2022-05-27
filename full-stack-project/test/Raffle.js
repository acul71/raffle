const { expect, assert } = require("chai");
//const ethers  = require("ethers");
const { ethers } = require("hardhat");

describe("Raffle contract test", function () {
  let owner, player1, player2
  let Raffle, raffle

  before(async function () {
    [owner, player1, player2] = await ethers.getSigners();
    console.log('owner=', owner.address)
    console.log('player1=', player1.address)
    console.log('player2=', player2.address)

    Raffle = await ethers.getContractFactory("Raffle")

    /*
    {
      "uint256 entranceFee": "1000000000000000",
      "uint256 interval": "300", // In seconds
      "address vrfCoordinatorV2": "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
      "bytes32 gasLane": "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
      "uint64 subscriptionId": "3632",
      "uint32 callbackGasLimit": 100000
    }
    */
    raffle = await Raffle.deploy(
      "1000000000000000", //0.001*ethers, // 1000000000000000
      "300",
      "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
      "3632",
      "100000" // 100000
    )
  })

  describe("Test placing bets", function () {
    it("Player1 enters raffle buying 10 tickets", async function () {
      await raffle.connect(player1).enterRaffle("10", { value: "10000000000000000" })
      // Check it
      const player1Bet1 = await raffle.s_bets("0")
      //console.log("playerBet=", player1Bet1)
      expect(player1Bet1.player).to.be.equal(player1.address)
      expect(player1Bet1.tickets).to.be.equal(10)
    })

    it("Player1 add 1 ticket", async function () {
      await raffle.connect(player1).enterRaffle("1", { value: "1000000000000000" })
      const player1Bet2 = await raffle.s_bets("0")
      //console.log("playerBet=", player1Bet2)
      expect(player1Bet2.player).to.be.equal(player1.address)
      expect(player1Bet2.tickets).to.be.equal(11)
    })

    it("Player2 buy 2 tickets", async function () {
      await raffle.connect(player2).enterRaffle("2", { value: "2000000000000000" })
      const player2Bet1 = await raffle.s_bets("1")
      //console.log("playerBet=", player1Bet2)
      expect(player2Bet1.player).to.be.equal(player2.address)
      expect(player2Bet1.tickets).to.be.equal(2)
    })

    it("Expected to be reverted cause not enough funds", async function () {
      await expect(raffle.connect(player1).enterRaffle("1", { value: "100000000000000" }))
        .to.be.revertedWith(`Raffle__SendMoreToEnterRaffle`)
      //.to.be.revertedWith(`__SendMoreToEnterRaffle`) // This works too: WHY IS THAT?????
    })

    it("Should emit RaffleEnter Event", async function () {
      await expect(raffle.connect(player2).enterRaffle("1", { value: "1000000000000000" }))
        .to.emit(raffle, 'RaffleEnter').withArgs(player2.address, 1)
    })

    it("Should return proper number of players", async function () {
      const numPlayers = await raffle.numPlayers()
      //console.log("numPlayers=", numPlayers.toBigInt())
      //assert(numPlayers.toString() === "2", "we should have 2 players at the moment")
      assert(numPlayers.toBigInt() === 2n, "we should have 2 players at the moment")
      
    })

    it("Add 100 players with random tickets", async function () {
      let wallet, playerBet, randTicket, tx
      for (let i = 0; i < 100; i++) {
        process.stdout.write(i + ".")
        // Get a new wallet
        wallet = ethers.Wallet.createRandom();
        // add the provider from Hardhat
        wallet = wallet.connect(ethers.provider);
        // send ETH to the new wallet so it can perform a tx
        await owner.sendTransaction({ to: wallet.address, value: ethers.utils.parseEther("0.1") })
        //await owner.sendTransaction({ to: wallet.address, value: "71186745258266896" })

        // Returns a random integer from 1 to 10:
        randTicket = Math.floor(Math.random() * 10) + 1;
        //randTicket = 10

        tx = await raffle.connect(wallet).enterRaffle(randTicket, { value: ethers.utils.parseEther((0.001 * randTicket).toString()) })
        /*
        receipt = await tx.wait()
        gasUsed = BigInt(receipt.cumulativeGasUsed) * BigInt(receipt.effectiveGasPrice)
        console.log('gasUsed=', gasUsed)
        // contractBalance = await ethers.provider.getBalance(deployedContract.address)
        */
        

        playerBet = await raffle.s_bets(i + 2)
        expect(playerBet.player).to.be.equal(wallet.address)
        expect(playerBet.tickets).to.be.equal(randTicket)

      }
      /*
      const bets = await raffle.getBets()
      console.log('bets=', bets)
      */
      console.log("Done")
    })

  })


});