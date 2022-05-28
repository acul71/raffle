// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
// import "hardhat/console.sol";

error Raffle__SendMoreToEnterRaffle();
error Raffle__RaffleNotOpen();
error Raffle__UpkeepNotNeeded();
error Raffle__TransferFailed();
error Raffle__RandomTicketsNotUnique();

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
    enum RaffleState {
        Open,
        Calculating
    }

    uint16 public constant REQUEST_CONFIRMATIONS = 3;
    // Request 3 random numbers to VRF chainlink oracle
    uint16 public constant NUM_WORDS = 1;
    // This ruffle have 3 winners
    uint8 public constant NUM_WINNERS = 3;
    // This are the quotes for each one
    uint8 public constant WINNER1_QUOTE = 80;
    uint8 public constant WINNER2_QUOTE = 15;
    uint8 public constant WINNER3_QUOTE = 5;
    // Number of tickets to select
    uint8 public constant NUM_WIN_TICKETS = 3;
    // Number of saved raffle rounds winners
    uint8 public constant NUM_SAVED_WINNER_ROUNDS = 10;

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
    uint public s_prizePool;

    // to Store raffle game result
    // It's like a circoular struct
    // It's implemented as an array of NUM_SAVED_WINNER_ROUNDS with s_recentWinnersIdx index
    // Ex: With s_recentWinnersIdx=2 we got the order 2,3,4,5,6,7,8,9,0,1
    // 2 is the last, 1 is the first
    struct recentWinner {
        address player1;
        address player2;
        address player3;
        uint prizePool;
        uint raffleTime;
    }
    recentWinner[NUM_SAVED_WINNER_ROUNDS] public s_recentWinners;
    uint8 public s_recentWinnersIdx;
    uint256 public s_raffle_round = 1;

    uint256 public totTickets;

    event RaffleEnter(address indexed player, uint indexed tickets);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(recentWinner indexed s_recentWinner);

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
        s_prizePool += msg.value;
        emit RaffleEnter(msg.sender, tickets);
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
        override
        returns (
            //external
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
    ) external override {
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
        uint256[NUM_WIN_TICKETS] memory randTickets = uniqueTickets(
            randomWords[0],
            NUM_WIN_TICKETS,
            totTickets
        );

        // Select NUM_WINNERS winners
        address[NUM_WINNERS] memory winners = findWinners(randTickets);

        // Pay the winners
        uint8[NUM_WINNERS] memory quotes = [
            WINNER1_QUOTE,
            WINNER3_QUOTE,
            WINNER2_QUOTE
        ];
        for (uint idx = 0; idx < NUM_WINNERS; idx++) {
            if (winners[idx] == address(0)) break;
            address payable winner = payable(winners[idx]);
            (bool success, ) = winner.call{value: s_prizePool * quotes[idx]}(
                ""
            );
            if (!success) {
                revert Raffle__TransferFailed();
            }
        }

        s_lastTimeStamp = block.timestamp;

        // Store raffle game result
        storeGameResult(winners, s_prizePool, s_lastTimeStamp);

        s_raffle_round += 1;
        s_prizePool = 0;
        s_raffleState = RaffleState.Open;

        emit WinnerPicked(
            recentWinner(
                winners[0],
                winners[1],
                winners[2],
                s_prizePool,
                s_lastTimeStamp
            )
        );
    }

    /*
      NOTE review this function if you want to react to NUM_WINNER param (player1....)
    */
    function storeGameResult(
        address[NUM_WINNERS] memory winners,
        uint _prizePool,
        uint _raffleTime
    ) internal {
        s_recentWinnersIdx = s_recentWinnersIdx == 0
            ? s_recentWinnersIdx = NUM_SAVED_WINNER_ROUNDS - 1
            : s_recentWinnersIdx - 1;

        s_recentWinners[s_recentWinnersIdx] = recentWinner(
            winners[0],
            winners[1],
            winners[2],
            _prizePool,
            _raffleTime
        );
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
        totTickets += tickets;
    }

    //function removeBets() public {
    function removeBets() internal {
        delete s_bets;
    }

    function numPlayers() public view returns (uint totPlayers) {
        return s_bets.length;
    }

    function getBets() public view returns (playerTicket[] memory) {
        return s_bets;
    }

    function getRecentWinners()
        public
        view
        returns (recentWinner[NUM_SAVED_WINNER_ROUNDS] memory)
    {
        return s_recentWinners;
    }

    // Returns NUM_WINNERS random tickets (unique in the range 1..totTickets)
    function uniqueTickets(
        uint256 seed,
        uint8 numWinTickets,
        uint256 _totTickets
    )
        public
        pure
        returns (
            // internal
            uint256[NUM_WINNERS] memory randTickets
        )
    {
        uint256 randNum;
        uint256 i;
        bool unique;
        randTickets[0] = uint8((seed % _totTickets) + 1);
        uint8 curTicket = 1;
        while (curTicket < numWinTickets) {
            i += 1;
            randNum = uint256(
                (uint256(keccak256(abi.encode(seed, i))) % _totTickets) + 1
            );
            unique = true;
            for (uint8 idx = 0; idx < NUM_WINNERS; idx++) {
                if (randNum == randTickets[idx]) {
                    unique = false;
                    break;
                }
            }
            if (unique) {
                randTickets[curTicket] = randNum;
                curTicket += 1;
            }
        }
        return randTickets;
    }

    function findWinners(uint256[NUM_WINNERS] memory winTickets)
        internal
        view
        returns (address[NUM_WINNERS] memory winners)
    {
        uint curTicket = 1;
        uint winnersIdx = 0;
        bool done;
        for (uint idx = 0; idx < s_bets.length; idx++) {
            for (uint prize = 0; prize < NUM_WINNERS; prize++) {
                if (
                    winTickets[prize] >= curTicket &&
                    winTickets[prize] < curTicket + s_bets[idx].tickets
                ) {
                    winners[prize] = s_bets[idx].player;
                    winnersIdx++;
                    if (winnersIdx > NUM_WINNERS - 1) {
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
