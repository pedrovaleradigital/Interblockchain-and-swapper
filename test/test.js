const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const { getRole, deploySC, printAddress, deploySCNoUp, ex, pEth, printAddressNoUp } = require("../utils");

const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");

// 21 de diciembre del 2022 GMT
var startDate = 1671580800;

var makeBN = (num) => ethers.BigNumber.from(String(num));

describe("MI PRIMER TOKEN TESTING", function () {

  var nftContract, publicSale, miPrimerToken, usdcSC;
  var owner, gnosis, alice, bob, carl, deysi,routerUniSwap;
  var name = "PC2 PEDRO VALERA NFT";
  var symbol = "MPRNFT";

  before(async () => {
    [owner, gnosis, alice, bob, carl, deysi] = await ethers.getSigners();
  });


  // Estos dos métodos a continuación publican los contratos en cada red
  // Se usan en distintos tests de manera independiente
  // Ver ejemplo de como instanciar los contratos en deploy.js
  async function deployNftSC() {

    console.log("Desplegando Nft ....");
    nftContract = await deploySC("MiPrimerNft", []);
    var implementation = await printAddress("MiPrimerNft", nftContract.address);

  }


  async function deployPublicSaleSC() {

    console.log("Desplegando PublicSale ...");
   
    publicSale = await deploySC("PublicSale", []);
    var implementation = await printAddress("PublicSale", publicSale.address);
  
    gnosis = ethers.utils.getAddress("0x895369cd1d60c131669b2f800aDbbD129589ADD3");

    // asigna el address del contrato miPrimerToken al contrato PublicSale
    await publicSale.setMiPrimerToken(miPrimerToken.address);

    await publicSale.setUSDCCoin(usdcSC.address);

    // asigna el address del vaul en gnosis al contrato PublicSale
    await publicSale.setGnosisWalletAdd(gnosis);
  
  }


  async function deployMPTKN() {
    console.log("Desplegando MPTKN ...");
    miPrimerToken = await deploySC("MyTokenMiPrimerToken", []);
    var implementation = await printAddress("MyTokenMiPrimerToken", miPrimerToken.address);

  }

  // USDCoin
  async function deployUSDC() {

    console.log("Desplegando USDCoin ...");
    usdcSC = await deploySCNoUp("USDCoin", []);
    await printAddressNoUp("USDCoin", usdcSC.address);

  }

  describe("Mi Primer Nft Smart Contract", () => {
    // Se publica el contrato antes de cada test
    beforeEach(async () => {
      await deployNftSC();
    });

    it("Verifica nombre colección", async () => {

      expect(await nftContract.name()).to.be.equal(name);

    });

    it("Verifica símbolo de colección", async () => {

      expect(await nftContract.symbol()).to.be.equal(symbol);

    });

    it("No permite acuñar sin privilegio", async () => {
      var id = 1;
      const safeMint = nftContract.connect(alice).functions["safeMint(address,uint256)"];
      await expect(
        safeMint(alice.address, id)
      ).to.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );

    });

    it("No permite acuñar doble id de Nft", async () => {

      var id = 1;

      // se asigna permiso para mintear
      await nftContract.grantRole(MINTER_ROLE, alice.address);

      // hace el minteado
      const safeMint = nftContract.connect(owner).functions["safeMint(address,uint256)"];
      await expect(safeMint(bob.address, id))
        .to.changeTokenBalance(nftContract, bob.address, 1);

      // se intenta mintear/acuñar el mismo id nft por segunda vez   
      await expect(safeMint(alice.address, id))
        .to.revertedWith("ERC721: token already minted");

    });

    it("Verifica rango de Nft: [1, 30]", async () => {
      // Mensaje error: "NFT: Token id out of range"

      var id = 31;

      // hace el minteado
      const safeMint = nftContract.connect(owner).functions["safeMint(address,uint256)"];

      // se intenta mintear/acuñar el mismo id nft por segunda vez   
      await expect(safeMint(alice.address, id))
        .to.revertedWith("NFT: Token id out of range");


    });

    it("Se pueden acuñar todos (30) los Nfts", async () => {

      const LIMIT = 30;
      let COUNTER = 1;
      const safeMint = nftContract.connect(owner).functions["safeMint(address,uint256)"];
      var addressZero = "0x0000000000000000000000000000000000000000";

      async function mintNft(nftid) {

        var tx = await safeMint(bob.address, nftid);
        return tx;
      }

      async function batchMintNft() {
        if (COUNTER > LIMIT) return;
        var tx = await mintNft(COUNTER);

        await expect(tx)
          .to.emit(nftContract, "Transfer")
          .withArgs(addressZero, bob.address, COUNTER);

        COUNTER++;
        await batchMintNft();
      }
      await batchMintNft();

      await expect(mintNft(COUNTER)).to.revertedWith("NFT: Token id out of range");
    });


return;



describe("Public Sale Smart Contract empieza", () => {
  // Se publica el contrato antes de cada test
  beforeEach(async () => {
    await deployUSDC();
    await deployMPTKN();
    await deployPublicSaleSC();
  });

  it("No se puede comprar otra vez el mismo ID", async () => {
   
  const id = 4;
  // usuario tiene suficiente credito para comprar
  // acuñar tokens a favor de alice 
  await miPrimerToken.mint(
    alice.address,
    ethers.utils.parseEther("1500")
  );
  // usuario dio permisos a PublicSale pero no tiene fondos 
  const approvePublicSale = miPrimerToken.connect(alice).functions["approve(address,uint256)"];
  await approvePublicSale(publicSale.address, 1500);
  const purchaseNftById = publicSale.connect(alice).functions["purchaseNftById(uint256)"];
  var tx = await purchaseNftById(id);
  await expect(tx)
    .to.emit(publicSale, "DeliverNft")
    .withArgs(alice.address, id);
  await expect(purchaseNftById(id))
    .to.revertedWith('Public Sale: id not available');
});

it("IDs aceptables: [1, 30]", async () => {
  // id fuera de  rango
  var id = 32;
  // usuario tiene suficiente credito para comprar
  // acuñar tokens a favor de alice 
  await miPrimerToken.mint(
    alice.address,
    ethers.utils.parseEther("100000")
  );
  // usuario dio permisos a PublicSale pero no tiene fondos 
  const approvePublicSale = miPrimerToken.connect(alice).functions["approve(address,uint256)"];
  await approvePublicSale(publicSale.address, 10);
  await publicSale.setMiPrimerToken(miPrimerToken.address);
  const purchaseNftById = publicSale.connect(alice).functions["purchaseNftById(uint256)"];
  await expect(
    purchaseNftById(id)
  ).to.revertedWith("NFT: Token id out of range");
});
it("Usuario no dio permiso de MiPrimerToken a Public Sale", async () => {
  var id = 1;
  await publicSale.setMiPrimerToken(miPrimerToken.address);
  const purchaseNftById = publicSale.connect(alice).functions["purchaseNftById(uint256)"];
  await expect(
    purchaseNftById(id)
  ).to.revertedWith("Public Sale: Not enough allowance");
});
it("Usuario no tiene suficientes MiPrimerToken para comprar", async () => {
  var id = 2;
  // usuario dio permisos a PublicSale pero no tiene fondos 
  const approvePublicSale = miPrimerToken.connect(alice).functions["approve(address,uint256)"];
  await approvePublicSale(publicSale.address, 10);
  await publicSale.setMiPrimerToken(miPrimerToken.address);
  const purchaseNftById = publicSale.connect(alice).functions["purchaseNftById(uint256)"];
  await expect(
    purchaseNftById(id)
  ).to.revertedWith("Public Sale: Not enough token balance");
});
describe("Compra grupo 1 de NFT: 1 - 10", () => {
  it("Emite evento luego de comprar", async () => {
    // modelo para validar si evento se disparo con correctos argumentos
    
    var id = 1;
    // usuario tiene suficiente credito para comprar
    // acuñar tokens a favor de alice 
    await miPrimerToken.mint(
      alice.address,
      ethers.utils.parseEther("500")
    );
    // usuario dio permisos a PublicSale pero no tiene fondos 
    const approvePublicSale = miPrimerToken.connect(alice).functions["approve(address,uint256)"];
    await approvePublicSale(publicSale.address, 500);

    const purchaseNftById = publicSale.connect(alice).functions["purchaseNftById(uint256)"];
    var tx = await purchaseNftById(id);
    await expect(tx)
      .to.emit(publicSale, "DeliverNft")
      .withArgs(alice.address, id);
  });
  it("Transfiere todos los tokens miPrimerToken a la cuenta de Owner Public Sale", async () => {
   
    var id = 1;
    // usuarios tiene suficiente credito para comprar/acuñar tokens
    await miPrimerToken.mint(
      alice.address,
      ethers.utils.parseEther("500")
    );
    // usuario dio permisos a PublicSale pero no tiene fondos 
    var approvePublicSale = miPrimerToken.connect(alice).functions["approve(address,uint256)"];
    await approvePublicSale(publicSale.address, 500);
    var purchaseNftById = publicSale.connect(alice).functions["purchaseNftById(uint256)"];
    var tx = await purchaseNftById(id);
    await expect(tx)
      .to.emit(publicSale, "DeliverNft")
      .withArgs(alice.address, id);
    // transfiere todos los miprimertoken del contrato al owner
    var transferTokensFromSmartContract = publicSale.connect(owner).functions["transferTokensFromSmartContract()"];
    var tx = await transferTokensFromSmartContract();
    await expect(tx)
      .to.changeTokenBalance(miPrimerToken, owner.address, 450);
  });
  it("Disminuye balance de MiPrimerToken luego de compra", async () => {
    // Usar changeTokenBalance
    // source: https://ethereum-waffle.readthedocs.io/en/latest/matchers.html#change-token-balance
   
    var id = 1;
    // usuario tiene suficiente credito para comprar
    // acuñar tokens a favor de alice 
    await miPrimerToken.mint(
      alice.address,
      ethers.utils.parseEther("500")
    );
    // usuario dio permisos a PublicSale pero no tiene fondos 
    const approvePublicSale = miPrimerToken.connect(alice).functions["approve(address,uint256)"];
    await approvePublicSale(publicSale.address, 500);
   
    const purchaseNftById = publicSale.connect(alice).functions["purchaseNftById(uint256)"];
    var tx = await purchaseNftById(id);
    await expect(tx)
      .to.changeTokenBalance(miPrimerToken, alice.address, -500);
  });
  it("Gnosis safe recibe comisión del 10% luego de compra", async () => {
   
    var id = 1;
    // usuario tiene suficiente credito para comprar
    // acuñar tokens a favor de alice 
    await miPrimerToken.mint(
      alice.address,
      ethers.utils.parseEther("500")
    );
    // usuario dio permisos a PublicSale pero no tiene fondos 
    const approvePublicSale = miPrimerToken.connect(alice).functions["approve(address,uint256)"];
    await approvePublicSale(publicSale.address, 500);
    const purchaseNftById = publicSale.connect(alice).functions["purchaseNftById(uint256)"];
    var tx = await purchaseNftById(id);
    await expect(tx)
      .to.changeTokenBalance(miPrimerToken, gnosis, 50);






      const approvePublicSale2 = miPrimerToken.connect(alice).functions["balanceOf(address)"];
      var tx = await approvePublicSale2(publicSale.address);
      console.log("////////////////////");
      console.log("////////////////////");
      console.log("////////////////////");
      console.log("Comision gnosis safe uint256:",tx);
      console.log("////////////////////");
      console.log("////////////////////");
      console.log("////////////////////");
    
      //console.log("Comision gnosis safe uint256:");










  });
  it("Smart contract recibe neto (90%) luego de compra", async () => {
    // Usar changeTokenBalance
    // source: https://ethereum-waffle.readthedocs.io/en/latest/matchers.html#change-token-balance
   
    var id = 1;
    // usuario tiene suficiente credito para comprar
    // acuñar tokens a favor de alice 
    await miPrimerToken.mint(
      alice.address,
      ethers.utils.parseEther("500")
    );
    // usuario dio permisos a PublicSale pero no tiene fondos 
    const approvePublicSale = miPrimerToken.connect(alice).functions["approve(address,uint256)"];
    await approvePublicSale(publicSale.address, 500);
    const purchaseNftById = publicSale.connect(alice).functions["purchaseNftById(uint256)"];
    var tx = await purchaseNftById(id);
    await expect(tx)
      .to.changeTokenBalance(miPrimerToken, publicSale.address, 450);
  });
});
describe("Compra grupo 2 de NFT: 11 - 20", () => {
  it("Emite evento luego de comprar", async () => {
    var id = 14;
    var costo = id * 1000;
    // usuario tiene suficiente credito para comprar
    // acuñar tokens a favor de alice 
    await miPrimerToken.mint(
      alice.address,
      ethers.utils.parseEther(costo.toString())
    );
    // usuario dio permisos a PublicSale pero no tiene fondos 
    const approvePublicSale = miPrimerToken.connect(alice).functions["approve(address,uint256)"];
    await approvePublicSale(publicSale.address, costo);
    
    const purchaseNftById = publicSale.connect(alice).functions["purchaseNftById(uint256)"];
    var tx = await purchaseNftById(id);
    await expect(tx)
      .to.emit(publicSale, "DeliverNft")
      .withArgs(alice.address, id);
  });
  it("Disminuye balance de MiPrimerToken luego de compra", async () => {
 
    var id = 15;
    var costo = id * 1000;
    // usuario tiene suficiente credito para comprar
    // acuñar tokens a favor de alice 
    await miPrimerToken.mint(
      alice.address,
      ethers.utils.parseEther(costo.toString())
    );
    // usuario dio permisos a PublicSale pero no tiene fondos 
    const approvePublicSale = miPrimerToken.connect(alice).functions["approve(address,uint256)"];
    await approvePublicSale(publicSale.address, costo);
   
    const purchaseNftById = publicSale.connect(alice).functions["purchaseNftById(uint256)"];
    var tx = await purchaseNftById(id);
    await expect(tx)
      .to.changeTokenBalance(miPrimerToken, alice.address, -costo);
  });
  it("Gnosis safe recibe comisión del 10% luego de compra", async () => {
    var id = 13;
    var priceNft = id * 1000;
    // usuario tiene suficiente credito para comprar
    // acuñar tokens a favor de alice 
    await miPrimerToken.mint(
      alice.address,
      ethers.utils.parseEther(priceNft.toString())
    );
    // usuario dio permisos a PublicSale pero no tiene fondos 
    const approvePublicSale = miPrimerToken.connect(alice).functions["approve(address,uint256)"];
    await approvePublicSale(publicSale.address, priceNft);
    var _fee = (priceNft * 10) / 100;
    const purchaseNftById = publicSale.connect(alice).functions["purchaseNftById(uint256)"];
    var tx = await purchaseNftById(id);
    await expect(tx)
      .to.changeTokenBalance(miPrimerToken, gnosis, _fee);
  });
  it("Smart contract recibe neto (90%) luego de compra", async () => {
   
    var id = 12;
    var priceNft = id * 1000;
    // usuario tiene suficiente credito para comprar
    // acuñar tokens a favor de alice 
    await miPrimerToken.mint(
      alice.address,
      ethers.utils.parseEther(priceNft.toString())
    );
    // usuario dio permisos a PublicSale pero no tiene fondos 
    const approvePublicSale = miPrimerToken.connect(alice).functions["approve(address,uint256)"];
    await approvePublicSale(publicSale.address, priceNft);
   
    var _fee = (priceNft * 10) / 100;
    var _net = priceNft - _fee;
    const purchaseNftById = publicSale.connect(alice).functions["purchaseNftById(uint256)"];
    var tx = await purchaseNftById(id);
    await expect(tx)
      .to.changeTokenBalance(miPrimerToken, publicSale.address, _net);
  });
});
describe("Compra grupo 3 de NFT: 21 - 30", () => {
  it("Disminuye balance de MiPrimerToken luego de compra", async () => {
   
    var id = 22;
    var basePriceNft = 10000;
    var nowDate = Math.floor(new Date().getTime() / 1000.0)
    var hourElapsed = Math.floor((nowDate - startDate) / 3600);
    var priceNft = basePriceNft + hourElapsed * 1000;
    if (priceNft > 50000) {
      priceNft = 50000;
    }
    console.log("priceNft: ", priceNft);
    // usuario tiene suficiente credito para comprar
    // acuñar tokens a favor de alice 
    await miPrimerToken.mint(
      alice.address,
      ethers.utils.parseEther(priceNft.toString())
    );
    // usuario dio permisos a PublicSale pero no tiene fondos 
    const approvePublicSale = miPrimerToken.connect(alice).functions["approve(address,uint256)"];
    await approvePublicSale(publicSale.address, priceNft);
   
    var _fee = (priceNft * 10) / 100;
    var _net = priceNft - _fee;
    const purchaseNftById = publicSale.connect(alice).functions["purchaseNftById(uint256)"];
    var tx = await purchaseNftById(id);
    await expect(tx)
      .to.changeTokenBalance(miPrimerToken, publicSale.address, _net);
  });
  it("Gnosis safe recibe comisión del 10% luego de compra", async () => {
   
    var id = 25;
    var basePriceNft = 10000;
    var nowDate = Math.floor(new Date().getTime() / 1000.0)
    var hourElapsed = Math.floor((nowDate - startDate) / 3600);
    var priceNft = basePriceNft + hourElapsed * 1000;
    if (priceNft > 50000) {
      priceNft = 50000;
    }
    console.log("priceNft: ", priceNft);
    // usuario tiene suficiente credito para comprar
    // acuñar tokens a favor de alice 
    await miPrimerToken.mint(
      alice.address,
      ethers.utils.parseEther(priceNft.toString())
    );
    // usuario dio permisos a PublicSale pero no tiene fondos 
    const approvePublicSale = miPrimerToken.connect(alice).functions["approve(address,uint256)"];
    await approvePublicSale(publicSale.address, priceNft);

    var _fee = (priceNft * 10) / 100;
    var _net = priceNft - _fee;
    const purchaseNftById = publicSale.connect(alice).functions["purchaseNftById(uint256)"];
    var tx = await purchaseNftById(id);
    await expect(tx)
      .to.changeTokenBalance(miPrimerToken, gnosis, _fee);
  });
  it("Smart contract recibe neto (90%) luego de compra", async () => {
   
    var id = 28;
    var basePriceNft = 10000;
    var nowDate = Math.floor(new Date().getTime() / 1000.0)
    var hourElapsed = Math.floor((nowDate - startDate) / 3600);
    var priceNft = basePriceNft + hourElapsed * 1000;
    if (priceNft > 50000) {
      priceNft = 50000;
    }
    console.log("priceNft: ", priceNft);
    // usuario tiene suficiente credito para comprar
    // acuñar tokens a favor de alice 
    await miPrimerToken.mint(
      alice.address,
      ethers.utils.parseEther(priceNft.toString())
    );
    // usuario dio permisos a PublicSale pero no tiene fondos 
    const approvePublicSale = miPrimerToken.connect(alice).functions["approve(address,uint256)"];
    await approvePublicSale(publicSale.address, priceNft);
    
    var _fee = (priceNft * 10) / 100;
    var _net = priceNft - _fee;
    const purchaseNftById = publicSale.connect(alice).functions["purchaseNftById(uint256)"];
    var tx = await purchaseNftById(id);
    await expect(tx)
      .to.changeTokenBalance(miPrimerToken, publicSale.address, _net);
  });
});
describe("Depositando Ether para Random NFT", () => {
  it("Método emite evento (30 veces) ", async () => {
    const LIMIT = 30;
    let COUNTER = 1;
    async function compraRandomNft() {
      
      // Ether Amount to send to Public Sale SC 
      const ethAmount = "0.01";
      const weiAmount = ethers.utils.parseEther(ethAmount);
      const transaction = {
        value: weiAmount,
      };
      // Deposita el ether y llama al metodo
      var tx = await publicSale.depositEthForARandomNft(transaction);
      const receipt = await tx.wait()
      for (const event of receipt.events) {
        console.log(`Event ${event.event} with args ${event.args}`);
      }
    }
    async function seguirComprandoNft() {
      if (COUNTER > LIMIT) return;
      COUNTER++;
      await compraRandomNft();
      await seguirComprandoNft();
    }
    await seguirComprandoNft();
  });
  it("Método falla la vez 31", async () => {
    const LIMIT = 30;
    let COUNTER = 1;
    async function compraRandomNft() {
   
      // Ether Amount to send to Public Sale SC 
      const ethAmount = "0.01";
      const weiAmount = ethers.utils.parseEther(ethAmount);
      const transaction = {
        value: weiAmount,
      };
      // Deposita el ether y llama al metodo
      var tx = await publicSale.depositEthForARandomNft(transaction);
      const receipt = await tx.wait()
      for (const event of receipt.events) {
        console.log(`Event ${event.event} with args ${event.args}`);
      }
    }
    async function seguirComprandoNft() {
      if (COUNTER > LIMIT) return;
      COUNTER++;
      await compraRandomNft();
      await seguirComprandoNft();
    }
    await seguirComprandoNft();
    // vez número 31 arroja error
    await expect(compraRandomNft()).to.revertedWith(
      "No hay nfts disponibles"
    );
  });
  it("Envío de Ether y emite Evento (30 veces)", async () => {
    const LIMIT = 30;
    let COUNTER = 1;
    async function compraRandomNft() {
      
      await expect(
        await owner.sendTransaction({
          to: publicSale.address,
          value: pEth("0.01"),
        })
      ).to.changeEtherBalances(
        [owner.address, gnosis],
        [pEth("-0.01"), pEth("0.01")]
      );
    }
    async function seguirComprandoNft() {
      if (COUNTER > LIMIT) return;
      COUNTER++;
      await compraRandomNft();
      await seguirComprandoNft();
    }
    await seguirComprandoNft();
  });
  it("Envío de Ether falla la vez 31", async () => {
    const LIMIT = 30;
    let COUNTER = 1;
    async function compraRandomNft() {
      await expect(
        await owner.sendTransaction({
          to: publicSale.address,
          value: pEth("0.01"),
        })
      ).to.changeEtherBalances(
        [owner.address, gnosis],
        [pEth("-0.01"), pEth("0.01")]
      );
    }
    async function seguirComprandoNft() {
      if (COUNTER > LIMIT) return;
      COUNTER++;
      await compraRandomNft();
      await seguirComprandoNft();
    }
    await seguirComprandoNft();
    // vez número 31 arroja error
    await expect(compraRandomNft()).to.revertedWith(
      "No hay nfts disponibles"
    );
  });
  it("Da vuelto cuando gnosis recibe Ether", async () => {
    // Usar el método changeEtherBalances
    // Source: https://ethereum-waffle.readthedocs.io/en/latest/matchers.html#change-ether-balance-multiple-accounts
    // Ejemplo:
    //gasPrice: 50000,
    await expect(
      await owner.sendTransaction({
        to: publicSale.address,
        value: pEth("0.02")            
      })
    ).to.changeEtherBalances(
      [owner.address, gnosis],
      [pEth("-0.01"), pEth("0.01")]
      );
    });
  });
  });
});
});