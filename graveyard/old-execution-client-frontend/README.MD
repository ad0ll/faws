This is a basic frontend for the execution client. It provides basic diagnostics for node operators so they can troubleshoot issues with their node.

The execution client is supposed to be chain neutral (however, currently only supports NEAR). Chain specific implementations can be found under `drivers/*`. The interface for a new driver can be found at `drivers/types.d.ts`


