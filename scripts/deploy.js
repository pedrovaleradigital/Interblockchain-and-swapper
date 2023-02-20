require("dotenv").config();
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const hre = require("hardhat");

var pEth = hre.ethers.utils.parseEther;

const {
  getRole,
  verify,
  ex,
  printAddress,
  deploySC,
  deploySCNoUp,
  printAddressNoUp,
} = require("../utils");

var MINTER_ROLE = getRole("MINTER_ROLE");
var BURNER_ROLE = getRole("BURNER_ROLE");
var usdcContract, miPrimerTokenContract, publicSaleContract;


async function deployUSDC() {
  usdcContract = await deploySCNoUp("USDCoin", []);
  await printAddressNoUp("USDCoin", usdcContract.address);
  await verify(usdcContract.address, "USDCoin", []);

}

async function verifyUSDC(){
  console.log("Empezo la verificaion");
  // script para verificacion del contrato
  var usdcAdd = "0x557AA53161e6168C57aBF64ED60Af7BE5fd07676";
  await hre.run("verify:verify", {
    address: usdcAdd,
    constructorArguments: [],
  });
}


async function setupPublicSale() {

  console.log("Conectandonos a PublicSale");
  var publicSaleProxyAdd = "0x32B1A98029d8527f76ee0b91F81740d2E0019E0d";
  var gnosisSafeWalletAdd = "0x895369cd1d60c131669b2f800aDbbD129589ADD3";
  var usdCoinAdd = "0x557AA53161e6168C57aBF64ED60Af7BE5fd07676";  
  var miPrimerTokenAdd = "0x6D2304968662A48977Cca0A6b9af72f661d6D6eD";

  var [owner] = await hre.ethers.getSigners();
  var urlProvider = process.env.GOERLI_TESNET_URL;
  var provider = new ethers.providers.JsonRpcProvider(urlProvider);

  var PublicSaleContract = await hre.ethers.getContractFactory("PublicSale");
  var publicSaleContract = PublicSaleContract.attach(publicSaleProxyAdd);

  console.log("Configura el address de MiPrimerToken en Public Sale");
  var tx = await publicSaleContract.connect(owner).setMiPrimerToken(miPrimerTokenAdd);
  await tx.wait();

  console.log("Configura el address de UsdCoin en Public Sale");
  var tx = await publicSaleContract.connect(owner).setUSDCCoin(usdCoinAdd);
  await tx.wait();

  console.log("Configura el address de Gnosis en Public Sale");
  var tx = await publicSaleContract.connect(owner).setGnosisWalletAdd(gnosisSafeWalletAdd);
  await tx.wait();

}

async function deployMyTokenMiPrimerToken() {
  miPrimerTokenContract = await deploySC("MyTokenMiPrimerToken", []);
  var implementation = await printAddress("MyTokenMiPrimerToken", miPrimerTokenContract.address);

  await verify(implementation, "MyTokenMiPrimerToken", []);

}


async function deployMumbai() {
  //Todos los métodos de este contrato son protegidos. La única address con el privilegio de poder llamar métodos del contrato NFT es el Relayer de Open Zeppelin
  var relayerAddress = "0x53f867faa862ac3a85ee04fcb47243552658aac7";
  var nftContract = await deploySC("MiPrimerNft", []);
  var implementation = await printAddress("MiPrimerNft", nftContract.address);

  await ex(nftContract, "grantRole", [MINTER_ROLE, relayerAddress], "GR");

  await verify(implementation, "MiPrimerNft", []);
}


async function deployGoerli() {
  await deployUSDC();
  await deployMyTokenMiPrimerToken();
  await deployPublicSaleSC();
  await setupPublicSale();

}

async function deployPublicSaleSC() {

  publicSaleContract = await deploySC("PublicSale", []);
  var implementation = await printAddress("PublicSale", publicSaleContract.address);

  await verify(implementation, "PublicSale", []);


}

async function upgradePublicSaleSC() {
  
  console.log("Actualizando PublicSale ...");

  var PublicSaleProxyAdd = "0x32B1A98029d8527f76ee0b91F81740d2E0019E0d";
  const PublicSaleUpgrade = await hre.ethers.getContractFactory("PublicSale");

  var publicSaleUpgrade = await upgrades.upgradeProxy(PublicSaleProxyAdd, PublicSaleUpgrade);
  try {
    await publicSaleUpgrade.deployTransaction.wait(5);
  } catch (error) {
    console.log(error);
  }
  
  var implmntAddress = await upgrades.erc1967.getImplementationAddress(publicSaleUpgrade.address);

  console.log("Proxy address publicSaleUpgrade:", publicSaleUpgrade.address);
  console.log("Implementation address publicSaleUpgrade:", implmntAddress);

  await hre.run("verify:verify", {
    address: implmntAddress,
    constructorArguments: [],
  });


}

