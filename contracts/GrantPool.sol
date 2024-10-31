// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GrantPool {
        struct Grant {
        address proposer;
        string nameOfProject;
        string projectDescription;    
        uint256 amountRequested;
        uint256 amountReleased;
        bool isApproved;           
        bool isFinalized;   
        uint256 votes;
    }

    Grant[] public grantsProposal;
    mapping(address => uint256) public contributions;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    uint256 public totalFundsInPool;
    uint256 public NumberOfVotesRequiredToApprove = 5;

    address public owner;

     constructor(){
        owner = msg.sender;
    }

    event ApplyForGrant(uint256 id, address proposer, string indexed  nameOfProject, string indexed  projectDescription, uint256 amountRequsted);
    event Contribution(address indexed contributor, uint256 amount);
    event GrantFinalized(uint256 indexed id, bool approved);
    event Vote(uint256 indexed id, address indexed voter);
    event FundsReleased(uint256 indexed id, uint256 amountReleased, uint256 totalReleased);

      modifier onlyOwner(){
        require(msg.sender == owner, "Only owner can access");
        _;
    }

    function applyForGrant(string memory _projectName, string memory _projectDescr, uint256 _amountRequested) external {
    require(msg.sender != address(0), "Zero address is not allowed");
    Grant memory applyforGrant;
    applyforGrant.nameOfProject = _projectName;
    applyforGrant.projectDescription = _projectDescr;
    applyforGrant.amountRequested= _amountRequested;
    applyforGrant.amountReleased = 0;
    applyforGrant.isApproved= false;
    applyforGrant.isFinalized= false;
    applyforGrant.votes= 0;
    applyforGrant.proposer = msg.sender;

    grantsProposal.push(applyforGrant);

    emit ApplyForGrant(grantsProposal.length - 1, msg.sender, _projectName, _projectDescr, _amountRequested);
    }

    function contribute() external payable {
        require(msg.value > 0, "Amount must be greater than 0");

        contributions[msg.sender] += msg.value;
        totalFundsInPool += msg.value;
        emit Contribution(msg.sender, msg.value);
    }

    function voteOnGrant(uint256 _id) external {
        require(contributions[msg.sender] > 0, "Not a contributor");
        require(_id < grantsProposal.length, "Invalid grant ID");
        require(!grantsProposal[_id].isFinalized, "Grant is already finalized");
        require(!hasVoted[_id][msg.sender], "Already voted");
      
        Grant storage grant = grantsProposal[_id];
        hasVoted[_id][msg.sender] = true;
        grant.votes++;

        emit Vote(_id, msg.sender);

        if (grant.votes >= NumberOfVotesRequiredToApprove) {
            grant.isApproved = true;
        }
    }
    
        function releaseFunds(uint256 _id, uint256 _amount) onlyOwner external payable  {
        require(_id < grantsProposal.length, "Invalid grant ID");
        Grant storage grant = grantsProposal[_id];

        require(grant.isApproved, "Grant not approved");
        require(!grant.isFinalized, "Grant is finalized");
        require(grant.amountReleased + _amount <= grant.amountRequested, "Exceeds requested amount");
        require(totalFundsInPool >= _amount, "Insufficient pool funds");

        grant.amountReleased += _amount;
        totalFundsInPool -= _amount;
        payable(grant.proposer).transfer(_amount);

        emit FundsReleased(_id, _amount, grant.amountReleased);

        if (grant.amountReleased == grant.amountRequested) {
            grant.isFinalized = true;
            emit GrantFinalized(_id, true);
        }
    }

    function getGrantDetails(uint256 _id) external view returns (
        address proposer,
        string memory nameOfProject,
        string memory projectDescription,
        uint256 amountRequested,
        uint256 amountReleased,
        bool isApproved,
        bool isFinalized,
        uint256 votes
    ) {
        require(_id < grantsProposal.length, "Invalid grant ID");

        Grant memory grant = grantsProposal[_id];
        return (
            grant.proposer,
            grant.nameOfProject,
            grant.projectDescription,
            grant.amountRequested,
            grant.amountReleased,
            grant.isApproved,
            grant.isFinalized,
            grant.votes
        );
    }

    function getAllGrantProposal() view external returns(Grant[] memory) {
        return grantsProposal;
    }

}