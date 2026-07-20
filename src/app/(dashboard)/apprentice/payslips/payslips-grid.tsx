"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { SignSlipDialog } from "./sign-slip-dialog";

export interface PayslipMonth {
  month: number;
  year: number;
  label: string;
  finalPayment: number | null;
  signed: boolean;
}

export function PayslipsGrid({ months }: { months: PayslipMonth[] }) {
  const router = useRouter();
  const [signing, setSigning] = useState<PayslipMonth | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {months.map((m) => {
          const available = m.finalPayment !== null;
          const awaitingSignature = available && !m.signed;

          return (
            <div
              key={`${m.year}-${m.month}`}
              className={`rounded-lg border p-5 ${
                !available
                  ? "border-border bg-background opacity-60"
                  : awaitingSignature
                    ? "border-[var(--orange)]/30 bg-[var(--orange-lt)]"
                    : "border-border bg-card"
              }`}
            >
              <p className="text-sm font-semibold text-foreground">{m.label}</p>
              {!available ? (
                <p className="mt-2 text-sm text-muted-foreground">Not yet available</p>
              ) : (
                <>
                  <p className="mt-2 font-mono text-xl font-bold text-foreground">
                    {formatCurrency(m.finalPayment!)}
                  </p>
                  {m.signed ? (
                    <p className="mt-2 text-sm font-medium text-[var(--success)]">Signed ✓</p>
                  ) : (
                    <Button
                      size="sm"
                      variant="orange"
                      className="mt-3"
                      onClick={() => setSigning(m)}
                    >
                      Sign Payslip
                    </Button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <SignSlipDialog
        month={signing}
        onOpenChange={(open) => !open && setSigning(null)}
        onSigned={() => {
          setSigning(null);
          router.refresh();
        }}
      />
    </>
  );
}
