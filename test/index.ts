import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { PIFToken__factory,PIFToken } from "../typechain-types";

describe("PIFToken", function () {

  let pifToken: PIFToken;
	let owner: SignerWithAddress;
	let addr1: SignerWithAddress;
	let addr2: SignerWithAddress
	let addrs: SignerWithAddress[];

	before(async function () {

		[owner, addr1, addr2, ...addrs] = await ethers.getSigners();

	});

  beforeEach(async function () {		
    const pifToken__factory = (await ethers.getContractFactory(
			"PIFToken", owner
		)) as PIFToken__factory;
		pifToken = await pifToken__factory.deploy()
	});


  describe("Deployment", function () {

		it("Should assign the total supply of tokens to the owner", async function () {
			const ownerBalance = await pifToken.balanceOf(owner.address);
			expect(await pifToken.totalSupply()).to.equal(ownerBalance);
		});
	});

  describe("Transfer Token", function () {
		it("Should transfer tokens between accounts", async function () {
			// Transfer 50 tokens from owner to addr1
			await pifToken.transfer(addr1.address, 50);
			const addr1Balance = await pifToken.balanceOf(addr1.address);
			expect(addr1Balance).to.equal(50);

			// Transfer 50 tokens from addr1 to addr2
			await pifToken.connect(addr1).transfer(addr2.address, 50);
			const addr2Balance = await pifToken.balanceOf(addr2.address);
			expect(addr2Balance).to.equal(50);
		});

		it("Should fail if sender doesn’t have enough tokens", async function () {
			const initialOwnerBalance = await pifToken.balanceOf(owner.address);

			// Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
			// `require` will evaluate false and revert the transaction.
			await expect(
				pifToken.connect(addr1).transfer(owner.address, 1)
			).to.be.revertedWith("ERC20: transfer amount exceeds balance");

			// Owner balance shouldn't have changed.
			expect(await pifToken.balanceOf(owner.address)).to.equal(
				initialOwnerBalance
			);
		});

		it("Should update balances after transfers", async function () {
			const initialOwnerBalance = await pifToken.balanceOf(owner.address);

			// Transfer 100 tokens from owner to addr1.
			await pifToken.transfer(addr1.address, 100);

			// Transfer another 50 tokens from owner to addr2.
			await pifToken.transfer(addr2.address, 50);

			// Check balances.
			const finalOwnerBalance = await pifToken.balanceOf(owner.address);
			expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(150));

			const addr1Balance = await pifToken.balanceOf(addr1.address);
			expect(addr1Balance).to.equal(100);

			const addr2Balance = await pifToken.balanceOf(addr2.address);
			expect(addr2Balance).to.equal(50);
		});
	});

  describe("Allowance", function () {

    it("Should increase allowance, and success tarnsfer ", async function () {
      const initialOwnerBalance = await pifToken.balanceOf(owner.address);

      // give allowanance to spend 100 token from owner 1 to address 1
      await pifToken.increaseAllowance(addr1.address,100)

      //check allowance
      const allowance = await pifToken.allowance(owner.address,addr1.address);
      expect(allowance).to.equal(100);

      //transfer 100 token onwer to address 1
      await pifToken.connect(addr1).transferFrom(owner.address,addr1.address,100);

      // transfer will fail because allowance already used
      await expect(pifToken.connect(addr1).transferFrom(owner.address,addr1.address,10)).to.be.revertedWith("ERC20: transfer amount exceeds allowance");

      //check allowance after transfer
      const allowanceAfter = await pifToken.allowance(owner.address,addr1.address);
      expect(allowanceAfter).to.equal(0);
    
		});

    it("Should decearse allowance, and success tarnsfer ", async function () {
      const initialOwnerBalance = await pifToken.balanceOf(owner.address);

      // give allowanance to spend 100 token from owner 1 to address 1
      await pifToken.increaseAllowance(addr1.address,100)

      //check allowance
      const allowance = await pifToken.allowance(owner.address,addr1.address);
      expect(allowance).to.equal(100);

      // decrease allowamce 50
      await pifToken.decreaseAllowance(addr1.address,25)
      const allowance2 = await pifToken.allowance(owner.address,addr1.address);
      expect(allowance2).to.equal(75);
    

      //transfer 60 token onwer to address 1
      await pifToken.connect(addr1).transferFrom(owner.address,addr1.address,60);

      //check allowance after transfer
      const allowance3 = await pifToken.allowance(owner.address,addr1.address);
      expect(allowance3).to.equal(15);

      // decrease allowamce 50
      await pifToken.decreaseAllowance(addr1.address,15)
      const allowance4 = await pifToken.allowance(owner.address,addr1.address);
      expect(allowance4).to.equal(0);
   
    
		});

	});

  describe("Hardcap, Burn and Minting", function () {
		it("Should failed minting bacause exceeded", async function () {
      // Try to mint 1 token, will be failed because cap exceeded
      await expect(pifToken["mint(uint256)"](1)).to.be.revertedWith("ERC20Capped: cap exceeded");
		});

    it("Should success minting after burn", async function () {

      const initialtotalSupply= await pifToken.totalSupply();
      
      // burn after that check total supply
      await pifToken.burn(100);
      expect(await pifToken.totalSupply()).to.equal(initialtotalSupply.sub(100));

      
      // mint 75 token using owner address, after that check total suply
      await pifToken["mint(uint256)"](75);
      expect(await pifToken.totalSupply()).to.equal(initialtotalSupply.sub(100).add(75));

      // mint should be failed because caller not owner
      await expect(pifToken.connect(addr1)["mint(uint256)"](25)).to.be.revertedWith("Ownable: caller is not the owne");

      // mint 25 token using owner address, after that check total suply
      await pifToken["mint(address,uint256)"](addr1.address,25);
      expect(await pifToken.totalSupply()).to.equal(initialtotalSupply);

      // Try to mint 1 token, will be failed because cap exceeded
      await expect(pifToken["mint(uint256)"](1)).to.be.revertedWith("ERC20Capped: cap exceeded");
		});

    it("Should success minting after burnform", async function () {

      const initialtotalSupply = await pifToken.totalSupply();

      // tranfet token to addres 1
      await pifToken.transfer(addr1.address, 50);
			expect(await pifToken.balanceOf(addr1.address)).to.equal(50);

      // give allowanance to spend 30 token from address 1 to address 2
      await pifToken.connect(addr1).increaseAllowance(addr2.address,30)

      //address 2 burn 30 token from address 1
      await pifToken.connect(addr2).burnFrom(addr1.address,30);

      // chack total suuply
      expect(await pifToken.totalSupply()).to.equal(initialtotalSupply.sub(30));

      // check balance address 1
      expect(await pifToken.balanceOf(addr1.address)).to.equal(20);

      // owner mint token
      await pifToken["mint(address,uint256)"](addr1.address,20);
      await pifToken["mint(address,uint256)"](addr2.address,10);

      // check balance
      expect(await pifToken.balanceOf(addr1.address)).to.equal(40);
      expect(await pifToken.balanceOf(addr2.address)).to.equal(10);
      // checkk total suuply
      expect(await pifToken.totalSupply()).to.equal(initialtotalSupply);
    
		});

	});


});
