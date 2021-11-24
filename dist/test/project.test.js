"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exec = void 0;
// tslint:disable-next-line no-implicit-dependencies
const chai_1 = require("chai");
var child_process_1 = require("child_process");
Object.defineProperty(exports, "exec", { enumerable: true, get: function () { return child_process_1.exec; } });
const helpers_1 = require("./helpers");
const promises_1 = require("fs/promises");
const child_process_2 = require("child_process");
const util_1 = require("util");
class Deployment {
    constructor(Greeter, GreeterLib) {
        this.Greeter = Greeter;
        this.GreeterLib = GreeterLib;
    }
}
async function deploy(hre) {
    // delete old file to prevent stale data
    console.log("Deploying contracts to --network=localhost");
    const deployment_output_file = ".out.json";
    (0, promises_1.rm)(deployment_output_file, { force: true });
    const current_network = hre.hardhatArguments.network;
    hre.hardhatArguments.network = "localhost";
    await hre.run("run", { script: "scripts/deploy.ts" });
    hre.hardhatArguments.network = current_network;
    const script_output = JSON.parse(await (0, promises_1.readFile)(deployment_output_file, { encoding: "utf-8" }));
    const ret = new Deployment(script_output.Greeter, script_output.GreeterLib);
    console.log("Deployment results: ", JSON.stringify(ret));
    return ret;
}
describe("Integration tests", function () {
    this.timeout(300000);
    describe("Hardhat Runtime Environment extension", function () {
        (0, helpers_1.useEnvironment)("hardhat-project");
        it("Should add the example field", async function () {
            await this.hre.run("clean");
            console.log("Launching node");
            const node_promise = this.hre.run("node");
            console.log("node launched"); // TODO wait until RPC's up
            // deploy
            const deployment = await deploy(this.hre);
            // dapp export
            await this.hre.run("dapp-export");
            // dapp link
            await this.hre.run("dapp-link", { libs: [`GreeterLib:${deployment.GreeterLib}`] });
            const calldata = (await (0, util_1.promisify)(child_process_2.exec)('seth calldata "greet()(string)"', { encoding: "utf-8", timeout: 10000 })).stdout.trim();
            const hevm_cmd = `hevm exec --calldata ${calldata} --address ${deployment.Greeter} --trace --rpc http://127.0.0.1:8545 --gas 1000000 --json-file cache/dapp/combined.solc.json; true`;
            console.log("Executing: ", hevm_cmd);
            // `hevm trace` prints the trace to stderr
            const trace = (await (0, util_1.promisify)(child_process_2.exec)(hevm_cmd, { encoding: "utf-8", timeout: 10000 })).stderr
                .trim()
                .replace(/\x1b.*?m/g, "");
            console.log("Output: \n", trace);
            (0, chai_1.expect)(trace).to.match(/FnEnter\("greet"\)\s+\(contracts\/Greeter.sol:24\)/);
            (0, chai_1.expect)(trace).to.match(/FnEnter\("computeGreet"\)\s+\(contracts\/Greeter.sol:17\)/);
            (0, chai_1.expect)(trace).to.match(/delegatecall\s\w+::compute\(\)\s+\(contracts\/Greeter.sol:18\)/);
            (0, chai_1.expect)(trace).to.match(/"hello from lib"/);
            (0, chai_1.expect)(trace).to.match(/FnExit\("computeGreet"\)\s+\(contracts\/Greeter.sol:19\)/);
        });
    });
});
//# sourceMappingURL=project.test.js.map