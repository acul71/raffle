import React from 'react'
//import { lotteryCurRound } from '../utils/utils'
import { useMoralis, useWeb3Contract } from "react-moralis"
import abi from "../constants/abi.json"
import { CONTRACT_ADDRESS } from '../constants/constants'
import { useState, useEffect } from "react"
import { ethers, BigNumber } from 'ethers'
import Countdown from 'react-countdown'
import styles from '../styles/Home.module.css'

export const LotteryCurGameStats = () => {
  const { isWeb3Enabled } = useMoralis()
  const [lotteryRound, setLotteryRound] = useState("0")
  const [totTickets, setTotTickets] = useState("0")
  const [pricePerTicket, setpricePerTicket] = useState("0")
  const [prizePool, setPrizePool] = useState("0")
  const [winnersQuotes, setWinnersQuotes] = useState([0, 0, 0])
  const [roundInterval, setRoundInterval] = useState("0") // In seconds
  const [lastTimeStamp, setLastTimeStamp] = useState("0") // In seconds
  //const [reload, setReload] = useState(0)



  /*
  useApiContract: Calls the Moralis API and doesn’t require metamask to be enabled.
  useWeb3Contract: Executes a contract without calling moralis API (needs metamask)
  useWeb3ExecuteFunction: The same as useWeb3Contract? Is this for calls instead of sends? (Not actually spending gas)
  useMoralisWeb3Api: Everything in the Moralis.Web3API as a hook
  Moralis.executeFunction: Execute a function without a hook
  */

  const { runContractFunction: getLotteryRound } = useWeb3Contract({
    abi: abi,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "s_raffle_round",
    params: {},
  })

  const { runContractFunction: getPricePerTicket } = useWeb3Contract({
    abi: abi,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "i_entranceFee",
    params: {},
  })

  // s_prizePool
  const { runContractFunction: getPrizePool } = useWeb3Contract({
    abi: abi,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "s_prizePool",
    params: {},
  })


  // WINNERS QUOTES
  const { runContractFunction: getWinner1Quote } = useWeb3Contract({
    abi: abi,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "WINNER1_QUOTE",
    params: {},
  })
  const { runContractFunction: getWinner2Quote } = useWeb3Contract({
    abi: abi,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "WINNER2_QUOTE",
    params: {},
  })
  const { runContractFunction: getWinner3Quote } = useWeb3Contract({
    abi: abi,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "WINNER3_QUOTE",
    params: {},
  })

  // uint256 public s_lastTimeStamp;
  const { runContractFunction: getLastTimeStamp } = useWeb3Contract({
    abi: abi,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "s_lastTimeStamp",
    params: {},
  })

  // bool timePassed = (block.timestamp - s_lastTimeStamp) > i_interval; // keep track of time
  const { runContractFunction: getRoundInterval } = useWeb3Contract({
    abi: abi,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "i_interval",
    params: {},
  })

  console.log("HERE")


  useEffect(() => {
    async function updateUi() {

      //
      // Add try to this section to avoid errors!!
      //
      const pricePerTicketFromCall = await getPricePerTicket()
      console.log("pricePerTicketFromCall=", pricePerTicketFromCall.toString())
      setpricePerTicket(pricePerTicketFromCall.toString())

      const prizePoolFromCall = await getPrizePool()
      console.log("prizePoolFromCall=", prizePoolFromCall)
      setPrizePool(prizePoolFromCall.toString())

      setTotTickets(prizePoolFromCall / pricePerTicketFromCall)

      // Get Winners Quotes
      const winnersQuotesFromCall = []
      winnersQuotesFromCall[0] = await getWinner1Quote()
      winnersQuotesFromCall[1] = await getWinner2Quote()
      winnersQuotesFromCall[2] = await getWinner3Quote()
      console.log("winnersQuotesFromCall=", winnersQuotesFromCall)
      setWinnersQuotes([winnersQuotesFromCall[0], winnersQuotesFromCall[1], winnersQuotesFromCall[2]])


      // Get Lottery time (to end)
      const lastTimeStampFromCall = await getLastTimeStamp()
      console.log("lastTimeStampFromCall=", lastTimeStampFromCall, lastTimeStampFromCall.toString())
      //lastTimeStampFromCall = Date.now() // Testing
      setLastTimeStamp(lastTimeStampFromCall.toString())
      const intervalFromCall = await getRoundInterval()
      console.log("intervalFromCall=", intervalFromCall, intervalFromCall.toString())
      //intervalFromCall = 10000 // Testing
      setRoundInterval(intervalFromCall.toString())


      const lotteryRoundFromCall = await getLotteryRound()
      console.log("lotteryRoundFromCall=", lotteryRoundFromCall)
      setLotteryRound(lotteryRoundFromCall.toString())

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
  //[getInterval, getLastTimeStamp, getLotteryRound, getPricePerTicket, getPrizePool, getWinner1Quote, getWinner2Quote, getWinner3Quote, interval, isWeb3Enabled, lastTimeStamp, pricePerTicket, prizePool])

  // Get lottery current round



  // Renderer callback with condition
  const timeRenderer = ({ days, hours, minutes, seconds, completed }) => {
    if (completed) {
      // Render a completed state
      return (<span>Winners selection in course...</span>)
    } else {
      // Render a countdown
      return <span>{days}D {hours}H {minutes}M {seconds}S</span>;
    }
  }

  //const pricePlace = [.8, .15, .5]
  return (

    <>
      {lotteryRound == "0" ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className={styles.div_green}>
            <b>LotteryCurGameStats</b>
            <div>
              <span className='ml-2'>Lottery round: {lotteryRound}</span>
              <span className='ml-5'>Time to end: <Countdown date={Number(lastTimeStamp) * 1000 + Number(roundInterval) * 1000} renderer={timeRenderer} /></span>
            </div>
            <div>
              <span className='ml-2'>Tot tickets: {totTickets}</span>
              <span className='ml-5'>Total pot: {ethers.utils.formatEther(prizePool)}</span>
              <span className='ml-5'>Price per ticket: {ethers.utils.formatEther(pricePerTicket)}</span>
            </div>
            <div className='ml-2'>
              Price place:
              {winnersQuotes.map((quote, idx) => {
                return (
                  <span key={idx} className='ml-3'>{idx + 1}° {quote}%</span>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
