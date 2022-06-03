// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PIFToken is ERC20, ERC20Burnable, ERC20Capped, Ownable {
    
    constructor() ERC20("Play It Forward DAO", "PIF") ERC20Capped(1_000_000_000 ether) {
        ERC20._mint(_msgSender(), 1_000_000_000 ether);
    }

    function mint(uint256 amount) external onlyOwner {
        _mint(_msgSender(), amount);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    function _mint(address account, uint256 amount) internal override(ERC20, ERC20Capped)
    {
        ERC20Capped._mint(account, amount);
    }

   
}
