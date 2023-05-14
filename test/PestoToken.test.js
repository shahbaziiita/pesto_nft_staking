const { expect } = require('chai');
const { ethers } = require("hardhat");

// Start test block
describe('PestoToken', function () {
  before(async function () {
    this.PestoToken = await ethers.getContractFactory('PestoToken');
  });

  beforeEach(async function () {
    this.pestoToken = await this.PestoToken.deploy();
    await this.pestoToken.deployed();

    this.decimals = await this.pestoToken.decimals();

    const signers = await ethers.getSigners();

    this.ownerAddress = signers[0].address;
    this.recipientAddress = signers[1].address;

    this.signerContract = this.pestoToken.connect(signers[1]);
  });

  // Test cases
  it('Creates a token with a name', async function () {
    expect(await this.pestoToken.name()).to.exist;
    // expect(await this.pestoToken.name()).to.equal('pestoToken');
  });

  it('Creates a token with a symbol', async function () {
    expect(await this.pestoToken.symbol()).to.exist;
    // expect(await this.pestoToken.symbol()).to.equal('PESTO');
  });

  it('Has a valid decimal', async function () {
    expect((await this.pestoToken.decimals()).toString()).to.equal('18');
  })

  it('Has a valid total supply', async function () {
    const expectedSupply = ethers.utils.parseUnits('1000000', this.decimals);
    expect((await this.pestoToken.totalSupply()).toString()).to.equal(expectedSupply);
  });

  it('Is able to query account balances', async function () {
    const ownerBalance = await this.pestoToken.balanceOf(this.ownerAddress);
    expect(await this.pestoToken.balanceOf(this.ownerAddress)).to.equal(ownerBalance);
  });

  it('Transfers the right amount of tokens to/from an account', async function () {
    const transferAmount = 1000;
    await expect(this.pestoToken.transfer(this.recipientAddress, transferAmount)).to.changeTokenBalances(
        this.pestoToken,
        [this.ownerAddress, this.recipientAddress],
        [-transferAmount, transferAmount]
      );
  });

  it('Emits a transfer event with the right arguments', async function () {
    const transferAmount = 100000;
    await expect(this.pestoToken.transfer(this.recipientAddress, ethers.utils.parseUnits(transferAmount.toString(), this.decimals)))
        .to.emit(this.pestoToken, "Transfer")
        .withArgs(this.ownerAddress, this.recipientAddress, ethers.utils.parseUnits(transferAmount.toString(), this.decimals))
  });

  it('Allows for allowance approvals and queries', async function () {
    const approveAmount = 10000;
    await this.signerContract.approve(this.ownerAddress, ethers.utils.parseUnits(approveAmount.toString(), this.decimals));
    expect((await this.pestoToken.allowance(this.recipientAddress, this.ownerAddress))).to.equal(ethers.utils.parseUnits(approveAmount.toString(), this.decimals));
  });

  it('Emits an approval event with the right arguments', async function () {
    const approveAmount = 10000;
    await expect(this.signerContract.approve(this.ownerAddress, ethers.utils.parseUnits(approveAmount.toString(), this.decimals)))
        .to.emit(this.pestoToken, "Approval")
        .withArgs(this.recipientAddress, this.ownerAddress, ethers.utils.parseUnits(approveAmount.toString(), this.decimals))
  }); 

});