async function upgradeNFT() {
  
  console.log("Actualizando NFT ...");

  var NFTProxyAdd = "0x774D1dBc46F9040aB9950337Fd6Bd49138cD5EF0";
  const NFTUpgrade = await hre.ethers.getContractFactory("MiPrimerNft");

  var nftUpgrade = await upgrades.upgradeProxy(NFTProxyAdd, NFTUpgrade);
  try {
    await nftUpgrade.deployTransaction.wait(5);
  } catch (error) {
    console.log(error);
  }
  
  var implmntAddress = await upgrades.erc1967.getImplementationAddress(nftUpgrade.address);

  console.log("Proxy address NFT:", nftUpgrade.address);
  console.log("Implementation address NFT:", implmntAddress);

  await hre.run("verify:verify", {
    address: implmntAddress,
    constructorArguments: [],
  });


}

async function deployLiquidityPool() {
  var LiquidityPool = await hre.ethers.getContractFactory("LiquidityPoolPC2");
  var liquidityPool = await LiquidityPool.deploy();
  var tx = await liquidityPool.deployed();
  await tx.deployTransaction.wait(5);
  console.log("Address:", liquidityPool.address);

  await hre.run("verify:verify", {
    address: liquidityPool.address,
    constructorArguments: [],
  });
}


async function getPair() {

  var DefiAddress = "0xB77fC9f0DFbaf45Fdd7f1b25A03406F6c6252246";

  var DeFi = await hre.ethers.getContractFactory("LiquidityPoolPC2");
  var deFi = DeFi.attach(DefiAddress);

  var res = await deFi.getPair();
  console.log(res);
}

async function swapTokensForExactTokens() {

  var tokenAAdd = "0x557AA53161e6168C57aBF64ED60Af7BE5fd07676";
  var [owner, alice] = await hre.ethers.getSigners();
  var TokenA = await hre.ethers.getContractFactory("USDCoin");
  var tokenA = TokenA.attach(tokenAAdd);

  var tokenBAdd = "0x6D2304968662A48977Cca0A6b9af72f661d6D6eD";
  var TokenB = await hre.ethers.getContractFactory("MyTokenMiPrimerToken");
  var tokenB = TokenB.attach(tokenBAdd);

  var DefiAddress = "0x2311E8ca1047496227ba3887970b7d488D8F7F48";
  var DeFi = await hre.ethers.getContractFactory("LiquidityPoolPC2");
  var deFi = DeFi.attach(DefiAddress);

  console.log("ANTES DE MINTEAR: ");
  var balanceTokenADefiAddress = await tokenA.balanceOf(DefiAddress);
  var balanceTokenBDefiAddress = await tokenB.balanceOf(DefiAddress);
  var balanceTokenAOwner = await tokenA.balanceOf(owner.address);
  var balanceTokenBOwner = await tokenB.balanceOf(owner.address);
  console.log("Token A Bal de DefiAddress: ", balanceTokenADefiAddress);
  console.log("Token B Bal de DefiAddress: ", (ethers.utils.formatEther(balanceTokenBDefiAddress)));
  console.log("Token A Bal de mi billetera: ", balanceTokenAOwner);
  console.log("Token B Bal de mi billetera: ", (ethers.utils.formatEther(balanceTokenBOwner)));
  console.log("////");
  console.log("////");
  var tx = await tokenA.mint(DefiAddress, 100000000);
  await tx.wait();

  console.log("LUEGO DE MINTEAR: ");
  var balanceTokenADefiAddress = await tokenA.balanceOf(DefiAddress);
  var balanceTokenBDefiAddress = await tokenB.balanceOf(DefiAddress);
  var balanceTokenAOwner = await tokenA.balanceOf(owner.address);
  var balanceTokenBOwner = await tokenB.balanceOf(owner.address);
  console.log("Token A Bal de DefiAddress: ", balanceTokenADefiAddress);
  console.log("Token B Bal de DefiAddress: ", (ethers.utils.formatEther(balanceTokenBDefiAddress)));
  console.log("Token A Bal de mi billetera: ", balanceTokenAOwner);
  console.log("Token B Bal de mi billetera: ", (ethers.utils.formatEther(balanceTokenBOwner)));
  console.log("////");
  console.log("////");

  console.log("Info para el Swap:");
  var tx = await deFi.getAmountsIn(ethers.utils.parseEther("20"),[tokenAAdd,tokenBAdd])
  console.log("Cantidad de Token A: ", tx[0]);
  console.log("Cantidad de Token B: ", tx[1]);
  console.log("////");
  console.log("////");

  var amountOut = ethers.utils.parseEther("20"); 
  var amountInMax = BigNumber.from(11000000); 
  var path = [tokenAAdd, tokenBAdd];
  var to = DefiAddress;
  var deadline = new Date().getTime();

  var tx = await deFi.connect(owner).swapTokensForExactTokens(
    amountOut,
    amountInMax,
    path,
    to,
    deadline
  );

  var res = await tx.wait();
  console.log("Transaction Hash", res.transactionHash);

  console.log("LUEGO DE SWAP");
  var balanceTokenADefiAddress = await tokenA.balanceOf(DefiAddress);
  var balanceTokenBDefiAddress = await tokenB.balanceOf(DefiAddress);
  var balanceTokenAOwner = await tokenA.balanceOf(owner.address);
  var balanceTokenBOwner = await tokenB.balanceOf(owner.address);
  console.log("Token A Bal de DefiAddress: ", balanceTokenADefiAddress);
  console.log("Token B Bal de DefiAddress: ", (ethers.utils.formatEther(balanceTokenBDefiAddress)));
  console.log("Token A Bal de mi billetera: ", balanceTokenAOwner);
  console.log("Token B Bal de mi billetera: ", (ethers.utils.formatEther(balanceTokenBOwner)));
}

