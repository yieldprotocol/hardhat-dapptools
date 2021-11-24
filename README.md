# hardhat-dapptools

Run all [dapptools](https://dapp.tools/) goodies (`hevm exec`, `hevm symbolic`, `seth send`, etc) on hardhat-deployed contracts

## What

Ever struggled to understand why your transaction reverts? `dapptools` make this (and tons of other flows) easy.
To get the most out of it, you need sourcemaps (unless you speak and breath EVM assembly).

This plugin does precisely that - takes your hardhat project and generates a sourcemap file that's compatible with `dapptools`

## Installation

```bash
npm install hardhat-dapptools
```

Import the plugin in your `hardhat.config.ts`:

```ts
import "hardhat-dapptools"
```

## Tasks

* `dapp-export`: export sourcemap file to $(PROJECT_ROOT)/cache/dapp/combined.solc.json
bbb

* `dapp-link` If your project uses libraries, you need to link them before the sourcemap becomes useful
Syntaxis similar to `DAPP_LIBRARIES` is used: `dapp-link libA:0x3ffb52852Fb8F06f74775bFd1a669d585f89cd77 libB:0x6464F2cAd1e071e05F38562C38D94d8Cc49B4f99`

## Usage

Sample project can be found [here](test/fixture-projects/hardhat-project).
Imagine you have it deployed locally (to `hardhat node` or similar) at 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512, and the library is deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3

The contract ABI is simple:
```solidity
    function computeGreet(string memory input) public returns(string memory);

    function greet() external returns (string memory);
```

Let's try and call `greet()` and see why it reverts:
```
~/src/hardhat-dapps ❯❯❯ hevm exec --calldata `seth calldata "greet()(string)"` --address 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 --trace --rpc http://127.0.0.1:8545 --gas 1000000
log1(0x597685b0c880083aeaf7da2ab06d483281f77abbefe5993feeb0dbc60593dc44, 0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000056772656574000000000000000000000000000000000000000000000000000000) <no source map>
log1(0x597685b0c880083aeaf7da2ab06d483281f77abbefe5993feeb0dbc60593dc44, 0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c636f6d7075746547726565740000000000000000000000000000000000000000) <no source map>
delegatecall 0x5FbDB2315678afecb367f032d93F642f64180aa3::0x1a43c338 <no source map>
 └╴← 0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000e68656c6c6f2066726f6d206c6962000000000000000000000000000000000000
log1(0x9621a8d19ea0100d87d35d5c9f74911c53dd3a9879a4977f3c84399d5f7572c7, 0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c636f6d7075746547726565740000000000000000000000000000000000000000) <no source map>
0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001e48656c6c6f2c2048617264686174212e68656c6c6f2066726f6d206c69620000
```

Sad. Now let's export and link the sourcemap:
```
~/src/hardhat-dapps ❯❯❯ npx hardhat dapp-export
Compiling 2 files with 0.8.4
[HARDHAT-DAPP]	/Users/owleksiy/src/hardhat-dapps/cache/dapp/combined.solc.json
Generating typings for: 2 artifacts in dir: typechain for target: ethers-v5
Successfully generated 7 typings!
Compilation finished successfully

~/src/hardhat-dapps ❯❯❯ npx hardhat dapp-link GreeterLib:0x5FbDB2315678afecb367f032d93F642f64180aa3
Linked GreeterLib: __$2cf91d1f08d1450ca29d91986067042362$__ -> 5FbDB2315678afecb367f032d93F642f64180aa3
Linked GreeterLib: __$2cf91d1f08d1450ca29d91986067042362$__ -> 5FbDB2315678afecb367f032d93F642f64180aa3
[HARDHAT-DAPP] linked:  /Users/owleksiy/src/hardhat-dapps/cache/dapp/combined.solc.json
```

The output file (`cache/dapp/combined.solc.json`) can be passed to `hevm`:
```
~/src/hardhat-dapps ❯❯❯ hevm exec --calldata `seth calldata "greet()(string)"` --address 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 --trace --rpc http://127.0.0.1:8545 --gas 1000000 --json-file /Users/owleksiy/src/hardhat-dapps/cache/dapp/combined.solc.json
FnEnter("greet") (contracts/Greeter.sol:24)
FnEnter("computeGreet") (contracts/Greeter.sol:17)
delegatecall 0x5FbDB2315678afecb367f032d93F642f64180aa3::compute() (contracts/Greeter.sol:18)
 └╴← ("hello from lib")
FnExit("computeGreet") (contracts/Greeter.sol:19)
0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001e48656c6c6f2c2048617264686174212e68656c6c6f2066726f6d206c69620000
```
Looks much better


