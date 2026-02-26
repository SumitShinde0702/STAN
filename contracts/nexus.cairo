#[starknet::contract]
mod Nexus {
    use starknet::ContractAddress;
    use starknet::get_caller_address;

    #[storage]
    struct Storage {
        // Maps agent account to the committed capability root hash.
        capability_roots: LegacyMap::<ContractAddress, felt252>,
        // Tracks whether a proof hash has been accepted by the Nexus.
        verified_proofs: LegacyMap::<felt252, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CapabilityRegistered: CapabilityRegistered,
        ProofVerified: ProofVerified,
    }

    #[derive(Drop, starknet::Event)]
    struct CapabilityRegistered {
        agent: ContractAddress,
        capability_root: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct ProofVerified {
        agent: ContractAddress,
        capability_root: felt252,
        proof_hash: felt252,
    }

    #[external(v0)]
    fn register_capability_root(ref self: ContractState, capability_root: felt252) {
        let caller = get_caller_address();
        self.capability_roots.write(caller, capability_root);
        self.emit(Event::CapabilityRegistered(CapabilityRegistered {
            agent: caller,
            capability_root,
        }));
    }

    #[external(v0)]
    fn submit_execution_proof(
        ref self: ContractState,
        agent: ContractAddress,
        proof_hash: felt252,
        expected_capability_root: felt252,
    ) {
        let registered_root = self.capability_roots.read(agent);
        assert(registered_root == expected_capability_root, 'CAPABILITY_ROOT_MISMATCH');

        // TODO: wire the actual STARK verifier syscall integration.
        // For hackathon scaffold, the proof hash acts as the verification artifact.
        assert(proof_hash != 0, 'INVALID_PROOF_HASH');

        self.verified_proofs.write(proof_hash, true);
        self.emit(Event::ProofVerified(ProofVerified {
            agent,
            capability_root: expected_capability_root,
            proof_hash,
        }));
    }

    #[view]
    fn get_capability_root(self: @ContractState, agent: ContractAddress) -> felt252 {
        self.capability_roots.read(agent)
    }

    #[view]
    fn is_proof_verified(self: @ContractState, proof_hash: felt252) -> bool {
        self.verified_proofs.read(proof_hash)
    }
}