async function addLiquidityToPool() {

  var usdcAdd = "0x557AA53161e6168C57aBF64ED60Af7BE5fd07676";
  var USDCoin = await hre.ethers.getContractFactory("USDCoin");

  console.log("Conectandonos al USDCoin");
  var usdcoin = USDCoin.attach(usdcAdd);

  var miPrimerTokenAdd = "0x6D2304968662A48977Cca0A6b9af72f661d6D6eD";
  var MiPrimerTokenAdd = await hre.ethers.getContractFactory("MyTokenMiPrimerToken");

  console.log("Conectandonos al MiPrimerToken");
  var miPrimerToken = MiPrimerTokenAdd.attach(miPrimerTokenAdd);

  // reemplazar por el valor que retorna luego de publicar el MyAddLiquidity
  var myAddliquidityPoolAdd = "0x2311E8ca1047496227ba3887970b7d488D8F7F48";
  var MyAddLiquidityPool = await hre.ethers.getContractFactory("LiquidityPoolPC2");

  console.log("Conectandonos al LiquidityPoolPC2");
  var myAddLiquidityPool = MyAddLiquidityPool.attach(myAddliquidityPoolAdd);

  console.log("////");
  console.log("////");
  console.log("ANTES DE MINTEAR: ");
  var balanceTokenADefiAddress = await usdcoin.balanceOf(myAddliquidityPoolAdd);
  var balanceTokenBDefiAddress = await miPrimerToken.balanceOf(myAddliquidityPoolAdd);
  console.log("Token USDC Bal de LiquidityPoolPC2: ", balanceTokenADefiAddress);
  console.log("MiPrimerToken Bal de LiquidityPoolPC2: ", (ethers.utils.formatEther(balanceTokenBDefiAddress)));
  console.log("////");
  console.log("////");

  console.log("Depositar usdcoin en el contrato que creará el pool de liquidez");
  var tx = await usdcoin.mint(myAddliquidityPoolAdd, 100000000000);
  await tx.wait();

  console.log("Depositar miPrimerToken en el contrato que creará el pool de liquidez");
  var tx = await miPrimerToken.mint(myAddliquidityPoolAdd, pEth("200000"));
  await tx.wait();

  console.log("LUEGO DE MINTEAR: ");
  var balanceTokenADefiAddress = await usdcoin.balanceOf(myAddliquidityPoolAdd);
  var balanceTokenBDefiAddress = await miPrimerToken.balanceOf(myAddliquidityPoolAdd);
  console.log("Token USDC Bal de LiquidityPoolPC2: ", balanceTokenADefiAddress);
  console.log("MiPrimerToken Bal de LiquidityPoolPC2: ", (ethers.utils.formatEther(balanceTokenBDefiAddress)));
  console.log("////");
  console.log("////");
  // Definir el ratio => definir el X * Y = K
  var _token0 = usdcAdd;
  var _token1 = miPrimerTokenAdd;
  var _amount0Desired = BigNumber.from(100000000000);
  var _amount1Desired = ethers.utils.parseEther("200000");
  var _amount0Min = BigNumber.from(100000000000)
  var _amount1Min = ethers.utils.parseEther("200000");
  var _to = myAddLiquidityPool.address;
  var _deadline = new Date().getTime();

  console.log("Añadiendo liquidez al pool de liquidez");
  var tx = await myAddLiquidityPool.addLiquidity(
    _token0,
    _token1,
    _amount0Desired,
    _amount1Desired,
    _amount0Min,
    _amount1Min,
    _to,
    _deadline
  ); 

  var res = await tx.wait();
  console.log("transaccion hash ", res.transactionHash);

  console.log("LUEGO DE CREAR POOL LIQUIDEZ: ");
  var balanceTokenADefiAddress = await usdcoin.balanceOf(myAddliquidityPoolAdd);
  var balanceTokenBDefiAddress = await miPrimerToken.balanceOf(myAddliquidityPoolAdd);
  console.log("Token USDC Bal de LiquidityPoolPC2: ", balanceTokenADefiAddress);
  console.log("MiPrimerToken Bal de LiquidityPoolPC2: ", (ethers.utils.formatEther(balanceTokenBDefiAddress)));
  console.log("////");
  console.log("////");
}

//deployGoerli()
//deployMumbai()

//deployUSDC()
//verifyUSDC()
//deployMyTokenMiPrimerToken()
//deployPublicSaleSC()
//setupPublicSale()

//upgradePublicSaleSC()
upgradeNFT()

//deployLiquidityPool()
//addLiquidityToPool()
//getPair()
//swapTokensForExactTokens()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });