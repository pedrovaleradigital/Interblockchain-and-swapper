// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MiPrimerNft is
    Initializable,
    PausableUpgradeable,
    ERC721Upgradeable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    OwnableUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    using Strings for uint256;
    bool[30] nftIdsSaled;
    uint256 nftTotalSaled;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize() public initializer {
        __ERC721_init("PC2 PEDRO VALERA NFT", "MPRNFT");
        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        nftTotalSaled = 0;
    }

    function _baseURI() internal pure override returns (string memory) {
        string memory ipfsCID = "QmYZsLtuKRHv58vNDPYQK1rAgfHe8oUun8bGB3sK1Frt9L";
        return string(abi.encodePacked("ipfs://", ipfsCID, "/"));
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory baseURI = _baseURI();
        return
           ( bytes(baseURI).length > 0
                ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json"))
                : "" );
    }

    function safeMint(address to, uint256 id) public onlyRole(MINTER_ROLE) {
        // Se hacen dos validaciones
        // 1 - Dicho id no haya sido acuñado antes
        // esta validacion ya existe en el contrato padre

        // 2 - Id se encuentre en el rango inclusivo de 1 a 30
        //      * Mensaje de error: "Public Sale: id must be between 1 and 30"

        //require((id > 0) && (id <= 30), "Public Sale: id must be between 1 and 30");
        require((id > 0) && (id <= 30), "NFT: Token id out of range");

        nftIdsSaled[id - 1] = true;
        nftTotalSaled++;

        _safeMint(to, id);
    }

    // Contratos actualizables tipo uups.
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    // The following functions are overrides required by Solidity.
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

/*

MiPrimerNft Proxy Address: 0x774D1dBc46F9040aB9950337Fd6Bd49138cD5EF0
MiPrimerNft Impl Address: 0x051d694664479A20cFF90C77b45719a5F933a25e

https://mumbai.polygonscan.com/address/0x774D1dBc46F9040aB9950337Fd6Bd49138cD5EF0

https://testnets.opensea.io/es/collection/pc2-pedro-valera-nft

*/