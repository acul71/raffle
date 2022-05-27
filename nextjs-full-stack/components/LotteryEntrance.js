import { useMoralis, userWeb3Contract, useWeb3Contract } from "react-moralis"
import abi from "../constants/abi.json"
import { useState, useEffect } from "react"
import { PlayLottery } from "./PlayLottery"
import { LotteryStats } from "./LotteryStats"

const CONTRACT_ADDRESS = "0xfA77a882be1F96C2961E29a92824e98213E846b0"

export default function LotteryEntrance() {
  const { isWeb3Enabled } = useMoralis()
  const [recentWinner, setRecentWinner] = useState("0")
  const [numPlayer, setNumPlayer] = useState("0")

  // Enter lottery button
  // runContractFunction : enterRaffle // Rename runContractFunction in enterRaffle
  const { runContractFunction: enterRaffle } = useWeb3Contract({
    abi: abi,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "enterRaffle",
    msgValue: "10000000000000000", // 0.01ETH
    params: {},
  })

  // View Functions

  const { runContractFunction: getPlayers } = useWeb3Contract({
    abi: abi,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "s_players[0]",
    params: {},
  })

  const { runContractFunction: getRecentWinner } = useWeb3Contract({
    abi: abi,
    contractAddress: CONTRACT_ADDRESS,
    functionName: "s_recentWinner",
    params: {},
  })

  useEffect(() => {
    async function updateUi() {
      const recentWinnerFromCall = await getRecentWinner()
      setRecentWinner(recentWinnerFromCall)
    }

    if (isWeb3Enabled) {
      updateUi()
    }

    
  }, [isWeb3Enabled])


  return (
    <>
      <PlayLottery />
      <LotteryStats />
    </>
  )
  /*
  return (
    <div>
      <button
        className="rounded ml-auto p-1 font-bold bg-blue-500"
        onClick={async () => {
          await enterRaffle()
        }}>
        Enter Lottery!
      </button>
      <button
        className="rounded ml-auto p-1 font-bold bg-blue-500"
        onClick={async () => {
          const players = await getPlayers()
          console.log('players=', players)
        }}>
        See who is playing!
      </button>
      
      <div>The recent winner is {recentWinner}</div>
    </div>
  )
  */
}