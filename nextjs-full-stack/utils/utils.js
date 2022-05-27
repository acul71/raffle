
//import { useMoralis, userWeb3Contract, useWeb3Contract } from "react-moralis"
import ABI from "../constants/abi.json"

import { CONTRACT_ADDRESS } from '../constants/constants'

const CHAIN = "rinkeby"

/*
const { runContractFunction: getPlayers } = useWeb3Contract({
  abi: abi,
  contractAddress: CONTRACT_ADDRESS,
  functionName: "s_players[0]",
  params: {},
})
*/

const shortAddress = (address) => {
  return address.substring(0, 6) + '...' + address.substring(address.length - 6)
}



export { shortAddress }