// SPDX-License-Identifier:MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract Staking is IERC721Receiver, Ownable, ReentrancyGuard {

    using SafeMath for uint256;

    IERC721 public nftToken;
    IERC20 public erc20Token;

    uint256 public rewardPerBlock;

    struct stake {
        address owner;
        uint256 stakedFromBlock;
    }

    // TokenID => Stake
    mapping(uint256 => stake) public tokenMap;

    event NftStaked(address indexed staker, uint256 tokenId, uint256 blockNumber);
    event NftUnStaked(address indexed staker, uint256 tokenId, uint256 blockNumber);
    event StakePayout(address indexed staker, uint256 tokenId, uint256 stakeAmount, uint256 fromBlock, uint256 toBlock);
    event StakeRewardUpdated(uint256 rewardPerBlock);

    modifier onlyStaker(uint256 tokenId) {
        // require that this contract has the NFT
        require(nftToken.ownerOf(tokenId) == address(this), "Contract is not owner of this NFT");

        // require that this token is staked
        require(tokenMap[tokenId].stakedFromBlock != 0, "Token is not staked");

        // require that msg.sender is the owner of this nft
        require(tokenMap[tokenId].owner == msg.sender, "Caller is not NFT stake owner");

        _;
    }

    modifier requireTimeElapsed(uint256 tokenId) {
        // require that some time has elapsed (IE you can not stake and unstake in the same block)
        require(
            tokenMap[tokenId].stakedFromBlock < block.number,
            "requireTimeElapsed: Can not stake/unStake/claim in same block"
        );
        _;
    }

     constructor(
        IERC721 _nftToken,
        IERC20 _erc20Token,
        uint256 _rewardPerBlock
    ) {
        nftToken = _nftToken;
        erc20Token = _erc20Token;
        rewardPerBlock = _rewardPerBlock;

        emit StakeRewardUpdated(rewardPerBlock);
    }

    /**
     * Always returns `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function stakeNFT(uint256 tokenId) public nonReentrant returns (bool) {
        // require this token is not already staked
        require(tokenMap[tokenId].stakedFromBlock == 0, "Token is already staked");

        // require this token is not already owned by this contract
        require(nftToken.ownerOf(tokenId) != address(this), "Token is already staked in this contract");

        // take possession of the NFT
        nftToken.safeTransferFrom(msg.sender, address(this), tokenId);

        // after possession, check that owner of NFT is smart contract now
        require(nftToken.ownerOf(tokenId) == address(this), "Failed to take possession of NFT");

        // start the staking from this block.
        tokenMap[tokenId].stakedFromBlock = block.number;
        tokenMap[tokenId].owner = msg.sender;

        emit NftStaked(msg.sender, tokenId, block.number);

        return true;
    }

    function unStakeNFT(uint256 tokenId) public nonReentrant onlyStaker(tokenId) requireTimeElapsed(tokenId) returns (bool) {
        // payout stake, this should be safe as the function is non-reentrant
        payoutStake(tokenId);

        // delete stake record, effectively unstaking it
        delete tokenMap[tokenId];

        // return token
        nftToken.safeTransferFrom(address(this), msg.sender, tokenId);

        emit NftUnStaked(msg.sender, tokenId, block.number);

        return true;
    }


     function payoutStake(uint256 tokenId) internal {
        require(tokenMap[tokenId].stakedFromBlock > 0, "Can not stake from block 0");

        // earned amount is difference between the stake start block, current block multiplied by stake amount
        uint256 timeStaked = getTimeStaked(tokenId).sub(1); // don't pay for the tx block of withdrawl
        uint256 payout = timeStaked.mul(rewardPerBlock);

        // If contract does not have enough tokens to pay out, return the NFT without payment
        // This prevent a NFT being locked in the contract when empty
        if (erc20Token.balanceOf(address(this)) < payout) {
            emit StakePayout(msg.sender, tokenId, 0, tokenMap[tokenId].stakedFromBlock, block.number);
            return;
        }

        // payout stake
        erc20Token.transfer(tokenMap[tokenId].owner, payout);

        emit StakePayout(msg.sender, tokenId, payout, tokenMap[tokenId].stakedFromBlock, block.number);
    }

     function getTimeStaked(uint256 tokenId) internal view returns (uint256) {
        if (tokenMap[tokenId].stakedFromBlock == 0) {
            return 0;
        }

        return block.number.sub(tokenMap[tokenId].stakedFromBlock);
    }

    function getReward(uint256 tokenId) public view returns (uint256) {

        require(tokenMap[tokenId].stakedFromBlock > 0, "Can not stake from block 0");

        // Reward should be viewed only by NFT owne
         require(tokenMap[tokenId].owner == msg.sender, "Reward should be viewed only by NFT owner");

        // earned amount is difference between the stake start block, current block multiplied by stake amount
        uint256 timeStaked = getTimeStaked(tokenId).sub(1); // don't pay for the tx block of withdrawl
        uint256 payout = timeStaked.mul(rewardPerBlock);

        return payout;
    }

    function claimRewards(uint256 tokenId) external nonReentrant {
        // Reward should be awarded only by NFT owner
        require(tokenMap[tokenId].owner == msg.sender, "Reward should be awarded only to NFT owner");
        // This 'payout first' should be safe as the function is nonReentrant
        payoutStake(tokenId);

        // update tokenMap with a new block number
        tokenMap[tokenId].stakedFromBlock = block.number;
        
    }
}