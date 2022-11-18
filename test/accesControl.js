const { ethers } = require("hardhat");
const { expect } = require("chai");

var gcf = ethers.getContractFactory;
var adminRole =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

describe("Access Control", function () {
  var owner, alice, bob, carl;
  var AccessControl, accessControl;

  before(async function () {
    [owner, alice, bob, carl] = await hre.ethers.getSigners();
  });

  describe("Set Up", () => {
    it("Publicando Smart Contracts", async () => {
      AccessControlL = await gcf("AccessControlLearning");
      accessControlL = await AccessControlL.deploy();
      await accessControlL.deployed();
    });
  });

  describe("Testing Access Role", () => {
    it("Admin/deployer tiene el rol DEFAULT_ADMIN_ROLE", async () => {
      expect(await accessControlL.hasRole(owner.address, adminRole)).to.be.true;
    });

    it("'grantRole' solo llamado por DEFAULT_ADMIN_ROLUE", async () => {
      await expect(
        accessControlL.connect(alice).grantRole(alice.address, adminRole)
      ).to.be.rejectedWith("Cuenta no tiene el rol necesario");
    });

    it("Admin otorga 'admin' role a Alice", async () => {
      await accessControlL.grantRole(alice.address, adminRole);
      expect(await accessControlL.hasRole(alice.address, adminRole)).to.be.true;
    });

    it("Alice transfiere rol a Bob", async () => {
      await accessControlL.connect(alice).transferOwnership(bob.address);
      expect(await accessControlL.hasRole(bob.address, adminRole)).to.be.true;
      expect(await accessControlL.hasRole(alice.address, adminRole)).to.be
        .false;
    });

    it("Bob renuncia a su rol de 'admin'", async () => {
      await accessControlL.connect(bob).renounceOwnership();
      expect(await accessControlL.hasRole(bob.address, adminRole)).to.be.false;
    });

    it("Rol temporal asignado a Carl", async () => {
      await accessControlL.grantRoleTemporarily(carl.address, adminRole, 2);
      var [isTemp, remaining] = await accessControlL.hasTemporaryRole(
        carl.address,
        adminRole
      );
      
      expect(isTemp).to.be.true;
      expect(remaining).to.be.equal(2);
      await accessControlL.connect(carl).grantRole(bob.address, adminRole);
      var [isTemp, remaining] = await accessControlL.hasTemporaryRole(
        carl.address,
        adminRole
      );
      expect(isTemp).to.be.true;
      expect(remaining).to.be.equal(1);
      await accessControlL.connect(carl).grantRole(bob.address, adminRole);
      var [isTemp, remaining] = await accessControlL.hasTemporaryRole(
        carl.address,
        adminRole
      );
      expect(isTemp).to.be.false;
      expect(remaining).to.be.equal(0);
    });
  });
});
