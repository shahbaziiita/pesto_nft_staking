const { expect } = require('chai');
const { ethers } = require("hardhat");

// Start test block
describe('PestoNftToken', function () {
  before(async function () {
    this.PestoNftToken = await ethers.getContractFactory('PestoNftToken');
  });

  beforeEach(async function () {
    // deploy the contract
    this.pestoNftToken = await this.PestoNftToken.deploy();
    await this.pestoNftToken.deployed();

    // Get the contractOwner and collector address
    const signers = await ethers.getSigners();
    this.contractOwner = signers[0].address;
    this.collector = signers[1].address;

    // Get the collector contract for signing transaction with collector key
    this.collectorContract = this.pestoNftToken.connect(signers[1]);

    // Mint an initial set of NFTs from this collection
    this.initialMintCount = 3;
    this.initialMint = [];
    for (let i = 1; i <= this.initialMintCount; i++) { // tokenId to start at 1
        await this.pestoNftToken.mintCollectionNFT(this.contractOwner, i);
        this.initialMint.push(i.toString());
    }
  });

  // Test cases
  it('Creates a token collection with a name', async function () {
    expect(await this.pestoNftToken.name()).to.exist;
    // expect(await this.pestoNftToken.name()).to.equal('PestoNftToken');
  });

  it('Creates a token collection with a symbol', async function () {
    expect(await this.pestoNftToken.symbol()).to.exist;
    // expect(await this.pestoNftToken.symbol()).to.equal('NONFUN');
  });

  it('Mints initial set of NFTs from collection to contractOwner', async function () {
    for (let i = 0; i < this.initialMint.length; i++) {
        expect(await this.pestoNftToken.ownerOf(this.initialMint[i])).to.equal(this.contractOwner);
    }
  });

  it('Is able to query the NFT balances of an address', async function () {
    expect(await this.pestoNftToken.balanceOf(this.contractOwner)).to.equal(this.initialMint.length);
  });

  it('Is able to mint new NFTs to the collection to collector', async function () {
    let tokenId = (this.initialMint.length+1).toString();
    await this.pestoNftToken.mintCollectionNFT(this.collector,tokenId);
    expect(await this.pestoNftToken.ownerOf(tokenId)).to.equal(this.collector);
  });

  it('Emits a transfer event for newly minted NFTs', async function () {
    let tokenId = (this.initialMint.length+1).toString();
    await expect(this.pestoNftToken.mintCollectionNFT(this.contractOwner, tokenId))
    .to.emit(this.pestoNftToken, "Transfer")
    .withArgs("0x0000000000000000000000000000000000000000", this.contractOwner, tokenId); //NFTs are minted from zero address
  });

  it('Is able to transfer NFTs to another wallet when called by owner', async function () {
    let tokenId = this.initialMint[0].toString();
    await this.pestoNftToken["safeTransferFrom(address,address,uint256)"](this.contractOwner, this.collector, tokenId);
    expect(await this.pestoNftToken.ownerOf(tokenId)).to.equal(this.collector);
  });

  it('Emits a Transfer event when transferring a NFT', async function () {
    let tokenId = this.initialMint[0].toString();
    await expect(this.pestoNftToken["safeTransferFrom(address,address,uint256)"](this.contractOwner, this.collector, tokenId))
    .to.emit(this.pestoNftToken, "Transfer")
    .withArgs(this.contractOwner, this.collector, tokenId);
  });

  it('Only allows contractOwner to mint NFTs', async function () {
    await expect (this.collectorContract.mintCollectionNFT(this.collector, "100")).to.be.reverted;
  });

});