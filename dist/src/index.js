"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
const promises_1 = require("fs/promises");
const path_1 = require("path");
async function dumpInputs(root, inputs) {
    const sources = inputs["input"]["sources"];
    for (const file_name_fragment in sources) {
        const file_name = (0, path_1.join)(root, file_name_fragment);
        await (0, promises_1.mkdir)((0, path_1.dirname)(file_name), { recursive: true });
        await (0, promises_1.writeFile)(file_name, sources[file_name_fragment]["content"]);
    }
}
const COMBINED_FILE_NAME = "combined.solc.json";
(0, config_1.task)("dapp-export")
    .setDescription("Export sourcemap file that dapptools can use")
    .setAction(async function (args, hre, runSuper) {
    const dapp_root = (0, path_1.join)(hre.config.paths.cache, "dapp");
    // clean
    await (0, promises_1.rm)(dapp_root, { recursive: true, force: true });
    await (0, promises_1.mkdir)(dapp_root, { recursive: true });
    let files_generated = 0;
    for (const task of ["compile:solidity:solc:run", "compile:solidity:solcjs:run"]) {
        (0, config_1.subtask)(task).setAction(async function (args, hre, runSuper) {
            const output_file = (0, path_1.join)(dapp_root, COMBINED_FILE_NAME) + (files_generated > 0 ? `.${files_generated}` : "");
            const output = await runSuper(args);
            await (0, promises_1.writeFile)(output_file, JSON.stringify(output, undefined, 2));
            await dumpInputs(dapp_root, args);
            console.log(`[HARDHAT-DAPP]\t${output_file}`);
            files_generated++;
            return output;
        });
    }
    await hre.run("compile", { quiet: true, force: true });
    return files_generated;
});
(0, config_1.task)("dapp-link")
    .setDescription("Link sourcemap file with libraries. Example: hardhat dapp-link YieldMath:0x3ffb52852Fb8F06f74775bFd1a669d585f89cd77 YieldMathExtensions:0x6464F2cAd1e071e05F38562C38D94d8Cc49B4f99")
    .addVariadicPositionalParam("libs")
    .addOptionalParam("file", "combined.solc.json file to link", COMBINED_FILE_NAME)
    .setAction(async function (args, hre, runSuper) {
    const library_addresses = new Map(args["libs"].map(v => {
        const parts = v.split(":");
        if (parts.length != 2) {
            throw new Error(`Bad library format: ${v}`);
        }
        if (parts[1].toLowerCase().startsWith("0x")) {
            parts[1] = parts[1].substr(2);
        }
        if (parts[1].length != 40) {
            throw new Error(`Bad library address length: ${parts[1].length}; expected: 40`);
        }
        return [parts[0], parts[1]];
    }));
    const combined_file = (0, path_1.join)(hre.config.paths.cache, "dapp", args["file"]);
    const combined = JSON.parse(await (0, promises_1.readFile)(combined_file, { encoding: "utf-8" }));
    for (const sol_file of Object.values(combined["contracts"])) {
        for (const contract of Object.values(sol_file)) {
            for (const bytecode_obj of [contract["evm"]["deployedBytecode"], contract["evm"]["bytecode"]]) {
                const refs = bytecode_obj["linkReferences"];
                for (const ref of Object.values(refs)) {
                    for (const lib_name in ref) {
                        for (const { length, start } of ref[lib_name]) {
                            if (library_addresses.has(lib_name)) {
                                const bytecode = bytecode_obj["object"].slice();
                                bytecode_obj["object"] =
                                    bytecode.substr(0, start * 2)
                                        + library_addresses.get(lib_name)
                                        + bytecode.substr((start + length) * 2);
                                console.log(`Linked ${lib_name}: ${bytecode.substr(start * 2, length * 2)} -> ${bytecode_obj["object"].substr(start * 2, length * 2)}`);
                            }
                            else {
                                throw new Error(`Unknown library: ${lib_name}; known libraries: ${Array.from(library_addresses.keys())}`);
                            }
                        }
                    }
                }
            }
        }
    }
    await (0, promises_1.writeFile)(combined_file, JSON.stringify(combined, undefined, 2));
    console.log("[HARDHAT-DAPP] linked: ", combined_file);
});
//# sourceMappingURL=index.js.map