
import { supabase } from "@/integrations/supabase/client";
import { auditLogger } from "./auditLogger";

export interface SmartContract {
  id: string;
  contract_address: string;
  contract_type: 'credential_registry' | 'verification' | 'dispute_resolution';
  network: 'ethereum' | 'polygon' | 'binance';
  abi: any;
  deployment_transaction_hash: string;
  deployment_block_number: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SmartContractInteraction {
  id: string;
  contract_id: string;
  transaction_hash: string;
  function_name: string;
  input_data: any;
  output_data?: any;
  gas_used?: number;
  gas_price?: number; // Changed to number to match database schema
  transaction_fee?: number;
  status: 'pending' | 'confirmed' | 'failed';
  block_number?: number;
  confirmation_count: number;
  error_message?: string;
  initiated_by: string;
  created_at: string;
  confirmed_at?: string;
}

class SmartContractService {
  async deployContract(
    contractType: SmartContract['contract_type'],
    network: SmartContract['network'],
    abi: any,
    userId: string
  ): Promise<SmartContract> {
    try {
      // Simulate contract deployment
      const deploymentHash = `0x${crypto.randomUUID().replace(/-/g, '')}`;
      const contractAddress = `0x${crypto.randomUUID().replace(/-/g, '').substring(0, 40)}`;
      const blockNumber = Math.floor(Math.random() * 1000000) + 15000000;

      const { data, error } = await supabase
        .from('smart_contracts')
        .insert({
          contract_address: contractAddress,
          contract_type: contractType,
          network,
          abi,
          deployment_transaction_hash: deploymentHash,
          deployment_block_number: blockNumber,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      const contract = data as unknown as SmartContract;

      await auditLogger.logOperation({
        user_id: userId,
        operation_type: 'issue',
        operation_details: {
          action: `Smart contract deployed`,
          metadata: {
            contract_type: contractType,
            network,
            contract_address: contractAddress
          },
          result: 'success'
        },
        transaction_hash: deploymentHash,
        block_number: blockNumber
      });

      return contract;
    } catch (error) {
      console.error('Error deploying smart contract:', error);
      throw error;
    }
  }

  async interactWithContract(
    contractId: string,
    functionName: string,
    inputData: any,
    userId: string
  ): Promise<SmartContractInteraction> {
    try {
      const transactionHash = `0x${crypto.randomUUID().replace(/-/g, '')}`;
      const gasUsed = Math.floor(Math.random() * 200000) + 21000;
      const gasPrice = Math.floor(Math.random() * 100) + 20; // Use number instead of BigInt

      const { data, error } = await supabase
        .from('smart_contract_interactions')
        .insert({
          contract_id: contractId,
          transaction_hash: transactionHash,
          function_name: functionName,
          input_data: inputData,
          gas_used: gasUsed,
          gas_price: gasPrice, // Now passing as number
          transaction_fee: (gasPrice * gasUsed) / 1e9, // Simplified calculation
          status: 'pending',
          initiated_by: userId
        })
        .select()
        .single();

      if (error) throw error;

      const interaction = data as unknown as SmartContractInteraction;

      // Simulate transaction confirmation after a delay
      setTimeout(async () => {
        await this.confirmTransaction(interaction.id, Math.floor(Math.random() * 1000000) + 15000000);
      }, 2000);

      return interaction;
    } catch (error) {
      console.error('Error interacting with smart contract:', error);
      throw error;
    }
  }

  private async confirmTransaction(interactionId: string, blockNumber: number) {
    await supabase
      .from('smart_contract_interactions')
      .update({
        status: 'confirmed',
        block_number: blockNumber,
        confirmation_count: 6,
        confirmed_at: new Date().toISOString()
      })
      .eq('id', interactionId);
  }

  async getActiveContracts(): Promise<SmartContract[]> {
    const { data, error } = await supabase
      .from('smart_contracts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as SmartContract[];
  }

  async getContractInteractions(contractId: string): Promise<SmartContractInteraction[]> {
    const { data, error } = await supabase
      .from('smart_contract_interactions')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as SmartContractInteraction[];
  }
}

export const smartContractService = new SmartContractService();
