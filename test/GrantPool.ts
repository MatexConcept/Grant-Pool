const { expect } = require("chai");
const hre = require("hardhat");

describe("GrantPool", function () {
  async function deployGrantPoolFixture() {
    const [
      owner,
      proposer,
      contributor1,
      contributor2,
      contributor3,
      contributor4,
      contributor5,
    ] = await hre.ethers.getSigners();
    const GrantPool = await hre.ethers.getContractFactory("GrantPool");
    const grantPool = await GrantPool.deploy();
    return {
      grantPool,
      owner,
      proposer,
      contributor1,
      contributor2,
      contributor3,
      contributor4,
      contributor5,
    };
  }

  it("Should allow a user to apply for a grant", async function () {
    const { grantPool, proposer } = await deployGrantPoolFixture();
    const projectName = "Charity Fundraiser";
    const projectDescription = "A project to raise funds for charity.";
    const amountRequested = hre.ethers.parseUnits("5", 18);

    await expect(
      grantPool
        .connect(proposer)
        .applyForGrant(projectName, projectDescription, amountRequested)
    )
      .to.emit(grantPool, "ApplyForGrant")
      .withArgs(
        0,
        proposer.address,
        projectName,
        projectDescription,
        amountRequested
      );

    const grant = await grantPool.getGrantDetails(0);
    expect(grant.nameOfProject).to.equal(projectName);
    expect(grant.projectDescription).to.equal(projectDescription);
    expect(grant.amountRequested).to.equal(amountRequested);
    expect(grant.isApproved).to.equal(false);
    expect(grant.isFinalized).to.equal(false);
    expect(grant.votes).to.equal(0);
  });

  it("Should allow a user to contribute to the pool", async function () {
    const { grantPool, contributor1 } = await deployGrantPoolFixture();
    const contributionAmount = hre.ethers.parseUnits("10", 18);

    await expect(
      grantPool.connect(contributor1).contribute({ value: contributionAmount })
    )
      .to.emit(grantPool, "Contribution")
      .withArgs(contributor1.address, contributionAmount);

    expect(await grantPool.contributions(contributor1.address)).to.equal(
      contributionAmount
    );
    expect(await grantPool.totalFundsInPool()).to.equal(contributionAmount);
  });

  it("Should allow contributors to vote on a grant", async function () {
    const { grantPool, proposer, contributor1, contributor2 } =
      await deployGrantPoolFixture();
    const amountRequested = hre.ethers.parseUnits("5", 18);

    await grantPool
      .connect(proposer)
      .applyForGrant("Project Alpha", "Description", amountRequested);
    await grantPool
      .connect(contributor1)
      .contribute({ value: hre.ethers.parseUnits("10", 18) });
    await grantPool
      .connect(contributor2)
      .contribute({ value: hre.ethers.parseUnits("10", 18) });

    await expect(grantPool.connect(contributor1).voteOnGrant(0))
      .to.emit(grantPool, "Vote")
      .withArgs(0, contributor1.address);

    const grantAfterVote = await grantPool.getGrantDetails(0);
    expect(grantAfterVote.votes).to.equal(1);
  });

  it("Should approve grant when enough votes are reached", async function () {
    const {
      grantPool,
      proposer,
      contributor1,
      contributor2,
      contributor3,
      contributor4,
      contributor5,
    } = await deployGrantPoolFixture();
    const amountRequested = hre.ethers.parseUnits("5", 18);

    await grantPool
      .connect(proposer)
      .applyForGrant("Project Beta", "Description", amountRequested);

    await Promise.all([
      grantPool
        .connect(contributor1)
        .contribute({ value: hre.ethers.parseUnits("10", 18) }),
      grantPool
        .connect(contributor2)
        .contribute({ value: hre.ethers.parseUnits("10", 18) }),
      grantPool
        .connect(contributor3)
        .contribute({ value: hre.ethers.parseUnits("10", 18) }),
      grantPool
        .connect(contributor4)
        .contribute({ value: hre.ethers.parseUnits("10", 18) }),
      grantPool
        .connect(contributor5)
        .contribute({ value: hre.ethers.parseUnits("10", 18) }),
    ]);

    await grantPool.connect(contributor1).voteOnGrant(0);
    await grantPool.connect(contributor2).voteOnGrant(0);
    await grantPool.connect(contributor3).voteOnGrant(0);
    await grantPool.connect(contributor4).voteOnGrant(0);
    await grantPool.connect(contributor5).voteOnGrant(0);

    const grant = await grantPool.getGrantDetails(0);
    expect(grant.isApproved).to.equal(true);
  });

  it("Should not allow a contributor to vote twice", async function () {
    const { grantPool, proposer, contributor1 } =
      await deployGrantPoolFixture();
    const amountRequested = hre.ethers.parseUnits("5", 18);

    await grantPool
      .connect(proposer)
      .applyForGrant("Project Gamma", "Description", amountRequested);
    await grantPool
      .connect(contributor1)
      .contribute({ value: hre.ethers.parseUnits("10", 18) });
    await grantPool.connect(contributor1).voteOnGrant(0);

    await expect(
      grantPool.connect(contributor1).voteOnGrant(0)
    ).to.be.revertedWith("Already voted");
  });

  it("Should not allow releasing more funds than the amount requested", async function () {
    const {
      grantPool,
      owner,
      proposer,
      contributor1,
      contributor2,
      contributor3,
      contributor4,
      contributor5,
    } = await deployGrantPoolFixture();
    const amountRequested = hre.ethers.parseUnits("5", 18);

    await grantPool
      .connect(proposer)
      .applyForGrant("Project Delta", "Description", amountRequested);

    await Promise.all([
      grantPool
        .connect(contributor1)
        .contribute({ value: hre.ethers.parseUnits("10", 18) }),
      grantPool
        .connect(contributor2)
        .contribute({ value: hre.ethers.parseUnits("10", 18) }),
      grantPool
        .connect(contributor3)
        .contribute({ value: hre.ethers.parseUnits("10", 18) }),
      grantPool
        .connect(contributor4)
        .contribute({ value: hre.ethers.parseUnits("10", 18) }),
      grantPool
        .connect(contributor5)
        .contribute({ value: hre.ethers.parseUnits("10", 18) }),
    ]);

    await Promise.all([
      grantPool.connect(contributor1).voteOnGrant(0),
      grantPool.connect(contributor2).voteOnGrant(0),
      grantPool.connect(contributor3).voteOnGrant(0),
      grantPool.connect(contributor4).voteOnGrant(0),
      grantPool.connect(contributor5).voteOnGrant(0),
    ]);

    const grant = await grantPool.getGrantDetails(0);
    expect(grant.isApproved).to.equal(true);

    const excessAmount = hre.ethers.parseUnits("6", 18);

    await expect(
      grantPool.connect(owner).releaseFunds(0, excessAmount)
    ).to.be.revertedWith("Exceeds requested amount");
  });

  it("Should correctly release approved funds to proposer and finalize the grant", async function () {
    const {
      grantPool,
      owner,
      proposer,
      contributor1,
      contributor2,
      contributor3,
      contributor4,
      contributor5,
    } = await deployGrantPoolFixture();
    const amountRequested = hre.ethers.parseUnits("2.0", 18);

    await grantPool
      .connect(proposer)
      .applyForGrant("Project Epsilon", "Description", amountRequested);

    await grantPool
      .connect(contributor1)
      .contribute({ value: hre.ethers.parseUnits("10.0", 18) });
    await grantPool
      .connect(contributor2)
      .contribute({ value: hre.ethers.parseUnits("10.0", 18) });
    await grantPool
      .connect(contributor3)
      .contribute({ value: hre.ethers.parseUnits("10.0", 18) });
    await grantPool
      .connect(contributor4)
      .contribute({ value: hre.ethers.parseUnits("10.0", 18) });
    await grantPool
      .connect(contributor5)
      .contribute({ value: hre.ethers.parseUnits("10.0", 18) });

    await grantPool.connect(contributor1).voteOnGrant(0);
    await grantPool.connect(contributor2).voteOnGrant(0);
    await grantPool.connect(contributor3).voteOnGrant(0);
    await grantPool.connect(contributor4).voteOnGrant(0);
    await grantPool.connect(contributor5).voteOnGrant(0);

    const grant = await grantPool.getGrantDetails(0);
    expect(grant.isApproved).to.equal(true);
    expect(grant.votes).to.equal(5);

    await expect(grantPool.connect(owner).releaseFunds(0, amountRequested))
      .to.emit(grantPool, "FundsReleased")
      .withArgs(0, amountRequested, amountRequested);

    const finalizedGrant = await grantPool.getGrantDetails(0);
    expect(finalizedGrant.isFinalized).to.equal(true);
  });

  it("Should return all grant proposals with their details", async function () {
    const { grantPool, proposer } = await deployGrantPoolFixture();
    const amountRequested = hre.ethers.parseUnits("5", 18);

    await grantPool
      .connect(proposer)
      .applyForGrant("Project A", "Description A", amountRequested);
    await grantPool
      .connect(proposer)
      .applyForGrant("Project B", "Description B", amountRequested);

    const grants = await grantPool.getAllGrantProposal();
    expect(grants.length).to.equal(2);

    expect(grants[0].nameOfProject).to.equal("Project A");
    expect(grants[0].projectDescription).to.equal("Description A");
    expect(grants[0].amountRequested).to.equal(amountRequested);
    expect(grants[0].isApproved).to.equal(false);
    expect(grants[0].isFinalized).to.equal(false);

    expect(grants[1].nameOfProject).to.equal("Project B");
    expect(grants[1].projectDescription).to.equal("Description B");
    expect(grants[1].amountRequested).to.equal(amountRequested);
    expect(grants[1].isApproved).to.equal(false);
    expect(grants[1].isFinalized).to.equal(false);
  });

  it("Should return a single grant proposal with its details", async function () {
    const { grantPool, proposer } = await deployGrantPoolFixture();
    const amountRequested = hre.ethers.parseUnits("5", 18);

    await grantPool
      .connect(proposer)
      .applyForGrant("Project C", "Description C", amountRequested);

    const grantDetails = await grantPool.getGrantDetails(0);
    expect(grantDetails.nameOfProject).to.equal("Project C");
    expect(grantDetails.projectDescription).to.equal("Description C");
    expect(grantDetails.amountRequested).to.equal(amountRequested);
    expect(grantDetails.isApproved).to.equal(false);
    expect(grantDetails.isFinalized).to.equal(false);
  });

  it("Should revert if pool funds are insufficient for release", async function () {
    const {
      grantPool,
      owner,
      proposer,
      contributor1,
      contributor2,
      contributor3,
      contributor4,
      contributor5,
    } = await deployGrantPoolFixture();
    const amountRequested = hre.ethers.parseUnits("20.0", 18);
    const totalContributed = hre.ethers.parseUnits("5.0", 18);

    await grantPool
      .connect(proposer)
      .applyForGrant(
        "Project Zeta",
        "Testing insufficient pool funds",
        amountRequested
      );

    await grantPool
      .connect(contributor1)
      .contribute({ value: hre.ethers.parseUnits("1.0", 18) });
    await grantPool
      .connect(contributor2)
      .contribute({ value: hre.ethers.parseUnits("1.0", 18) });
    await grantPool
      .connect(contributor3)
      .contribute({ value: hre.ethers.parseUnits("1.0", 18) });
    await grantPool
      .connect(contributor4)
      .contribute({ value: hre.ethers.parseUnits("1.0", 18) });
    await grantPool
      .connect(contributor5)
      .contribute({ value: hre.ethers.parseUnits("1.0", 18) });

    await grantPool.connect(contributor1).voteOnGrant(0);
    await grantPool.connect(contributor2).voteOnGrant(0);
    await grantPool.connect(contributor3).voteOnGrant(0);
    await grantPool.connect(contributor4).voteOnGrant(0);
    await grantPool.connect(contributor5).voteOnGrant(0);

    await expect(
      grantPool.connect(owner).releaseFunds(0, amountRequested)
    ).to.be.revertedWith("Insufficient pool funds");
  });

  it("Should correctly release approved funds to proposer and finalize the grant", async function () {
    const {
      grantPool,
      owner,
      proposer,
      contributor1,
      contributor2,
      contributor3,
      contributor4,
      contributor5,
    } = await deployGrantPoolFixture();
    const amountRequested = hre.ethers.parseUnits("2.0", 18);

    await grantPool
      .connect(proposer)
      .applyForGrant("Project Epsilon", "Description", amountRequested);

    await grantPool
      .connect(contributor1)
      .contribute({ value: hre.ethers.parseUnits("10.0", 18) });
    await grantPool
      .connect(contributor2)
      .contribute({ value: hre.ethers.parseUnits("10.0", 18) });
    await grantPool
      .connect(contributor3)
      .contribute({ value: hre.ethers.parseUnits("10.0", 18) });
    await grantPool
      .connect(contributor4)
      .contribute({ value: hre.ethers.parseUnits("10.0", 18) });
    await grantPool
      .connect(contributor5)
      .contribute({ value: hre.ethers.parseUnits("10.0", 18) });

    await grantPool.connect(contributor1).voteOnGrant(0);
    await grantPool.connect(contributor2).voteOnGrant(0);
    await grantPool.connect(contributor3).voteOnGrant(0);
    await grantPool.connect(contributor4).voteOnGrant(0);
    await grantPool.connect(contributor5).voteOnGrant(0);

    const grant = await grantPool.getGrantDetails(0);
    expect(grant.isApproved).to.equal(true);
    expect(grant.votes).to.equal(5);

    await expect(grantPool.connect(owner).releaseFunds(0, amountRequested))
      .to.emit(grantPool, "FundsReleased")
      .withArgs(0, amountRequested, amountRequested);

    const finalizedGrant = await grantPool.getGrantDetails(0);
    expect(finalizedGrant.isFinalized).to.equal(true);
  });

  it("It should not allow other accounts to release funds. Only the owner can have access to release funds", async function () {
    const {
      grantPool,
      owner,
      proposer,
      contributor1,
      contributor2,
      contributor3,
      contributor4,
      contributor5,
    } = await deployGrantPoolFixture();
    const amountRequested = hre.ethers.parseUnits("2.0", 18);

    await grantPool
      .connect(proposer)
      .applyForGrant("Project Epsilon", "Description", amountRequested);

    await grantPool
      .connect(contributor1)
      .contribute({ value: hre.ethers.parseUnits("10.0", 18) });
    await grantPool
      .connect(contributor2)
      .contribute({ value: hre.ethers.parseUnits("10.0", 18) });
    await grantPool
      .connect(contributor3)
      .contribute({ value: hre.ethers.parseUnits("10.0", 18) });
    await grantPool
      .connect(contributor4)
      .contribute({ value: hre.ethers.parseUnits("10.0", 18) });
    await grantPool
      .connect(contributor5)
      .contribute({ value: hre.ethers.parseUnits("10.0", 18) });

    await grantPool.connect(contributor1).voteOnGrant(0);
    await grantPool.connect(contributor2).voteOnGrant(0);
    await grantPool.connect(contributor3).voteOnGrant(0);
    await grantPool.connect(contributor4).voteOnGrant(0);
    await grantPool.connect(contributor5).voteOnGrant(0);

    const grant = await grantPool.getGrantDetails(0);
    expect(grant.isApproved).to.equal(true);
    expect(grant.votes).to.equal(5);

    await expect(
      grantPool.connect(contributor3).releaseFunds(0, amountRequested)
    ).to.be.revertedWith("Only owner can access");
  });
});
