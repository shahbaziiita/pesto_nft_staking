# NFT Staking Project

This project is a staking Project in which user stake ERC721 NFT and get reward as ERC20 token.

Here we have used hardhat for deploying, testing and creating smart contracts.

Implementation Details:

1. First we created ERC20 token called PestoToken in Pesto.sol contract file. This token is used as a reward when we stake NFT.

2. After this, we created ERC721 NFT called PestoNftToken in PesroNft.sol contract file. This is the NFT which we can stake. 

3. We will deploy these contracts to localhost or any other network using below command:

npx hardhat run --network <your-network> scripts/deploy.js   // This will deploy Pesto.sol to any ether network
npx hardhat run --network <your-network> scripts/deployNft.js  // This will deploy Pesto.sol to any ether network

4. After this we get the contract address of ERC20 and ERC721 tokens. We will use these addresses in Staking contract while calling deploying.

5. Now we will deploy Staking.sol contract using deployStaking.js file. Here in #line21 , used the contract addresses you got while running npm command in point#3. Also we will need to give rewards per block. 

6. Now we can use various functions in Staking.sol for staking, unstaking, getRewards, claimRewards. 

7. In staking, user can stake ERC721 NFT and get the reward of ERC20 token based on payout calculaation. 

Payout rewards = (unstaking block number - staking block number) * rewards per block 


8. For testing these contracts, we will use below command to test:
npx hardhat test




