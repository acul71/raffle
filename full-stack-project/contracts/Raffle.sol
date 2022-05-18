// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

error Raffle__SendMoreToEnterRaffle();
error Raffle__RaffleNotOpen();
error Raffle__UpkeepNotNeeded();
error Raffle__TransferFailed();
error Raffle__RandomTicketsNotUnique();

contract Raffle is VRFConsumerBaseV2 {
    enum RaffleState {
        Open,
        Calculating
    }

    struct playerTicket {
        address payable player;
        uint tickets;
    }
    // s_bets: Store all the player's address => num tickets bought
    playerTicket[] public s_bets;

    RaffleState public s_raffleState;
    uint256 public immutable i_entranceFee;
    uint256 public immutable i_interval;
    //address payable[] public s_players;
    // s_player mapping address => bought tickets
    mapping(address => uint) s_players;
    uint256 public s_lastTimeStamp;
    VRFCoordinatorV2Interface public immutable i_vrfCoordinator;
    bytes32 public i_gasLane;
    uint64 public i_subscriptionId;
    uint32 public i_callbackGasLimit;
    address public s_recentWinner;
    uint256 public raffle_round;
    

    uint16 public constant REQUEST_CONFIRMATIONS = 3;
    // Request 3 random numbers to VRF chainlink oracle
    uint16 public constant NUM_WORDS = 3;
    // This ruffle have 3 winners 
    uint8 public constant NUM_WINNERS = 3;
    // This are the quotes for each one
    uint8 public constant WINNER1_QUOTE = 80;
    uint8 public constant WINNER2_QUOTE = 15;
    uint8 public constant WINNER3_QUOTE = 5;
    // Number of tickets to select 
    uint8 public constant NUM_TICKETS = 3;



    event RaffleEnter(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed recentWinner);

    constructor(
        uint256 entranceFee,
        uint256 interval,
        address vrfCoordinatorV2,
        bytes32 gasLane, // keyhash
        uint64 subscriptionId,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_interval = interval;
        s_lastTimeStamp = block.timestamp;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
    }

    function enterRaffle(uint tickets) external payable {
        //require(msg.value > i_entranceFee, "Not enough money sent");
        if (msg.value < i_entranceFee * tickets) {
            revert Raffle__SendMoreToEnterRaffle();
        }

        // Open, Calulating a winner
        if (s_raffleState != RaffleState.Open) {
            revert Raffle__RaffleNotOpen();
        }
        // You can enter!
        //s_players.push(payable(msg.sender));
        //s_players[msg.sender] += tickets;
        // addBet(address payable player, uint tickets)
        addBet(payable(msg.sender), tickets);
        emit RaffleEnter(msg.sender);
    }

    // Select random winner
    // 1. we want this done automatically
    // 2. we want a real random winner

    // 1. Be true after some time interval
    // 2. The lottery to be open
    // 3. The contract has ETH
    // 4. Keepers has LINK
    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool isOpen = RaffleState.Open == s_raffleState;
        bool timePassed = (block.timestamp - s_lastTimeStamp) > i_interval; // keep track of time
        bool hasBalance = address(this).balance > 0;
        bool hasPlayers = s_bets.length > 0;
        upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers);
        return (upkeepNeeded, "0x0");
    }

    function performUpkeep(
        bytes calldata /* performData */
    ) external {
        (bool upkeepNeed, ) = checkUpkeep("");
        if (!upkeepNeed) {
            revert Raffle__UpkeepNotNeeded();
        }
        s_raffleState = RaffleState.Calculating;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        emit RequestedRaffleWinner(requestId);
    }

    //
    // Get the random numbers and select winners
    //
    function fulfillRandomWords(
        uint256, /*requestId*/
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] & s_players.length; // Check this should be % not & !!!
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_players = new address payable[](0);
        s_raffleState = RaffleState.Open;
        s_lastTimeStamp = block.timestamp;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Raffle__TransferFailed();
        }
        //removeBets();
        emit WinnerPicked(recentWinner);
    }

    //function addBet(address payable player, uint tickets) public payable {
    function addBet(address payable player, uint tickets) internal {
        // Search if player is already present and update tickets
        for (uint idx = 0; idx < s_bets.length; idx++) {
            if (s_bets[idx].player == player) {
                s_bets[idx].tickets += tickets;
                return;
            }
        }
        // If not add player and tickets
        playerTicket memory bet;
        bet.player = player;
        bet.tickets = tickets;
        s_bets.push(bet);
    }

    //function removeBets() internal {
    function removeBets() public {
        delete s_bets;
    }

    // Returns NUM_PLAYERS random tickets (unique in the range 1..totTickets)
    function getRandomTickets(uint[NUM_WORDS] memory randomWords, uint totTickets)
        public
        pure
        returns (uint[NUM_TICKETS] memory randTickets)
    {
        uint randTicketsIdx = 1;
        uint randNum;

        randTickets[0] = randomWords[0] % totTickets;
        for (uint idx = 1; idx < NUM_WORDS; idx++) {
            randNum = randomWords[idx] % totTickets;
            // This is hardcoded for 3 tickets (randTickets[0] randTickets[1])
            if (randTickets[0] != randNum && randTickets[1] != randNum) {
                randTickets[randTicketsIdx] = randNum;
                randTicketsIdx++;
            }
            if (randTicketsIdx == NUM_TICKETS) break;
        }
        if (randTicketsIdx < NUM_TICKETS) revert Raffle__RandomTicketsNotUnique();
        return randTickets;
    }

    function findWinners(uint[NUM_WINNERS] memory winTickets)
        public
        returns (address[NUM_WINNERS] memory winners)
    {
        uint curTicket = 1;
        uint winnersIdx = 0;
        bool done;
        for (uint idx = 0; idx < s_bets.length; idx++) {
            /*
            if (winTickets[0] >= curTicket  &&  winTickets[0] < curTicket + s_bets[idx].tickets) {
                winners[0] = s_bets[idx].player;
                winnersIdx++;
                if (winnersIdx > 2) break;
            }
            if (winTickets[1] >= curTicket  &&  winTickets[1] < curTicket + s_bets[idx].tickets) {
                winners[1] = s_bets[idx].player;
                winnersIdx++;
                if (winnersIdx > 2) break;
            }
            if (winTickets[2] >= curTicket  &&  winTickets[2] < curTicket + s_bets[idx].tickets) {
                winners[2] = s_bets[idx].player;
                winnersIdx++;
                if (winnersIdx > 2) break;
            }
            */
            for (uint prize = 0; prize < NUM_WINNERS; prize++) {
                if (
                    winTickets[prize] >= curTicket &&
                    winTickets[prize] < curTicket + s_bets[idx].tickets
                ) {
                    winners[prize] = s_bets[idx].player;
                    winnersIdx++;
                    if (winnersIdx > NUM_WINNERS-1) {
                        done = true;
                        break;
                    }
                }
            }
            if (done) break;
            curTicket += s_bets[idx].tickets;
        }
        
        return winners;
    }

}
