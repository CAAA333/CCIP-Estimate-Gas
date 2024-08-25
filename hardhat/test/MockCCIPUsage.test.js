const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MockCCIPUsage", function () {
  let deployer, mockRouter, ccipSender, ccipReceiver;

  beforeEach(async function () {
    const fixture = await deployFixture();
    deployer = fixture.deployer;
    mockRouter = fixture.mockRouter;
    ccipSender = fixture.ccipSender;
    ccipReceiver = fixture.ccipReceiver;
  });

  async function deployFixture() {
    const [deployer] = await ethers.getSigners();

    // Deploy MockCCIPRouter
    const MockCCIPRouterFactory = await ethers.getContractFactory(
      "MockCCIPRouter"
    );
    const mockRouter = await MockCCIPRouterFactory.deploy();

    console.log("MockCCIPRouter deployed to:", mockRouter.address);

    await mockRouter.deployed();
    console.log("MockCCIPRouter deployed successfully");

    // Deploy CCIP Sender contract
    const CCIPSenderFactory = await ethers.getContractFactory("Sender");
    const ccipSender = await CCIPSenderFactory.deploy(mockRouter.address);

    console.log("CCIPSender deployed to:", ccipSender.address);

    await ccipSender.deployed();
    console.log("CCIPSender deployed successfully");

    // Deploy CCIP Receiver contract
    const CCIPReceiverFactory = await ethers.getContractFactory("Receiver");
    const ccipReceiver = await CCIPReceiverFactory.deploy(mockRouter.address);

    console.log("CCIPReceiver deployed to:", ccipReceiver.address);

    await ccipReceiver.deployed();
    console.log("CCIPReceiver deployed successfully");

    return { deployer, mockRouter, ccipSender, ccipReceiver };
  }

  it("Should deploy contracts and prepare for tests", async function () {
    const { mockRouter } = await deployFixture();

    expect(mockRouter.address).to.be.properAddress;
  });

  it("Should deploy CCIP Sender and Receiver contracts successfully", async function () {
    const { ccipSender, ccipReceiver } = await deployFixture();

    expect(ccipSender.address).to.be.properAddress;
    expect(ccipReceiver.address).to.be.properAddress;
  });

  it("Should send a CCIP message and parse the MsgExecuted event to get gas used", async function () {
    const { ccipSender, mockRouter, ccipReceiver } = await deployFixture();

    // Set up some dummy data for sending the message
    const destinationChainSelector = 1; // Example chain selector
    const receiverAddress = ccipReceiver.address;
    const iterations = 5;
    const gasLimit = 500000;

    // Allowlist the destination chain and receiver on both Sender and Receiver contracts
    await ccipSender.allowlistDestinationChain(destinationChainSelector, true);
    await ccipReceiver.allowlistSourceChain(destinationChainSelector, true);
    await ccipReceiver.allowlistSender(ccipSender.address, true);

    // Send the message from the Sender to the Receiver via MockCCIPRouter
    const tx = await ccipSender.sendMessagePayLINK(
      destinationChainSelector,
      receiverAddress,
      iterations,
      gasLimit
    );
    const receipt = await tx.wait();

    // Parse the logs to find the MsgExecuted event and extract the gas used
    const event = receipt.events.find((event) => event.event === "MsgExecuted");
    const gasUsed = event.args[2].toString(); // The gas used is the third parameter

    console.log("Gas Used:", gasUsed);
    expect(gasUsed).to.be.a("string").and.not.equal("0");
  });
});
