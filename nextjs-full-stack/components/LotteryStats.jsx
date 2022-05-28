import React from 'react'
import { useMoralis, useWeb3Contract } from "react-moralis"
import abi from "../constants/abi.json"
import { CONTRACT_ADDRESS } from '../constants/constants'
import { useState, useEffect } from "react"
import { ethers, BigNumber } from 'ethers'
import { shortAddress } from '../utils/utils'
import styles from '../styles/Home.module.css'

export const LotteryStats = () => {
  const { isWeb3Enabled } = useMoralis()
  const [bets, setBets] = useState([])
  const [recentWinners, setRecentWinners] = useState([])

  const { runContractFunction: getNumPlayers } = useWeb3Contract({
    abi: abi,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "numPlayers",
    params: {},
  })

  const { runContractFunction: getBets } = useWeb3Contract({
    abi: abi,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "getBets",
    params: {},
  })

  // getRecentWinners
  const { runContractFunction: getRecentWinners } = useWeb3Contract({
    abi: abi,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "getRecentWinners",
    params: {},
  })

  useEffect(() => {
    async function updateUi() {
      const numPlayersFromCall = await getNumPlayers()
      console.log("numPlayersFromCall=", numPlayersFromCall)

      const betsFromCall = await getBets()
      console.log("betsFromCall=", betsFromCall)
      if (betsFromCall) setBets(betsFromCall)

      const recentWinnersFromCall = await getRecentWinners()
      console.log("recentWinnersFromCall", recentWinnersFromCall)
      if (recentWinnersFromCall) setRecentWinners(recentWinnersFromCall)

    }
    if (isWeb3Enabled) {
      updateUi()

      const intervalId = setInterval(() => {
        console.log('_interval')
        updateUi();
      }, 10000);
      return () => { console.log('remove interval'); clearInterval(intervalId) };

    }

  }, [isWeb3Enabled])

  const ThisRoundTicketsAndPastWinners = () => {
    //console.log('bets=', bets)
    // get all tickets
    const totTickets = 0
    for (const idx = 0; idx < bets.length; idx++) {
      totTickets += Number(bets[idx].tickets.toString())
    }
    //console.log("totTickets=",totTickets)
    const pricePerTicket = "100000000000000";
    let raffleRound = 0;
    const player1Quote = 80;
    const player2Quote = 15;
    const player3Quote = 5;

    return (
      <>
        <div><b>This round tickets</b></div>
        <table>
          <thead>
            <tr>
              <th>Tot Tickets</th>
              <th>Win Chance</th>
              <th>Address</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {bets.map((bet) => {
              const winChance = Number(bet.tickets.toString()) / totTickets * 100
              winChance = winChance.toFixed(3)
              return (
                <tr key={bet.player}>
                  <td>{bet.tickets.toString()}</td>
                  <td>{winChance}%</td>
                  <td>{shortAddress(bet.player)}</td>
                  <td>{(ethers.utils.formatEther(pricePerTicket) * Number(bet.tickets.toString())).toFixed(4)}</td>
                </tr>
              )
            })
            }
          </tbody>
        </table>
        <div><b>Past winners</b></div>
        <table>
          <thead>
            <tr>
              <th>Round</th>
              <th>Address</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {recentWinners.map((rec, idx) => {
              raffleRound += 1
              return (
                <>
                  <tr key={idx * 10 + 0}>
                    <td>{raffleRound}</td>
                    <td>{rec.player1.toString()}</td>
                    <td>{rec.prizePool / player1Quote}</td>
                  </tr>
                  <tr key={idx * 10 + 1}>
                    <td>{raffleRound}</td>
                    <td>{rec.player2.toString()}</td>
                    <td>{rec.prizePool / player2Quote}</td>
                  </tr>
                  <tr key={idx * 10 + 2}>
                    <td>{raffleRound}</td>
                    <td>{rec.player3.toString()}</td>
                    <td>{rec.prizePool / player3Quote}</td>
                  </tr>
                </>
              )
            })}
          </tbody>
        </table>
      </>
    )
  }

  return (
    <>
      <div className={styles.div2}><b>LotteryStats</b>
        <ThisRoundTicketsAndPastWinners />
      </div>
    </>
  )
}
