
# Who pays for what under what conditions?

Bounty creators include a deposit that covers storage and a fee to pay nodes upon successful completion of a job. These fees are consumed either partially or entirely depending on a variety of factors:
* 
The contract will always try to reimburse gas to nodes who have posted an accepted answer, even if the bounty is cancelled or times out



| condition                                      | storage_fee         | node_fee                                                                      |
|------------------------------------------------|---------------------|:------------------------------------------------------------------------------|
| Bounty cancelled by creator                    | Taken               | Nodes that posted answer get payout ((Answered Nodes/Total Nodes) * Node Fee) |
| Exit 1 from Docker execute                     | Taken               | Partial(?) Taken(?)                                                           |
| Bounty times out                               | Partial for metrics | Reimbursed                                                                    |
| Runtime error when retrieving                  | Partial for metrics |                                                                               |
| Node rejects election (not enough memory, etc) | Reimbursed          | Reimbursed                                                                    |
Execution 