// contracts/MockCCIPUsage.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { MockCCIPRouter } from "./MockCCIPRouter.sol"; // Adjust the path if necessary
import { Sender } from "./Sender.sol";
import { Receiver } from "./Receiver.sol";
import { Client } from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

contract MockCCIPUsage {
    MockCCIPRouter private mockRouter;
    Sender private ccipSender;
    Receiver private ccipReceiver;

    constructor(address _router, address _link) {
        mockRouter = MockCCIPRouter(_router);
        ccipSender = new Sender(_router, _link);
        ccipReceiver = new Receiver(_router);
    }

    function testSendMessage(
        uint64 _destinationChainSelector,
        address _receiver,
        uint256 _iterations,
        uint256 _gasLimit
    ) public returns (bytes32) {

        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](0); // Initialize as an empty array

        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(_receiver),
            data: abi.encode(_iterations),
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: _gasLimit})),
            feeToken: address(0)
        });

        // Call the ccipSend function
        bytes32 messageId = mockRouter.ccipSend(_destinationChainSelector, message);
        return messageId;
    }
}