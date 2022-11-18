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

async function advanceTime(extratime) {
  var blockNumBefore = await ethers.provider.getBlockNumber();
  var blockBefore = await ethers.provider.getBlock(blockNumBefore);
  var timestampBefore = blockBefore.timestamp;
  await network.provider.send("evm_setNextBlockTimestamp", [
    timestampBefore + extratime,
  ]);
  await network.provider.send("evm_mine");
}

describe("Airdrop + Token Implementation", function () {
  var owner, alice, bob, carl, d, e, f, g;
  var TokenAIRDRP, tokenAIRDRP, Airdrop, airdrop;

  before(async function () {
    [owner, alice, bob, carl, d, e, f, g] = await hre.ethers.getSigners();
  });

  describe("Set Up", () => {
    it("Publicando Smart Contracts", async () => {
      TokenAIRDRP = await gcf("TokenAIRDRP");
      tokenAIRDRP = await TokenAIRDRP.deploy();

      Airdrop = await gcf("Airdrop");
      airdrop = await Airdrop.deploy(tokenAIRDRP.address);

      await tokenAIRDRP.grantRole(minter_role, airdrop.address);
      await tokenAIRDRP.grantRole(burner_role, airdrop.address);
    });
  });

  describe("Airdrop whitelist", () => {
    it("addToWhiteListBatch - Solo llamado por 'admin'", async () => {
      await expect(
        airdrop.connect(alice).addToWhiteListBatch([bob.address, carl.address])
      ).to.be.revertedWith(
        `AccessControl: account ${String(
          alice.address
        ).toLowerCase()} is missing role ${adminRole}`
      );
    });

    it("mintWithWhiteList - falla si no está en whitelist", async () => {
      await expect(airdrop.connect(bob).mintWithWhiteList()).to.be.revertedWith(
        "Participante no esta en whitelist"
      );
    });

    it("mintWithWhiteList - obtiene tokens con éxito", async () => {
      await airdrop.addToWhiteListBatch([alice.address, bob.address]);
      await airdrop.connect(alice).mintWithWhiteList();
      await airdrop.connect(bob).mintWithWhiteList();
      var min = pe("1");
      var max = pe("1000");

      var balAlice = await tokenAIRDRP.balanceOf(alice.address);
      var balBob = await tokenAIRDRP.balanceOf(bob.address);
      expect(balAlice.gte(min) && balAlice.lte(max)).to.be.true;
      expect(balBob.gte(min) && balBob.lte(max)).to.be.true;
    });

    it("mintWithWhiteList - no participa dos veces", async () => {
      await expect(
        airdrop.connect(alice).mintWithWhiteList()
      ).to.be.revertedWith("Participante no esta en whitelist");
      await expect(airdrop.connect(bob).mintWithWhiteList()).to.be.revertedWith(
        "Participante no esta en whitelist"
      );
    });

    it("mintWithWhiteList - después de 24h no obtiene tokens", async () => {
      await airdrop.addToWhiteListBatch([carl.address]);

      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const timestampBefore = blockBefore.timestamp;

      await network.provider.send("evm_setNextBlockTimestamp", [
        timestampBefore + 24 * 60 * 60 + 1000,
      ]);
      await network.provider.send("evm_mine");

      await expect(
        airdrop.connect(carl).mintWithWhiteList()
      ).to.be.revertedWith("Pasaron mas de 24 horas");
    });
  });

  describe("Airdrop bluelist", () => {
    it("addToBlueListBatch - Solo llamado por 'admin'", async () => {
      await expect(
        airdrop.connect(alice).addToBlueListBatch([bob.address, carl.address])
      ).to.be.revertedWith(
        `AccessControl: account ${String(
          alice.address
        ).toLowerCase()} is missing role ${adminRole}`
      );
    });

    it("mintWithBlueList - falla si no está en bluelist", async () => {
      await expect(airdrop.connect(bob).mintWithBlueList()).to.be.revertedWith(
        "Participante no esta en bluelist"
      );
    });

    it("mintWithBlueList - tokens proporcional al tiempo", async () => {
      await airdrop.addToBlueListBatch([
        d.address,
        e.address,
        f.address,
        g.address,
      ]);

      var firstAmnt = pe("7500");
      var secondAmnt = pe("5000");
      var thirdAmnt = pe("2500");

      // advance 900 sec
      await advanceTime((60 * 60) / 4);

      // d mints
      await airdrop.connect(d).mintWithBlueList();
      var dBal = await tokenAIRDRP.balanceOf(d.address);
      expect(dBal).to.be.closeTo(firstAmnt, firstAmnt.div(50));

      // advance 900 sec
      await advanceTime(900);

      // e mints
      await airdrop.connect(e).mintWithBlueList();
      var eBal = await tokenAIRDRP.balanceOf(e.address);
      expect(eBal).to.be.closeTo(secondAmnt, secondAmnt.div(50));

      // advance 900 sec
      await advanceTime(900);

      // f mints
      await airdrop.connect(f).mintWithBlueList();
      var fBal = await tokenAIRDRP.balanceOf(f.address);
      expect(fBal).to.be.closeTo(thirdAmnt, thirdAmnt.div(50));
    });

    it("mintWithBlueList - error si pasaron mas de 60 min", async () => {
      // advance 900 sec
      await advanceTime(900);

      // f mints
      await expect(airdrop.connect(g).mintWithBlueList()).to.be.revertedWith(
        "Pasaron mas de 60 minutos"
      );
    });

    it("mintWithBlueList - no participa dos veces", async () => {
      await expect(airdrop.connect(d).mintWithBlueList()).to.be.revertedWith(
        "Participante no esta en bluelist"
      );
      await expect(airdrop.connect(e).mintWithBlueList()).to.be.revertedWith(
        "Participante no esta en bluelist"
      );
    });
  });

  describe("Quemar tokens", () => {
    it("burnMyTokensToParticipate - no tiene suficientes tokens", async () => {
      await expect(
        airdrop.connect(g).burnMyTokensToParticipate()
      ).to.be.revertedWith("No tiene suficientes tokens para quemar");
    });

    it("burnMyTokensToParticipate - ya esta en lista blanca", async () => {
      await tokenAIRDRP.mint(g.address, pe("1000"));
      await airdrop.addToWhiteListBatch([g.address]);
      await expect(
        airdrop.connect(g).burnMyTokensToParticipate()
      ).to.be.revertedWith("Esta en lista blanca");
    });

    it("burnMyTokensToParticipate - solicita tokens", async () => {
      await tokenAIRDRP.mint(f.address, pe("1000"));
      await airdrop.connect(f).burnMyTokensToParticipate();
      await airdrop.connect(f).mintWithWhiteList();
    });
  });
});
