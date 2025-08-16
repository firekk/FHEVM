import { expect } from "chai";
import { ethers } from "hardhat";
import { FinanceDemo } from "../typechain-types";

describe("FinanceDemo", function () {
  let financeDemo: FinanceDemo;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const FinanceDemoFactory = await ethers.getContractFactory("FinanceDemo");
    financeDemo = await FinanceDemoFactory.deploy();
    await financeDemo.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner as admin", async function () {
      const userInfo = await financeDemo.getUserInfo(owner.address);
      expect(userInfo.role).to.equal(0); // Admin
      expect(userInfo.balance).to.equal(0);
    });
  });

  describe("User Registration", function () {
    it("Should register a new user", async function () {
      const initialBalance = ethers.parseEther("100");
      const encryptedProfile = ethers.id("Test Profile");

      await financeDemo.registerUser(addr1.address, initialBalance, encryptedProfile);

      const userInfo = await financeDemo.getUserInfo(addr1.address);
      expect(userInfo.role).to.equal(1); // User
      expect(userInfo.balance).to.equal(initialBalance);
    });

    it("Should reject duplicate registration", async function () {
      const initialBalance = ethers.parseEther("100");
      const encryptedProfile = ethers.id("Test Profile");

      await financeDemo.registerUser(addr1.address, initialBalance, encryptedProfile);
      await expect(financeDemo.registerUser(addr1.address, initialBalance, encryptedProfile))
        .to.be.revertedWith("User already exists");
    });

    it("Should only allow admin to register users", async function () {
      const initialBalance = ethers.parseEther("100");
      const encryptedProfile = ethers.id("Test Profile");
      
      await expect(financeDemo.connect(addr1).registerUser(addr1.address, initialBalance, encryptedProfile))
        .to.be.revertedWith("Only admin");
    });
  });

  describe("Deposit", function () {
    it("Should allow deposit", async function () {
      const amount = ethers.parseEther("10");
      const encryptedData = ethers.id("Deposit Data");

      await expect(financeDemo.deposit(amount, encryptedData))
        .to.emit(financeDemo, "Deposited")
        .withArgs(owner.address, amount);

      const userInfo = await financeDemo.getUserInfo(owner.address);
      expect(userInfo.balance).to.equal(amount);
    });

    it("Should reject zero deposit", async function () {
      const amount = 0;
      const encryptedData = ethers.id("Deposit Data");
      await expect(financeDemo.deposit(amount, encryptedData)).to.be.revertedWith("Amount must be positive");
    });
  });

  describe("Withdrawal", function () {
    beforeEach(async function () {
      // Deposit some funds first
      const amount = ethers.parseEther("100");
      const encryptedData = ethers.id("Initial Deposit");
      await financeDemo.deposit(amount, encryptedData);
    });

    it("Should allow withdrawal", async function () {
      const amount = ethers.parseEther("30");
      const encryptedData = ethers.id("Withdrawal Data");

      await expect(financeDemo.withdraw(amount, encryptedData))
        .to.emit(financeDemo, "Withdrawn")
        .withArgs(owner.address, amount);

      const userInfo = await financeDemo.getUserInfo(owner.address);
      expect(userInfo.balance).to.equal(ethers.parseEther("70"));
    });

    it("Should reject withdrawal of zero amount", async function () {
      const amount = 0;
      const encryptedData = ethers.id("Withdrawal Data");
      await expect(financeDemo.withdraw(amount, encryptedData)).to.be.revertedWith("Amount must be positive");
    });

    it("Should reject insufficient balance", async function () {
      const amount = ethers.parseEther("150");
      const encryptedData = ethers.id("Withdrawal Data");
      await expect(financeDemo.withdraw(amount, encryptedData)).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Transfer", function () {
    beforeEach(async function () {
      // Deposit some funds first
      const amount = ethers.parseEther("100");
      const encryptedData = ethers.id("Initial Deposit");
      await financeDemo.deposit(amount, encryptedData);
      
      // Register recipient
      const initialBalance = ethers.parseEther("50");
      const encryptedProfile = ethers.id("Recipient");
      await financeDemo.registerUser(addr1.address, initialBalance, encryptedProfile);
    });

    it("Should allow transfer", async function () {
      const amount = ethers.parseEther("25");
      const encryptedData = ethers.id("Transfer Data");

      await expect(financeDemo.transfer(addr1.address, amount, encryptedData))
        .to.emit(financeDemo, "Transferred")
        .withArgs(owner.address, addr1.address, amount);

      const ownerInfo = await financeDemo.getUserInfo(owner.address);
      const recipientInfo = await financeDemo.getUserInfo(addr1.address);

      expect(ownerInfo.balance).to.equal(ethers.parseEther("75"));
      expect(recipientInfo.balance).to.equal(ethers.parseEther("75"));
    });

    it("Should reject transfer to zero address", async function () {
      const amount = ethers.parseEther("10");
      const encryptedData = ethers.id("Transfer Data");
      await expect(financeDemo.transfer(ethers.ZeroAddress, amount, encryptedData))
        .to.be.revertedWith("Invalid address");
    });

    it("Should reject transfer of zero amount", async function () {
      const amount = 0;
      const encryptedData = ethers.id("Transfer Data");
      await expect(financeDemo.transfer(addr1.address, amount, encryptedData)).to.be.revertedWith("Amount must be positive");
    });

    it("Should reject insufficient balance", async function () {
      const amount = ethers.parseEther("150");
      const encryptedData = ethers.id("Transfer Data");
      await expect(financeDemo.transfer(addr1.address, amount, encryptedData)).to.be.revertedWith("Insufficient balance");
    });

    it("Should reject transfer to non-existent user", async function () {
      const amount = ethers.parseEther("10");
      const encryptedData = ethers.id("Transfer Data");
      await expect(financeDemo.transfer(addr2.address, amount, encryptedData)).to.be.revertedWith("Recipient not exists");
    });
  });

  describe("Profile Update", function () {
    it("Should update encrypted profile", async function () {
      const newProfile = ethers.id("Updated Profile");
      
      await expect(financeDemo.updateEncryptedProfile(newProfile))
        .to.emit(financeDemo, "ProfileUpdated")
        .withArgs(owner.address, newProfile);

      const userInfo = await financeDemo.getUserInfo(owner.address);
      expect(userInfo.encryptedProfile).to.equal(newProfile);
    });
  });

  describe("Transaction History", function () {
    beforeEach(async function () {
      // Create some transactions - need to register addr1 first
      const initialBalance = ethers.parseEther("50");
      const encryptedProfile = ethers.id("Recipient");
      await financeDemo.registerUser(addr1.address, initialBalance, encryptedProfile);
      
      // Create some transactions
      await financeDemo.deposit(ethers.parseEther("100"), ethers.id("Deposit1"));
      await financeDemo.withdraw(ethers.parseEther("30"), ethers.id("Withdrawal1"));
      await financeDemo.transfer(addr1.address, ethers.parseEther("20"), ethers.id("Transfer1"));
    });

    it("Should return transaction history", async function () {
      const txIds = await financeDemo.getTransactionHistory();
      expect(txIds.length).to.greaterThanOrEqual(3);
    });

    it("Should return transaction details", async function () {
      const txIds = await financeDemo.getTransactionHistory();
      const txId = txIds[0];
      
      const details = await financeDemo.getTransactionDetails(txId);
      expect(details.from).to.not.equal(ethers.ZeroAddress);
      expect(details.amount).to.not.equal(0);
    });
  });
});