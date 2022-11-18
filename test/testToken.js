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
const minter_role_temp = getRole("MINTER_ROLE_TEMP");

describe("ERC 20 Implementation", function () {
  var owner, alice, bob, carl;
  var TokenERC20_1, tokenERC20_1;
  var name = "Mi Primer Token";
  var symbol = "MPRKTKN";
  var decimals = 18;
  var cien_tokens = pe("100");
  var cincuenta_tokens = pe("50");
  var doscientos_tokens = pe("200");

  before(async function () {
    [owner, alice, bob, carl] = await hre.ethers.getSigners();
  });

  describe("Set Up", () => {
    it("Publicando Smart Contracts", async () => {
      TokenERC20_1 = await gcf("TokenERC20_1");
      tokenERC20_1 = await TokenERC20_1.deploy(name, symbol, decimals);
      await tokenERC20_1.deployed();
    });
  });

  describe("IERC20Metadata", () => {
    it("Nombre pasado por Constructor", async () => {
      expect(await tokenERC20_1.name()).to.be.equal(name);
    });
    it("Símbolo pasado por Constructor", async () => {
      expect(await tokenERC20_1.symbol()).to.be.equal(symbol);
    });
    it("Decimals pasado por Constructor", async () => {
      expect(await tokenERC20_1.decimals()).to.be.equal(decimals);
    });
  });

  describe("Mint", () => {
    var tx;

    it("Se acuña 100 tokens a favor de Alice", async () => {
      tx = await tokenERC20_1.mint(alice.address, cien_tokens);
    });

    it("El balance de Alice es 100 tokens", async () => {
      expect(await tokenERC20_1.balanceOf(alice.address)).to.be.equal(
        cien_tokens
      );
    });

    it("El balance total de tokens es 100 tokens", async () => {
      expect(await tokenERC20_1.totalSupply()).to.be.equal(cien_tokens);
    });

    it("Emite el evento 'Transfer' al hacer mint", async () => {
      await expect(tx)
        .to.emit(tokenERC20_1, "Transfer")
        .withArgs(zeroAddress, alice.address, cien_tokens);
    });

    it("Error cuando se acuña a Zero Address", async () => {
      await expect(
        tokenERC20_1.mint(zeroAddress, cien_tokens)
      ).to.be.revertedWith("Mint a favor del address zero");
    });
  });

  describe("Burn", () => {
    var tx;
    it("Alice quema 50 tokens", async () => {
      tx = await tokenERC20_1.connect(alice).burn(cincuenta_tokens);
    });

    it("El balance de Alice es 50 tokens", async () => {
      expect(await tokenERC20_1.balanceOf(alice.address)).to.be.equal(
        cincuenta_tokens
      );
    });

    it("El balance total de tokens es 50 tokens", async () => {
      expect(await tokenERC20_1.totalSupply()).to.be.equal(cincuenta_tokens);
    });

    it("Emite el evento 'Transfer' al hacer burn", async () => {
      await expect(tx)
        .to.emit(tokenERC20_1, "Transfer")
        .withArgs(alice.address, zeroAddress, cincuenta_tokens);
    });
  });

  describe("IERC20", () => {
    var tx;
    before(async function () {
      // alice -> 50 tokens
      // bob -> 100 tokens
      // carl => 50 tokens
      await tokenERC20_1.mint(bob.address, cien_tokens);
      await tokenERC20_1.mint(carl.address, cincuenta_tokens);
    });

    it("'totalSupply' de alice, bob y carl", async () => {
      expect(await tokenERC20_1.totalSupply()).to.be.equal(doscientos_tokens);
    });

    it("'balanceOf' de alice, bob y carl", async () => {
      expect(await tokenERC20_1.balanceOf(alice.address)).to.be.equal(
        cincuenta_tokens
      );
      expect(await tokenERC20_1.balanceOf(bob.address)).to.be.equal(
        cien_tokens
      );
      expect(await tokenERC20_1.balanceOf(carl.address)).to.be.equal(
        cincuenta_tokens
      );
    });

    it("'transfer' - Carl transfiere a bob", async () => {
      // balances luego de la transferencia
      // alice -> 50 tokens
      // bob -> 150 tokens
      // carl => 0 tokens

      tx = await tokenERC20_1
        .connect(carl)
        .transfer(bob.address, cincuenta_tokens);

      expect(await tokenERC20_1.balanceOf(carl.address)).to.be.equal(0);
      expect(await tokenERC20_1.balanceOf(bob.address)).to.be.equal(pe("150"));
      expect(await tokenERC20_1.totalSupply()).to.be.equal(doscientos_tokens);
      await expect(tx)
        .to.emit(tokenERC20_1, "Transfer")
        .withArgs(carl.address, bob.address, cincuenta_tokens);
    });

    it("'approve' - Bob da permiso a Carl", async () => {
      tx = await tokenERC20_1
        .connect(bob)
        .approve(carl.address, cincuenta_tokens);

      await expect(tx)
        .to.emit(tokenERC20_1, "Approval")
        .withArgs(bob.address, carl.address, cincuenta_tokens);

      await expect(
        tokenERC20_1.connect(bob).approve(zeroAddress, cien_tokens)
      ).to.be.revertedWith("Spender no puede ser zero");
    });

    it("'allowance' - Verifica permiso de Bob a Carl", async () => {
      expect(
        await tokenERC20_1.allowance(bob.address, carl.address)
      ).to.be.equal(cincuenta_tokens);
    });

    it("'transferFrom' - Alice transfiere en nombre de Bob (sin permiso)", async () => {
      expect(
        tokenERC20_1
          .connect(alice)
          .transferFrom(bob.address, alice.address, cien_tokens)
      ).to.be.revertedWith("No tiene permiso para transferir");
    });

    it("'transferFrom' - Carl transfiere en nombre de Bob (con permiso)", async () => {
      // balances luego de la transferencia
      // alice -> 100 tokens
      // bob -> 100 tokens
      // carl => 0 tokens

      tx = await tokenERC20_1
        .connect(carl)
        .transferFrom(bob.address, alice.address, cincuenta_tokens);

      await expect(tx)
        .to.emit(tokenERC20_1, "Transfer")
        .withArgs(bob.address, alice.address, cincuenta_tokens);

      expect(
        await tokenERC20_1.allowance(bob.address, carl.address)
      ).to.be.equal(0);
      expect(await tokenERC20_1.totalSupply()).to.be.equal(doscientos_tokens);
      expect(await tokenERC20_1.balanceOf(alice.address)).to.be.equal(
        cien_tokens
      );
      expect(await tokenERC20_1.balanceOf(bob.address)).to.be.equal(
        cien_tokens
      );
      expect(await tokenERC20_1.balanceOf(carl.address)).to.be.equal(0);
    });
  });

  describe("EXTRA", () => {
    before(async function () {
      await tokenERC20_1.connect(bob).approve(carl.address, cincuenta_tokens);
    });

    it("'increaseAllowance' - Bob le da adicional permiso a Carl", async () => {
      var tx = await tokenERC20_1
        .connect(bob)
        .increaseAllowance(carl.address, cincuenta_tokens);

      expect(
        await tokenERC20_1.allowance(bob.address, carl.address)
      ).to.be.equal(cien_tokens);

      await expect(tx)
        .to.emit(tokenERC20_1, "Approval")
        .withArgs(bob.address, carl.address, cien_tokens);
    });

    it("'decreaseAllowance' - Bob le quita permiso a Carl", async () => {
      var tx = await tokenERC20_1
        .connect(bob)
        .decreaseAllowance(carl.address, cien_tokens);

      expect(
        await tokenERC20_1.allowance(bob.address, carl.address)
      ).to.be.equal(0);

      await expect(tx)
        .to.emit(tokenERC20_1, "Approval")
        .withArgs(bob.address, carl.address, 0);
    });
    it("'mintProtected' - Alice puede hacer llamar metodo acuñar protegido", async () => {
      await expect(
        tokenERC20_1.connect(alice).mintProtected(bob.address, cincuenta_tokens)
      ).to.be.reverted;

      await tokenERC20_1.grantRole(alice.address, minter_role);
      await tokenERC20_1
        .connect(alice)
        .mintProtected(bob.address, cincuenta_tokens);
    });
  });
});
