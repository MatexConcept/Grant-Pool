<!-- DEPLOYED ADDRESS AND VERIFICATION FOR THE GrantPool -->

Deployed Addresses

GrantPoolModule#GrantPool - 0xB4D2BbeA53AC8Df453cd7AC58815d9f79a0d9398

Verifying deployed contracts

Verifying contract "contracts/GrantPool.sol:GrantPool" for network baseSepolia...
Contract contracts/GrantPool.sol:GrantPool already verified on network baseSepolia:
//- https://sepolia.basescan.org/address/0xB4D2BbeA53AC8Df453cd7AC58815d9f79a0d9398#code


The GrantPool smart contract allows users to apply for grants, contribute funds, vote on grant proposals, and release approved funds.

Key Features:
Grant Struct: Each Grant contains details like the proposer, project name and description, requested amount, released amount, approval and finalization status, and vote count.

Owner: The contract creator becomes the owner, with exclusive rights to release funds.

Applying for Grants: Users can propose projects for funding by calling applyForGrant(), specifying the project name, description, and requested funds. Each proposal is added to an array of grant proposals, and an ApplyForGrant event is emitted.

Contributions: Contributors can add funds to the pool by calling contribute(). Contributions are recorded per address, and the pool's total funds are updated.

Voting: Contributors (those who have contributed funds) can vote on proposals using voteOnGrant(). If the number of votes on a proposal reaches a required threshold (NumberOfVotesRequiredToApprove), the grant is approved. Each contributor can only vote once per proposal, and Vote events are emitted for each vote.

Fund Release: The owner can release funds to approved proposals by calling releaseFunds(), specifying the amount to be disbursed. If the released amount meets the requested amount, the proposal is finalized. This function ensures that the pool has sufficient funds and tracks total disbursements, emitting FundsReleased and GrantFinalized events.

Grant Details: The contract includes functions to view individual grant details (getGrantDetails) and retrieve all proposals (getAllGrantProposal).