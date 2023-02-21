const { expect } = require("chai");
const { ethers } = require("hardhat");
//const { time } = require("@nomicfoundation/hardhat-network-helpers");

const { getRole, deploySC, ex, pEth } = require("../utils");
//const { getRole, deploySC, deploySCNoUp, ex, verify, pEth, printAddress } = require("../utils");

const MINTER_ROLE = getRole("MINTER_ROLE");
//const BURNER_ROLE = getRole("BURNER_ROLE");

// 21 de diciembre del 2022 GMT
//var startDate = 1671580800;

//var makeBN = (num) => ethers.BigNumber.from(String(num));



describe("MI PRIMER TOKEN TESTING", function () {
  var nftContract, publicSaleContract, miPrimerTokenContract, usdc;
  var owner, gnosis, alice, bob, carl, deysi, relayer;
  
  var nftTokenName = "PC2 PEDRO VALERA NFT";
  var nftTokenSymbol = "MPRNFT";
  var nftContractName = "MiPrimerNft";

  var publicSaleContractName = "PublicSale";

  var miPrimerTokenName = "MyTokenMiPrimerToken";
  //var miPrimerTokenSymbol = "MPRTKN";
  var miPrimerTokenContractName = miPrimerTokenName;

  before(async () => {
    [owner, gnosis, alice, bob, carl, deysi,relayer] = await ethers.getSigners();
    console.log(`Owner:  ${owner.address}`);
    console.log(`Gnosis: ${gnosis.address}`);
    console.log(`Alice:  ${alice.address}`);
    console.log(`Bob:    ${bob.address}`);
    console.log(`Carl:   ${carl.address}`);
    console.log(`Deysi:  ${deysi.address}`);
  });

  // Estos dos métodos a continuación publican los contratos en cada red
  // Se usan en distintos tests de manera independiente
  // Ver ejemplo de como instanciar los contratos en deploy.js

  async function deployNftSC() {
    relayerAddress = relayer.address;
    nftContract = await deploySC(nftContractName);
    var implementation = await upgrades.erc1967.getImplementationAddress(nftContract.address);
    await ex(nftContract, "grantRole", [MINTER_ROLE, relayerAddress], "Error in Grant Role");
    //await verify(implementation, nftContractName, []);
    //await printAddress(nftContractName,nftContract.address);
  }

  async function deployMyTokenMiPrimerToken() {
    miPrimerTokenContract = await deploySC(miPrimerTokenContractName, []);
    var implementation = await upgrades.erc1967.getImplementationAddress(miPrimerTokenContract.address);
    //await verify(implementation, miPrimerTokenContractName, []);
    //await printAddress(miPrimerTokenContractName,miPrimerTokenContract.address);
  }

  async function deployPublicSaleSC() {
    publicSaleContract = await deploySC(publicSaleContractName, []);
    var implementation = await upgrades.erc1967.getImplementationAddress(publicSaleContract.address);
    //await verify(implementation, publicSaleContractName, []);
    //await printAddress(publicSaleContractName,publicSaleContract.address);
  }

  describe("Mi Primer Nft Smart Contract", () => {
    // Se publica el contrato antes de cada test
    beforeEach(async () => {
      await deployNftSC();
    });

    it("Verifica nombre colección", async () => {
      var tokenName = await nftContract.name();
      expect(tokenName).to.be.equal(nftTokenName);
    });


    it("Verifica símbolo de colección", async () => {
      var tokenSymbol = await nftContract.symbol();
      //console.log(tokenSymbol, "vs",nftTokenSymbol);
      expect(tokenSymbol).to.be.equal(nftTokenSymbol);
    });

    it("No permite acuñar sin privilegio", async () => {
      await expect(
        nftContract.connect(alice).safeMint(bob.address,1)
      ).to.be.reverted;
      await nftContract.connect(relayer).safeMint(bob.address,1);
    });

    it("No permite acuñar doble id de Nft", async () => {
      await nftContract.connect(relayer).safeMint(alice.address,1);
      await expect(
        nftContract.connect(relayer).safeMint(bob.address,1)
      ).to.be.revertedWith("ERC721: token already minted");
    });

    it("Verifica rango de Nft: [1, 30]", async () => {
      // Mensaje error: "NFT: Token id out of range"
      await expect(
        nftContract.connect(relayer).safeMint(alice.address,0)
      ).to.be.revertedWith("NFT: Token id out of range");
      await nftContract.connect(relayer).safeMint(bob.address,1);
      await nftContract.connect(relayer).safeMint(carl.address,30);
      await expect(
        nftContract.connect(relayer).safeMint(deysi.address,31)
      ).to.be.revertedWith("NFT: Token id out of range");

    });

    it("Se pueden acuñar todos (30) los Nfts", async () => {
      for (var i=1;i<=30;i++){
        await nftContract.connect(relayer).safeMint(alice.address,i);
      }
    });
  });

  describe("Public Sale Smart Contract", () => {
    // Se publica el contrato antes de cada test
    beforeEach(async () => {
      await deployMyTokenMiPrimerToken();
      await deployPublicSaleSC();
      await publicSaleContract.setMiPrimerToken(miPrimerTokenContract.address);
      await publicSaleContract.setGnosisWalletAdd(gnosis.address);
    });

    it("No se puede comprar otra vez el mismo ID", async () => {
      await miPrimerTokenContract.mint(alice.address,ethers.utils.parseEther('1000',18));
      await miPrimerTokenContract.connect(alice).approve(publicSaleContract.address,ethers.utils.parseEther('1000',18));
      await publicSaleContract.connect(alice).purchaseNftById(1);
      await expect(
        publicSaleContract.connect(alice).purchaseNftById(1)
      ).to.be.revertedWith("Public Sale: id not available");
    });

    it("IDs aceptables: [1, 30]", async () => {
      await miPrimerTokenContract.mint(alice.address,ethers.utils.parseEther('660000',18));
      await miPrimerTokenContract.connect(alice).approve(publicSaleContract.address,ethers.utils.parseEther('660000',18));
      for (i=1;i<31;i++){
        await publicSaleContract.connect(alice).purchaseNftById(i);
      }
    });

    it("Usuario no dio permiso de MiPrimerToken a Public Sale", async () => {
      await miPrimerTokenContract.mint(alice.address,ethers.utils.parseEther('500',18));
      await expect(
        publicSaleContract.connect(alice).purchaseNftById(1)
      ).to.be.revertedWith("Public Sale: Not enough allowance");
    });

    it("Usuario no tiene suficientes MiPrimerToken para comprar", async () => {
      await miPrimerTokenContract.mint(alice.address,ethers.utils.parseEther('11499',18));
      await miPrimerTokenContract.connect(alice).approve(publicSaleContract.address,ethers.utils.parseEther('11500',18));
      await publicSaleContract.connect(alice).purchaseNftById(1);
      await expect(
        publicSaleContract.connect(alice).purchaseNftById(11)
      ).to.be.revertedWith("Public Sale: Not enough token balance");
    });

    describe("Compra grupo 1 de NFT: 1 - 10", () => {
      it("Emite evento luego de comprar", async () => {
        // modelo para validar si evento se disparo con correctos argumentos
        await miPrimerTokenContract.mint(alice.address,ethers.utils.parseEther('5000',18));
        await miPrimerTokenContract.connect(alice).approve(publicSaleContract.address,ethers.utils.parseEther('5000',18));
        var tx;
        for (var i=1;i<=10;i++)
        {
          tx=await publicSaleContract.connect(alice).purchaseNftById(i);
          await expect(tx)
          .to.emit(publicSaleContract, "DeliverNft")
          .withArgs(alice.address, i);
        }
      });

      it("Disminuye balance de MiPrimerToken luego de compra", async () => {
        // Usar changeTokenBalance
        // source: https://ethereum-waffle.readthedocs.io/en/latest/matchers.html#change-token-balance
        await miPrimerTokenContract.mint(alice.address,ethers.utils.parseEther('500',18));
        await miPrimerTokenContract.connect(alice).approve(publicSaleContract.address,ethers.utils.parseEther('500',18));
        await expect(
          publicSaleContract.connect(alice).purchaseNftById(5)
        ).to.changeTokenBalance(miPrimerTokenContract,alice.address,ethers.utils.parseEther('-500',18));
      });

      it("Gnosis safe recibe comisión del 10% luego de compra", async () => {
        await miPrimerTokenContract.mint(alice.address,ethers.utils.parseEther('500',18));
        await miPrimerTokenContract.connect(alice).approve(publicSaleContract.address,ethers.utils.parseEther('500',18));
        await expect(
          publicSaleContract.connect(alice).purchaseNftById(1)
        ).to.changeTokenBalance(miPrimerTokenContract,gnosis.address,ethers.utils.parseEther('50',18));
      });

      it("Smart contract recibe neto (90%) luego de compra", async () => {
        await miPrimerTokenContract.mint(alice.address,ethers.utils.parseEther('500',18));
        await miPrimerTokenContract.connect(alice).approve(publicSaleContract.address,ethers.utils.parseEther('500',18));
        await expect(
          publicSaleContract.connect(alice).purchaseNftById(1)
        ).to.changeTokenBalance(miPrimerTokenContract,publicSaleContract.address,ethers.utils.parseEther('450',18));
      });
    });

    describe("Compra grupo 2 de NFT: 11 - 20", () => {
      it("Emite evento luego de comprar", async () => {
        await miPrimerTokenContract.mint(alice.address,ethers.utils.parseEther('155000',18));
        await miPrimerTokenContract.connect(alice).approve(publicSaleContract.address,ethers.utils.parseEther('155000',18));
        var tx;
        for (var i=11;i<=20;i++)
        {
          tx=await publicSaleContract.connect(alice).purchaseNftById(i);
          await expect(tx)
          .to.emit(publicSaleContract, "DeliverNft")
          .withArgs(alice.address, i);
        }        
      });

      it("Disminuye balance de MiPrimerToken luego de compra", async () => {
        await miPrimerTokenContract.mint(alice.address,ethers.utils.parseEther('15000',18));
        await miPrimerTokenContract.connect(alice).approve(publicSaleContract.address,ethers.utils.parseEther('15000',18));
        await expect(
          publicSaleContract.connect(alice).purchaseNftById(15)
        ).to.changeTokenBalance(miPrimerTokenContract,alice.address,ethers.utils.parseEther('-15000',18));
      });

      it("Gnosis safe recibe comisión del 10% luego de compra", async () => {
        await miPrimerTokenContract.mint(alice.address,ethers.utils.parseEther('15000',18));
        await miPrimerTokenContract.connect(alice).approve(publicSaleContract.address,ethers.utils.parseEther('15000',18));
        await expect(
          publicSaleContract.connect(alice).purchaseNftById(15)
        ).to.changeTokenBalance(miPrimerTokenContract,gnosis.address,ethers.utils.parseEther('1500',18));

      });

      it("Smart contract recibe neto (90%) luego de compra", async () => {
        await miPrimerTokenContract.mint(alice.address,ethers.utils.parseEther('15000',18));
        await miPrimerTokenContract.connect(alice).approve(publicSaleContract.address,ethers.utils.parseEther('15000',18));
        await expect(
          publicSaleContract.connect(alice).purchaseNftById(15)
        ).to.changeTokenBalance(miPrimerTokenContract,publicSaleContract.address,ethers.utils.parseEther('13500',18));
      });
    });

    describe("Compra grupo 3 de NFT: 21 - 30", () => {
      it("Disminuye balance de MiPrimerToken luego de compra", async () => {
        var tokenPrice = await publicSaleContract.getPriceNFTById(25);
        await miPrimerTokenContract.mint(alice.address,tokenPrice);
        await miPrimerTokenContract.connect(alice).approve(publicSaleContract.address,tokenPrice);
        await expect(
          publicSaleContract.connect(alice).purchaseNftById(25)
        ).to.changeTokenBalance(miPrimerTokenContract,alice.address,tokenPrice.mul(-1));
      });

      it("Gnosis safe recibe comisión del 10% luego de compra", async () => {
        var tokenPrice = await publicSaleContract.getPriceNFTById(25);
        var gnosisCommission = tokenPrice.div(10);
        await miPrimerTokenContract.mint(alice.address,tokenPrice);
        await miPrimerTokenContract.connect(alice).approve(publicSaleContract.address,tokenPrice);
        await expect(
          publicSaleContract.connect(alice).purchaseNftById(25)
        ).to.changeTokenBalance(miPrimerTokenContract,gnosis.address,gnosisCommission);
      });

      it("Smart contract recibe neto (90%) luego de compra", async () => {
        var tokenPrice = await publicSaleContract.getPriceNFTById(25);
        var gnosisCommission = tokenPrice.div(10);
        var publicSaleCommission = tokenPrice.sub(gnosisCommission);
        await miPrimerTokenContract.mint(alice.address,tokenPrice);
        await miPrimerTokenContract.connect(alice).approve(publicSaleContract.address,tokenPrice);
        await expect(
          publicSaleContract.connect(alice).purchaseNftById(25)
        ).to.changeTokenBalance(miPrimerTokenContract,publicSaleContract.address,publicSaleCommission);
      });
    });
    

    describe("Depositando Ether para Random NFT", () => {

      it("Método emite evento (30 veces) ", async () => {
        for(i=1;i<=30;i++){
          await expect(
            publicSaleContract.connect(alice).depositEthForARandomNft({
              value: pEth("0.01"),
            }))
          .to.emit(publicSaleContract,"DeliverNft");
        }
      });

      it("Método falla la vez 31", async () => {
        for(i=1;i<=30;i++){
          await expect(
            publicSaleContract.connect(alice).depositEthForARandomNft({
              value: pEth("0.01"),
            }))
          .to.emit(publicSaleContract,"DeliverNft");
        }
        await expect(
          publicSaleContract.connect(alice).depositEthForARandomNft({
            value: pEth("0.01"),
          }))
        .to.be.rejectedWith("No hay nfts disponibles");
    });

      it("Envío de Ether y emite Evento (30 veces)", async () => {
        for(i=1;i<=30;i++){
          await expect(
            alice.sendTransaction({
              to:publicSaleContract.address,
              value: pEth("0.01"),
            }))
          .to.emit(publicSaleContract,"DeliverNft");
        }
      });

      it("Envío de Ether falla la vez 31", async () => {
        for(i=1;i<=30;i++){
          await alice.sendTransaction({
            to: publicSaleContract.address,
            value: pEth("0.01"),
          })
        }
        await expect(
          alice.sendTransaction({
            to: publicSaleContract.address,
            value: pEth("0.01"),
          })
        ).to.be.revertedWith("No hay nfts disponibles");
      });

      it("Da vuelto cuando y gnosis recibe Ether", async () => {
        // Usar el método changeEtherBalances
        // Source: https://ethereum-waffle.readthedocs.io/en/latest/matchers.html#change-ether-balance-multiple-accounts
        // Ejemplo:
        await expect(
           await owner.sendTransaction({
             to: publicSaleContract.address,
             value: pEth("0.02")
           })
         ).to.changeEtherBalances(
           [owner.address, gnosis.address],
           [pEth("-0.01"), pEth("0.01")]
         );
      });
    });
  });
});