// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GrantPoolModule = buildModule("GrantPoolModule", (m) => {

  const grantPoolModule = m.contract("GrantPool", );

  return { grantPoolModule };
});

export default GrantPoolModule;