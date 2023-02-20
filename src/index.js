import { BigNumber, Contract, providers, ethers, utils } from "ethers";
//require("dotenv").config();
//const pEth = hre.ethers.utils.parseEther;

import usdcTknAbi from "../artifacts/contracts/USDCoin.sol/USDCoin.json";
import miPrimerTknAbi from "../artifacts/contracts/MiPrimerToken.sol/MyTokenMiPrimerToken.json";
import publicSaleAbi from "../artifacts/contracts/PublicSale.sol/PublicSale.json";
import nftTknAbi from "../artifacts/contracts/NFT.sol/MiPrimerNft.json";
import myLiquidityTknAbi from "../artifacts/contracts/LiquidityPoolPC2.sol/LiquidityPoolPC2.json";

window.ethers = ethers;

var provider, signer, account, gnosisWallet, usdcAdd, miPrTknAdd, pubSContractAdd, routerUniSwapAdd, myLiquidityAdd;
var usdcTkContract, miPrTokenContract, nftTknContract, pubSContract, myLiquidityContract;

// REQUIRED
// Conectar con metamask
async function initSCsGoerli() {
  console.log("Conectandose a los contratos de Goerli");
  usdcAdd = "0x557AA53161e6168C57aBF64ED60Af7BE5fd07676";
 
  miPrTknAdd = "0x6D2304968662A48977Cca0A6b9af72f661d6D6eD";
  pubSContractAdd = "0x32B1A98029d8527f76ee0b91F81740d2E0019E0d";

  gnosisWallet = "0x895369cd1d60c131669b2f800aDbbD129589ADD3";

  routerUniSwapAdd = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  myLiquidityAdd = "0xB77fC9f0DFbaf45Fdd7f1b25A03406F6c6252246";

  provider = new providers.Web3Provider(window.ethereum);

  usdcTkContract = new Contract(usdcAdd, usdcTknAbi.abi, provider);
  miPrTokenContract = new Contract(miPrTknAdd, miPrimerTknAbi.abi, provider);
  pubSContract = new Contract(pubSContractAdd, publicSaleAbi.abi, provider);
  myLiquidityContract = new Contract(myLiquidityAdd, myLiquidityTknAbi.abi, provider);


}

// OPTIONAL
// No require conexion con Metamask
// Usar JSON-RPC
// Se pueden escuchar eventos de los contratos usando el provider con RPC
async function initSCsMumbai() {
  console.log("Conectandose al NFT de Mumbai");
  var nftAddress = "0x774D1dBc46F9040aB9950337Fd6Bd49138cD5EF0";
  var urlProvider = "https://polygon-mumbai.g.alchemy.com/v2/KzQHMiGH0FQwJkdLS5WnrZEVdeOPL2bz";
  var provider = new ethers.providers.JsonRpcProvider(urlProvider);

  nftTknContract = new Contract(nftAddress, nftTknAbi.abi, provider);


}

