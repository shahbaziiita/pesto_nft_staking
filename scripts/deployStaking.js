// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");

async function main() {

  // Get the contract owner
  const contractOwner = await ethers.getSigners();
  console.log(`Deploying contract from: ${contractOwner[0].address}`);

  // Hardhat helper to get the ethers contractFactory object
  const Staking = await ethers.getContractFactory('Staking');

  // Deploy the contract
  console.log('Deploying Staking Contract...');
  // here pick random NFT and ERC20 contract address
  const erc20Address =  "0x12970e6868f88f6557b76120662c1b3e50a646bf";
  const nftAddress = "0xcd3b766ccdd6ae721141f452c550ca635964ce71"
  const staking = await Staking.deploy(nftAddress,erc20Address, 1);
  await staking.deployed();
  console.log(`PestoToken deployed to: ${staking.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });