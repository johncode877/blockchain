const { ethers } = require("hardhat");
const { expect } = require("chai");

var gcf = ethers.getContractFactory;
var adminRole =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

var zeroAddress = "0x0000000000000000000000000000000000000000";
var pe = ethers.utils.parseEther;

function getRole(role) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role));
}

const minter_role = getRole("MINTER_ROLE");
const burner_role = getRole("BURNER_ROLE");

describe("MiTokenParaVenta + Token Implementation", function () {
  var owner, alice, bob, carl, d, e, f, g;
  var USDC, miTokenParaVenta, MiTokenParaVenta, airdrop;

  before(async function () {
    [owner, alice, bob, carl, d, e, f, g] = await hre.ethers.getSigners();
  });

  describe("Set Up", () => {
    it("Publicando Smart Contracts", async () => {
      USDC = await gcf("USDC");
      usdc = await USDC.deploy();

      MiTokenParaVenta = await gcf("MiTokenParaVenta");
      miTokenParaVenta = await MiTokenParaVenta.deploy(usdc.address);

      await usdc.grantRole(minter_role, miTokenParaVenta.address);
      await usdc.grantRole(burner_role, miTokenParaVenta.address);
    });

    it("purchaseFixRate - no tiene suficiente USDC", async () => {
      var amountUsdc = pe("100");
      await usdc.mint(alice.address, amountUsdc);

      await expect(
        miTokenParaVenta.connect(alice).purchaseFixRate(pe("1000"))
      ).to.be.revertedWith("No tiene suficiente UDSC");
    });

    it("purchaseFixRate - no dio permiso", async () => {
      await expect(
        miTokenParaVenta.connect(alice).purchaseFixRate(pe("100"))
      ).to.be.revertedWith("No tiene suficiente permiso");
    });

    it("purchaseFixRate - compra tokens exitosamente", async () => {
      await usdc.connect(alice).approve(miTokenParaVenta.address, pe("100"));
      await miTokenParaVenta.connect(alice).purchaseFixRate(pe("100"));
    });

    it("purchaseFixRate - tipo de cambio correcto", async () => {
      var bal = await miTokenParaVenta.balanceOf(alice.address);
      var ratio = 25;
      expect(bal).to.be.equal(pe("100").mul(ratio));
      expect(await usdc.balanceOf(alice.address)).to.be.equal(0);
    });

    it("purchaseFixRate - contrato MTPV recibe USDC", async () => {
      expect(await usdc.balanceOf(miTokenParaVenta.address)).to.be.equal(
        pe("100")
      );
    });

    it("purchaseVariableRate - no tiene suficiente USDC", async () => {
      var amountUsdc = pe("100");
      await usdc.mint(bob.address, amountUsdc);

      await expect(
        miTokenParaVenta.connect(bob).purchaseVariableRate(pe("1000"))
      ).to.be.revertedWith("No tiene suficiente UDSC");
    });

    it("purchaseVariableRate - no dio permiso", async () => {
      await expect(
        miTokenParaVenta.connect(bob).purchaseVariableRate(pe("100"))
      ).to.be.revertedWith("No tiene suficiente permiso");
    });

    it("purchaseVariableRate - compra tokens exitosamente", async () => {
      await usdc.connect(bob).approve(miTokenParaVenta.address, pe("100"));
      await miTokenParaVenta.connect(bob).purchaseVariableRate(pe("100"));
    });

    it("purchaseVariableRate - tipo de cambio correcto", async () => {
      var bal = await miTokenParaVenta.balanceOf(bob.address);
      var ts = (await miTokenParaVenta.totalSupply()).div(pe("1"));
      var balTesting = pe("100").div(ts.mul(ts).sub(ts.mul(2)).add(1000));
      expect(bal).to.be.equal(balTesting);
      expect(await usdc.balanceOf(bob.address)).to.be.equal(0);
    });

    it("purchaseVariableRate - contrato MTPV recibe USDC", async () => {
      expect(await usdc.balanceOf(miTokenParaVenta.address)).to.be.equal(
        pe("200")
      );
    });
  });
});
