import { React, useRef } from 'react'
import { useMoralis, useWeb3Contract, useWeb3ExecuteFunction } from "react-moralis"
import abi from "../constants/abi.json"
import { CONTRACT_ADDRESS } from '../constants/constants'
//import { useState, useEffect } from "react"
import { ethers, BigNumber } from 'ethers'

export const LotteryPlaceBet = () => {
  const { data, error, fetch, isFetching, isLoading } = useWeb3ExecuteFunction();

  const ticketsInput = useRef(null);

  
  const perTicketPrice = "100000000000000"

  const buyTickets = () => {
    const numTickets = ticketsInput.current.value
    console.log("Buy Tickets", numTickets)
    const options = {
      abi: abi,
      contractAddress: CONTRACT_ADDRESS,
      functionName: "enterRaffle",
      msgValue: perTicketPrice * numTickets,
      params: { tickets: numTickets },
    }
    
    fetch({ params: options })
  }

  return (
    <>
      <div><b>LotteryPlaceBet</b></div>

      <label htmlFor="tickets">Number of tickets:</label>

      <input type="number" ref={ticketsInput} id="tickets" name="tickets" min="1" defaultValue={1} />
      <button  onClick={() => buyTickets()}>Buy tickets</button>

    </>
  )
}