async function setUpListeners() {
  // Connect to Metamask
  var bttn = document.getElementById("connect");

  bttn.addEventListener("click", async function () {
    if (window.ethereum) {
      [account] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Billetera metamask", account);

      provider = new providers.Web3Provider(window.ethereum);
      signer = provider.getSigner(account);
      window.signer = signer;

      // saldos:
      var response2 = await usdcTkContract.connect(signer).balanceOf(account);

      console.log(response2.toString());

      var response3 = response2/1000000;

      var usdcbalance = document.getElementById("usdcBalance");
      usdcbalance.textContent = response3.toString();

      // saldos:
      var response1 = await miPrTokenContract.connect(signer).balanceOf(account);

      console.log(response1.toString());

      var miPrimerTknBalance = document.getElementById("miPrimerTknBalance");
      miPrimerTknBalance.textContent = ethers.utils.formatEther(response1);


    }
  });





  var bttn = document.getElementById("usdcUpdate");
  bttn.addEventListener("click", async function () {

    console.log("signer: ",signer);
    console.log("Account: ",account);

    // obtenemos los saldos 
    var response2 = await usdcTkContract.connect(signer).balanceOf(account);

    console.log(response2.toString());
    var response3 = response2/1000000;

    var usdcbalance = document.getElementById("usdcBalance");
    usdcbalance.textContent = response3.toString();
  });

  var bttn = document.getElementById("miPrimerTknUpdate");
  bttn.addEventListener("click", async function () {

    // obtenemos los saldos 
    var response1 = await miPrTokenContract.connect(signer).balanceOf(account);

    console.log(response1.toString());

    var miPrimerTknBalance = document.getElementById("miPrimerTknBalance");
    miPrimerTknBalance.textContent = ethers.utils.formatEther(response1);

  });


  var bttn = document.getElementById("switch");
  bttn.addEventListener("click", async function () {
    //await connectToMumbai();
  });


  // APROVAR TOKENS
  var bttn = document.getElementById("approveButton");
  bttn.addEventListener("click", async function () {
    var valorCajaTexto = document.getElementById("approveInput").value;
    var value = BigNumber.from(`${valorCajaTexto}000000000000000000`);
    //var value = BigNumber.from(`${valorCajaTexto}`);
    console.log(value);
    var tx = await miPrTokenContract
      .connect(signer)
      .approve(pubSContract.address, value);
    //var tx = await approve(value, signer);
    var response = await tx.wait();
    console.log(response);
    return response;
  });

  // HACER COMPRA CON ID
  var bttn = document.getElementById("purchaseButton");
  bttn.addEventListener("click", async function () {

    var valorCajaTexto = document.getElementById("purchaseInput").value;
    var value = BigNumber.from(`${valorCajaTexto}`);
    console.log(value);
    var tx = await pubSContract
      .connect(signer)
      .purchaseNftById(value);
    var response = await tx.wait();
    console.log(response);
    console.log("transactionHash:",response.transactionHash);
    return response;
  });


    // VER PRECIO CON ID
    var bttn = document.getElementById("getPriceButton");
    bttn.addEventListener("click", async function () {
  
      var valorCajaTexto = document.getElementById("getPriceInput").value;
      var value = BigNumber.from(`${valorCajaTexto}`);
      console.log("valor de caja es...");
      console.log(value);
      var tx = await pubSContract
        .connect(signer)
        .getPriceNFTById(value);
      var response = await tx;
      console.log("RESPONSE BIGNUMBER ES:",response);
      console.log("RESPONSE NUMBER ES:",ethers.utils.formatEther(response));
      //console.log("transactionHash:",response.transactionHash);

      var ul = document.getElementById("PriceList");
      var li = document.createElement("li");
      var children = ul.children.length + 1
      li.setAttribute("id", "element" + children)
      li.appendChild(document.createTextNode("El precio del NFT " + valorCajaTexto + " es: " + ethers.utils.formatEther(response) + " MPRTKN"));
      ul.appendChild(li)

      return response;

    });



  var bttn = document.getElementById("purchaseButtonUSDC");
  bttn.addEventListener("click", async function () {

    var gasPrice = await provider.getGasPrice();
    console.log("gasPrice:"+gasPrice);

    var valorCajaTexto = document.getElementById("purchaseInput2").value;
    var id = BigNumber.from(`${valorCajaTexto}`);

    // Inicia consulta de saldos:
    var response2 = await usdcTkContract.connect(signer).balanceOf(account);
    var response3 = response2/1000000;
    console.log(response3);
    
    var ul = document.getElementById("BalancesUSDC");
    var li = document.createElement("li");
    var children = ul.children.length + 1;
    li.setAttribute("id", "element" + children)
    li.appendChild(document.createTextNode("<ETAPA1> Saldo inicial:"));
    ul.appendChild(li)

    var li = document.createElement("li");
    var children = ul.children.length + 1;
    li.setAttribute("id", "element" + children)
    li.appendChild(document.createTextNode("USD Coin Balance: " + response3.toString()));
    ul.appendChild(li)
    
    
    var response1 = await miPrTokenContract.connect(signer).balanceOf(account);
    response3 = ethers.utils.formatEther(response1);
    console.log(response3);
    
    var li = document.createElement("li");
    var children = ul.children.length + 1
    li.setAttribute("id", "element" + children)
    li.appendChild(document.createTextNode("Mi Primer Token Balance: " + response3.toString()));
    ul.appendChild(li)
    // Termina consulta de saldos:

    console.log("id:"+id);

    var amountOut = await pubSContract
            .connect(signer)
            .getPriceNFTById(id,{gasLimit: 111000,gasPrice}) 
       
    console.log("amountOut:"+amountOut);
    var amountOut2=amountOut/1000000000000000000;
    console.log("amountOut_bits:"+amountOut2);

    var amountsIn = await myLiquidityContract.connect(signer).getAmountsIn(amountOut,[usdcAdd,miPrTknAdd]);
    
    var valueUSDCoin = amountsIn[0];
    console.log("valueUSDCoin:"+valueUSDCoin); 
    
    var tx = await usdcTkContract
      .connect(signer)
      .approve(pubSContract.address, valueUSDCoin);

    var response = await tx.wait();
    console.log("Approve: "+response);
    

    var tx = await usdcTkContract
      .connect(signer)
      .transfer(myLiquidityContract.address,valueUSDCoin);
    var response = await tx.wait();

    var amountInMax = valueUSDCoin;
    var path = [usdcAdd, miPrTknAdd];
    var to = account;
    var deadline = new Date().getTime();
  
    var tx = await myLiquidityContract.connect(signer).swapTokensForExactTokens(
      amountOut,
      amountInMax,
      path,
      to,
      deadline,
    );
    var response = await tx.wait();


    // Inicia consulta de saldos:
    var li = document.createElement("li");
    var children = ul.children.length + 1;
    li.setAttribute("id", "element" + children)
    li.appendChild(document.createTextNode("<ETAPA2> Saldo luego del Swap:"));
    ul.appendChild(li)

    var response2 = await usdcTkContract.connect(signer).balanceOf(account);
    var response3 = response2/1000000;
    console.log(response3);
    
    var li = document.createElement("li");
    var children = ul.children.length + 1;
    li.setAttribute("id", "element" + children)
    li.appendChild(document.createTextNode("USD Coin Balance: " + response3.toString()));
    ul.appendChild(li)
    
    
    var response1 = await miPrTokenContract.connect(signer).balanceOf(account);
    response3 = ethers.utils.formatEther(response1);
    console.log(response3);
    
    var li = document.createElement("li");
    var children = ul.children.length + 1
    li.setAttribute("id", "element" + children)
    li.appendChild(document.createTextNode("Mi Primer Token Balance: " + response3.toString()));
    ul.appendChild(li)
    // Termina consulta de saldos

    console.log("Comprando NFT...");
    var tx = await pubSContract
      .connect(signer)
      .purchaseNftById(id);
    var response = await tx.wait();
    console.log(response);
    console.log("transactionHash:",response.transactionHash);

    // Inicia consulta de saldos:
    var li = document.createElement("li");
    var children = ul.children.length + 1;
    li.setAttribute("id", "element" + children)
    li.appendChild(document.createTextNode("<ETAPA3> Saldo final luego de comprar NFT:"));
    ul.appendChild(li)

    var response2 = await usdcTkContract.connect(signer).balanceOf(account);
    var response3 = response2/1000000;
    console.log(response3);
    
    var li = document.createElement("li");
    var children = ul.children.length + 1;
    li.setAttribute("id", "element" + children)
    li.appendChild(document.createTextNode("USD Coin Balance: " + response3.toString()));
    ul.appendChild(li)
    
    
    var response1 = await miPrTokenContract.connect(signer).balanceOf(account);
    response3 = ethers.utils.formatEther(response1);
    console.log(response3);
    
    var li = document.createElement("li");
    var children = ul.children.length + 1
    li.setAttribute("id", "element" + children)
    li.appendChild(document.createTextNode("Mi Primer Token Balance: " + response3.toString()));
    ul.appendChild(li)
    // Termina consulta de saldos:

    return response;

  });




  var bttn = document.getElementById("purchaseEthButton");
  bttn.addEventListener("click", async function () {

    const ethAmount = "0.01";
    const weiAmount = ethers.utils.parseEther(ethAmount);
    const transaction = {
      value: weiAmount,
    };

    var tx = await pubSContract
      .connect(signer)
      .depositEthForARandomNft(transaction);

    var response = await tx.wait();
    console.log(response);
    return response;

  });

  var bttn = document.getElementById("sendEtherButton");
  bttn.addEventListener("click", async function () {
   
    var tx = await signer.sendTransaction({
      to: pubSContractAdd,
      value: ethers.utils.parseEther("0.01"),
      gasLimit: 1200000,
    });

    var response = await tx.wait();
    console.log(response);
    return response;


  });


}

async function setUpEventsContracts() {

  nftTknContract.on("Transfer", (from, to, tokenId) => {
    console.log("from", from);
    console.log("to", to);
    console.log("tokenId", tokenId);

    var ul = document.getElementById("nftList");
    var li = document.createElement("li");
    var children = ul.children.length + 1
    li.setAttribute("id", "element" + children)
    li.appendChild(document.createTextNode("Transfer from " + from + " to " + to + " tokenId " + tokenId));
    ul.appendChild(li)

  });
}

async function setUp() {
  await initSCsGoerli();
  await initSCsMumbai();
  await setUpListeners();
  await setUpEventsContracts();
}

setUp()
  .then()
  .catch((e) => console.log(e));