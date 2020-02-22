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

* Alternatives to SmaryPy
  * smartpy - native
  * pytezos - like ConseilJS
  * tezoskit - macOS
  * taqito - react tezos
  * soltes - ?

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

* Interaction Patterns
  * Ping
  * Invoke
  * Fund - Contracts cannot do anything with funds held in them by themselves
  * Chain - Entrypoint returns data to you so you can make decisions and take action

* Gas limit on block is 125000 gas at the moment, so can only do a few of them

* Writing Smart Contracts with Tezos
  * http://smartpy.io/demo/#/
    * Gitlab repo: https://gitlab.com/SmartPy/smartpy
    * Write, test, and deploy contract
    * Allows testing contract without deploying, simulating state transitions under certain conditions (i.e. whether storage has this or that)
    * Contract can have Date-based logic
    * Note: Use http://smartpy.io/dev, since want to be able to Divide, and only available in the Developer environment

  * SmartPy Examples
    * Go to http://smartpy.io/dev/
    * Click "File", and it lists different examples
  
  * Other Examples
    * https://github.com/Cryptonomic/Smart-Contracts/tree/master/tezos

* Repos
  * Conseil - indexor
  * Tezori - Wallet that uses config file to connect to different endpoints
  * T2 - TypeScript rewrite of Gallean

* Mutez
  * Smallest amount on Tezos (i.e. 1,000,000). `sp.tez(1)`

* Trustless Staking Token Tests
  * Deploy a forward contract and make returns
  * Invite investments 
  * Delegation allows participants to obtain inflationary returns from Bakers
    * Trust that Baker is competent that they don't miss their slot and get reward
    * Trust they don't change the amount they pay to you, or to notify you, and no way to complain
  * Tezos deploy to a smart contract, and instrument that delegated to Baker, guaranteeing rewards from Bakers
    * Contract deploys instrument with 1000 Tez balance, for 1 year, and contract returns 5%, so anyone may deposit funds,
    returning to them x Tez at expiration. If contract is fully subscribed it may allow up to 20,000 Tez, so max return
    may be say 21,000 Tez after a year.
    * Manager allowed to withdraw
    * Manager may delegate to a different Baker (risk component)
      * If take on this risk, can take on bigger rewards (i.e. 7% on 1000, and 5% on 20000 deposit)
    * At any point the tokens could be redeemed for a balance in Tez
  * Opposite of Compound and Discounting. If investor withdraws early, they get less, but that's up to the issuer,
  depending on how many periods it's split into.
    * Only way storage can change is when new investor arrives, or when an investor wants to withdraw, since immutable.
  * Explanation
    * Note: Not all types may be wrapped in a type definition (i.e. `schedule` isn't, see Michelson code, `map %schedule in ...`, whereas others are `TInterval`)
    * schedule - discount period
    * interval - compount interval
    * start - start date
    * freeCollateral - initial escrow balance
    * TAddress - KeyHash can only be T0, T1, T2, T3 (useful for Derivatives or DEXes)
    * approvals - allows token holders to provide an allowance (i.e. if token holder wanted to list on DEX, can allow someone to access a proportion of balance)
    * deposit (entrypoint) - 
      * Type is `address`
      * Name is `approve`
      * `default` is entry point that's called if not specified (use for collecting deposits from someone's balance)
        * Allow issuer to deposit extra collateral
        * Baker `deposits` look like regular deposits (that way they don't need a separate handler)
    * `deposit`
      * Minting depends on amount investors, and see Discount Table for frequency
      * All error checking costs money, so deposit cannot be too low.
      * `sp.verify` maps to `fail-with` in Michelson
      * `self.data.issuer` checks storage
      * Private Functions do not have an entrypoint at the front (i.e. `def getPeriod(self)`)
      * `def getPeriod(self)`
        * SmartPy has Local Variables i.e. `sp.local(...)`. It's initialized into periods
        * Compare dates, to check interval of validity we're in. Then check tokens deposited
      * Decimals can't be trustless due to CPU limitations, by doing integer and decimals separately (see `expectedReturn`). So we use `.is_some()` since division may fail
        * Divide amount deposited by the expected value at that discounting period
          * Assign first half (i.e. integer) with `tokenBalance.value`
          * Calculate expected return with `wholeCoin`
      * Lastly assign to token holder with `sp.else: ...` 
    * `redeem`
      * If want to sell future value of Tezos trustlessly, use this Trustless Staking Token Tests contract
        * Since can sell at halfway point of period
        * Allows trading at future value with others
        * The closer to expiration, the future value of the tokens becomes progressively less.
        * If `redeem` at period 20, you only get 10 periods of returns
        * Divide amount redeeming by period by amount
    * `transfer`
      * For token holders exchanging balances
      * This "Trustless Staking Token Test" contract `transfer` function is only for token transfers, we'd need a separate contract for token settlement.
    * `withdrawCollateral`
      * Since may be waiting for Baker to deposit rewards, need to check sufficient balance
  * Explanation of Tests
    * Note: The tests only run in SmartPy
    * `payer` is deprecated
    * `60*60*24*0 + 1` is 1s??
    * `sp.mutez(1021920900)` is amount of tokens you get, since it's the discounted amount of tokens
    * Can you withdraw an allowance if balance is lower than amount being requested
  * Note: `getStorageAddress` gets the storage and spits it out as JSON

* BabylonDelegationHelper.rs
  * `verifyDestination` Hash the code of contract that this works against
  * `setDelegate` just set the `delegate` instead of the complicated lambda
  * `withdrawDelegatedFunds` and `sendDelegatedFunds` (whereas `withdraw` always goes back to you)

* Other reading:
  * https://blog.octo.com/tezos-ecosystem-october-2019/
  * https://tezos.gitlab.io/

