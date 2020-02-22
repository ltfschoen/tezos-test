* Tezos chain prunes zero balance accounts (security mechanism to prevent replay attacks)

* Two different types of accounts in Tezos: TZ addresses are implicit accounts, as opposed to Contract accounts

* Babylon allows deploying a Delegation Contract. See `deployDelegationContract`
  * Delegation Accounts 
  * Allows delegating to multiple Bakers

* PoS in Tezos is called "liquid" PoS
  * Given a balance, participation pays inflationary
  * If delegate balance, you retain direct control of the balance
  * Delegate balance to a Baker (the rights to create blocks belongs to them)
  * Delegation takes 12 cycles before get reward (i.e. 64 Tezos reward). Delegator gets share of the reward
  * In other chains, may not have control of your balance when delegating, so harder to withdraw until after a few days.

* `depositDelegatedFunds` takes effect after 5 cycles
  * Old Baker will still keep giving rewards to you for delegating to them for another 5 cycles if discontinue delegating

* Michelson is Tezos smart contract language, however binary format is deployed to the chain.
* Convert Michelson to JSON so can deploy to API endpoint.

* Endpoint for fees. It stores min/max per block. Use to calculate cost of a transaction for simple transfers.
*  For contract invokations, it depends on different variables including storage state.
* `testContractInvocationOperation` asks RPC service to sample the tx and check if it succeeds. If it succeeds, what did it cost (i.e. gas and storage fees) as an estimate

* `awaitOperationConfirmation` waits for ~5 blocks, where Tezos block time is ~1 minute

* Arronex.io
  * Blocks
    * Period - ever period there's a governance event (14s + ...)
    * Cycle - collection of blocks
    * Priority 
      * Note: Block creation assigned to a Baker upfront (7s ahead)
      * Lower number of Priority 2 Bakers indicates robustness
  * Operations
    * Transactions could be Implicit Accounts or Contract Accounts
    * There are 30 different types of contracts (i.e. types of applications) on Tezos mainnet, and most people are  using delegation contracts and multi-sigs. On Babylon testnet there are approx 300.

* Bakers run a script for distributing rewards to their delegators

* Contract patterns
  * Permanent deployment. There's an isssue with upgradable contracts. What if execute transaction when upgraded and the upgrade wasn't audited. Immutability is part of security.
  * Privileged access - i.e. change the Baker, etc (see Arronex.io, go to Accounts, and where Delegation has occurred and Storage has a value of 'tz1...' it means only that account has permission)
  * Unspendable funds
  * Whitelist - i.e. Clients
  * State rescue - Delegation contract doesn't have any logic in it (just execute the lambda expression), which is a security issue (i.e. tx tokens), but bypassing the lambda is good for testing since can do anything you want
* Contract Heresy
  * Upgradability
  * Arbitrary Code Execution
  * Lambda Storage
