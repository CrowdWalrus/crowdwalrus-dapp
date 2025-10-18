import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { UserPlus } from "lucide-react";

interface VerifierManagementPanelProps {
  onGrantAccess: (address: string) => Promise<void>;
  isProcessing: boolean;
}

export function VerifierManagementPanel({
  onGrantAccess,
  isProcessing,
}: VerifierManagementPanelProps) {
  const [verifierAddress, setVerifierAddress] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifierAddress.trim()) return;

    await onGrantAccess(verifierAddress.trim());
    // Clear input on success
    setVerifierAddress("");
  };

  return (
    <Card className="border-black-50 rounded-3xl">
      <CardHeader className="p-6">
        <CardTitle className="text-xl font-semibold text-black-500">
          Verifier Management
        </CardTitle>
        <CardDescription className="text-base text-black-400">
          Grant VerifyCap access to new verifiers. Only AdminCap holders can perform this action.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="verifier-address" className="text-sm font-medium text-black-500">
              Verifier Sui Address
            </label>
            <Input
              id="verifier-address"
              type="text"
              placeholder="0x..."
              value={verifierAddress}
              onChange={(e) => setVerifierAddress(e.target.value)}
              disabled={isProcessing}
              className="rounded-lg border-black-50"
            />
          </div>
          <Button
            type="submit"
            disabled={isProcessing || !verifierAddress.trim()}
            className="bg-blue-500 text-white-50 rounded-lg px-6 py-2.5 gap-2 min-h-[40px] hover:bg-blue-600 w-full sm:w-auto sm:self-end"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {isProcessing ? "Granting Access..." : "Grant Access"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
