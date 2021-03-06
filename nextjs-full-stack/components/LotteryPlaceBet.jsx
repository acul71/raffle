import { React, useRef } from 'react'
import { useMoralis, useWeb3Contract, useWeb3ExecuteFunction } from "react-moralis"
import abi from "../constants/abi.json"
import { CONTRACT_ADDRESS } from '../constants/constants'
//import { useState, useEffect } from "react"
import { ethers, BigNumber } from 'ethers'
import styles from '../styles/Home.module.css'

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
      <div className={styles.div_red}><b>LotteryPlaceBet</b>
        <div className='ml-5'>
          <label className='mr-2' htmlFor="tickets">Number of tickets:</label>

          <input className='mr-4' type="number" ref={ticketsInput} id="tickets" name="tickets" min="1" defaultValue={1} />
          <button className='button4' onClick={() => buyTickets()}>Buy tickets</button>
        </div>
      </div>
    </>
  )
}
