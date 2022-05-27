import React from 'react'
import { useMoralis, useWeb3Contract } from "react-moralis"
import abi from "../constants/abi.json"
import { CONTRACT_ADDRESS } from '../constants/constants'
import { useState, useEffect } from "react"
import { ethers, BigNumber } from 'ethers'
import { shortAddress } from '../utils/utils'

export const LotteryStats = () => {
  const { isWeb3Enabled } = useMoralis()
  const [bets, setBets] = useState([])

  const { runContractFunction: getNumPlayers } = useWeb3Contract({
    abi: abi,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "numPlayers",
    params: {},
  })

  const { runContractFunction: getBets } = useWeb3Contract({
    abi: abi,
    contractAddress: CONTRACT_ADDRESS,
    // functionName: "getBets",
    functionName: "getBet",
    params: {},
  })

  useEffect(() => {
    async function updateUi() {
      const numPlayersFromCall = await getNumPlayers()
      console.log("numPlayersFromCall=", numPlayersFromCall)

      const betsFromCall = await getBets()
      console.log("betsFromCall=", betsFromCall)
      setBets(betsFromCall)
    }
    if (isWeb3Enabled) {
      updateUi()
      
      const intervalId = setInterval(() => {
        console.log('_interval')
        updateUi();
      }, 10000);
      return () => {console.log('remove interval'); clearInterval(intervalId)};
      
    }
    
  }, [isWeb3Enabled])

  const ThisRoundTickets = () => {
    //console.log('bets=', bets)
    // get all tickets
    const totTickets = 0
    for (const idx = 0; idx < bets.length; idx++) {
      totTickets += Number(bets[idx].tickets.toString())
    }
    //console.log("totTickets=",totTickets)
    const pricePerTicket = "100000000000000";
    return (
      <>
        <div>Tot Tickets|Win Chance|Address|Amount</div>
        {bets.map((bet) => {
          const winChance = Number(bet.tickets.toString()) / totTickets * 100
          winChance = winChance.toFixed(3)
          return (
            <div key={bet.player}>
              {bet.tickets.toString()}|
              {winChance}%|
              {shortAddress(bet.player)}|
              {(ethers.utils.formatEther(pricePerTicket) * Number(bet.tickets.toString())).toFixed(4)}
            </div>
          )
        })
        }
      </>
    )
  }

  return (
    <>
      <div><b>LotteryStats</b></div>
      <ThisRoundTickets />
    </>
  )
}
