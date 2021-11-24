// tslint:disable-next-line no-implicit-dependencies
import { assert, expect } from "chai";
import path from "path";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export { exec } from "child_process";
import { useEnvironment } from "./helpers";
import { readFile, rm } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";

class Deployment {
  constructor(readonly Greeter: string, readonly GreeterLib: string) { }
}

async function deploy(hre: HardhatRuntimeEnvironment): Promise<Deployment> {
  // delete old file to prevent stale data
  console.log("Deploying contracts to --network=localhost")
  const deployment_output_file = ".out.json";

  rm(deployment_output_file, { force: true });
  const current_network = hre.hardhatArguments.network;
  hre.hardhatArguments.network = "localhost";
  await hre.run("run", { script: "scripts/deploy.ts" });
  hre.hardhatArguments.network = current_network;

  const script_output = JSON.parse(await readFile(deployment_output_file, { encoding: "utf-8" }));
  const ret = new Deployment(script_output.Greeter, script_output.GreeterLib);
  console.log("Deployment results: ", JSON.stringify(ret));
  return ret;
}

describe("Integration tests", function () {
  this.timeout(300000)
  describe("Hardhat Runtime Environment extension", function () {
    useEnvironment("hardhat-project");

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
      const calldata = (await promisify(exec)('seth calldata "greet()(string)"', { encoding: "utf-8", timeout: 10000 })).stdout.trim();
      const hevm_cmd = `hevm exec --calldata ${calldata} --address ${deployment.Greeter} --trace --rpc http://127.0.0.1:8545 --gas 1000000 --json-file cache/dapp/combined.solc.json; true`
      console.log("Executing: ", hevm_cmd);
      // `hevm trace` prints the trace to stderr
      const trace = (await promisify(exec)(hevm_cmd, { encoding: "utf-8", timeout: 10000 })).stderr
        .trim()
        .replace(/\x1b.*?m/g, "")
      console.log("Output: \n", trace);
      expect(trace).to.match(/FnEnter\("greet"\)\s+\(contracts\/Greeter.sol:24\)/);
      expect(trace).to.match(/FnEnter\("computeGreet"\)\s+\(contracts\/Greeter.sol:17\)/);
      expect(trace).to.match(/delegatecall\s\w+::compute\(\)\s+\(contracts\/Greeter.sol:18\)/);
      expect(trace).to.match(/"hello from lib"/);
      expect(trace).to.match(/FnExit\("computeGreet"\)\s+\(contracts\/Greeter.sol:19\)/);
    });
  });
});
