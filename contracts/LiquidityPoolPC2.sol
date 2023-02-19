import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


interface IUniswapV2Router02 {
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);

    function getAmountsIn (
        uint amountOut, 
        address[] memory path
    ) external view returns (uint[] memory amounts);

    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

interface IUniswapV2Factory {
    function getPair(
        address tokenA,
        address tokenB
    ) external view returns (address pair);
}

contract LiquidityPoolPC2 {
    // Router Goerli
    address routerAddress = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    IUniswapV2Router02 router = IUniswapV2Router02(routerAddress);

    IERC20 tokenA = IERC20(0x557AA53161e6168C57aBF64ED60Af7BE5fd07676);
    IERC20 tokenB = IERC20(0x6D2304968662A48977Cca0A6b9af72f661d6D6eD);

    address factoryAddress = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    IUniswapV2Factory factory = IUniswapV2Factory(factoryAddress);

    event LiquidityAdded(uint amountA, uint amountB, uint liquidity);
    event SwapAmounts(uint[] amounts);

    function addLiquidity(
        address _tokenA,
        address _tokenB,
        uint _amountADesired,
        uint _amountBDesired,
        uint _amountAMin,
        uint _amountBMin,
        address _to,
        uint _deadline
    ) external returns (uint amountA, uint amountB, uint liquidity) {
        // Approve the router to spend the token
        tokenA.approve(routerAddress, _amountADesired);
        tokenB.approve(routerAddress, _amountBDesired);

        // Add liquidity
        (amountA, amountB, liquidity) = router.addLiquidity(
            _tokenA,
            _tokenB,
            _amountADesired,
            _amountBDesired,
            _amountAMin,
            _amountBMin,
            _to,
            _deadline
        );

        emit LiquidityAdded(amountA, amountB, liquidity);
    }

    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external {
        address tokenAAdd = path[0];
        IERC20(tokenAAdd).approve(routerAddress, amountInMax);

        uint[] memory amounts = router.swapTokensForExactTokens(
            amountOut,
            amountInMax,
            path,
            to,
            deadline
        );

        emit SwapAmounts(amounts);
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external {
        address tokenAAdd = path[0];
        IERC20(tokenAAdd).approve(routerAddress, amountIn);

        uint[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );

        emit SwapAmounts(amounts);
    }

    function getPair() public view returns (address) {
        return factory.getPair(address(tokenA), address(tokenB));
    }

    function getAmountsIn(
        uint amountOut, 
        address[] memory path
    ) public view returns (uint[] memory){
        return router.getAmountsIn(
            amountOut,
            path
        );
    }

}

/*

0x2311E8ca1047496227ba3887970b7d488D8F7F48
https://goerli.etherscan.io/address/0x2311E8ca1047496227ba3887970b7d488D8F7F48

*/