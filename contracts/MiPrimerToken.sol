// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract MyTokenMiPrimerToken is 
        Initializable, 
        ERC20Upgradeable, 
        AccessControlUpgradeable,
        UUPSUpgradeable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize() public initializer {
        __ERC20_init("Mi Primer Token", "MPRTKN");
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        _mint(msg.sender, 1000000 * 10 ** decimals());

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(MINTER_ROLE) {}

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
/*
MyTokenMiPrimerToken Proxy Address: 0x6D2304968662A48977Cca0A6b9af72f661d6D6eD
MyTokenMiPrimerToken Impl Address: 0x6915966dFECFFe675D9feBC1D3FC3c0366b91bd3

https://goerli.etherscan.io/address/0x6D2304968662A48977Cca0A6b9af72f661d6D6eD
*/