"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const promises_1 = require("fs/promises");
const hardhat_1 = require("hardhat");
async function main() {
    const libF = await hardhat_1.ethers.getContractFactory("GreeterLib");
    const lib = await libF.deploy();
    console.log("GreeterLib deployed to:", lib.address);
    const Greeter = await hardhat_1.ethers.getContractFactory("Greeter", {
        libraries: {
            GreeterLib: lib.address,
        },
    });
    const greeter = await Greeter.deploy("Hello, Hardhat!");
    await greeter.deployed();
    console.log("Greeter deployed to:", greeter.address);
    (0, promises_1.writeFile)(".out.json", JSON.stringify({
        "Greeter": greeter.address,
        "GreeterLib": lib.address
    }));
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
//# sourceMappingURL=deploy.js.map