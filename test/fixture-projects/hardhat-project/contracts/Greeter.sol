//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Lib.sol";

contract Greeter {
    string private greeting;

    event FnEnter(string fn);
    event FnExit(string fn);

    constructor(string memory _greeting) {
        greeting = _greeting;
    }

    function computeGreet(string memory input) public returns(string memory) {
        emit FnEnter("computeGreet");
        string memory ret = string(abi.encodePacked(input, ".", GreeterLib.compute()));
        emit FnExit("computeGreet");
        return ret;
    }

    function greet() external returns (string memory) {
        emit FnEnter("greet");
        string memory ret = computeGreet(greeting);
        revert(ret);
    }

    function setGreeting(string memory new_greeting) public {
        greeting = new_greeting;
    }
}
