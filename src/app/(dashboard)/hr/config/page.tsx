"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULTS = {
  hrName: "",
  hrEmail: "",
  hrTicketLink: "",
  totalLeaveDaysPerYear: "12",
  maxLeaveDaysPerMonth: "1",
  lopCalculationBase: "30",
};

type ConfigState = typeof DEFAULTS;

export default function ConfigPage() {
  const [config, setConfigState] = useState<ConfigState>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [savingContact, setSavingContact] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/hr/config");
      const data = await res.json();
      setConfigState((prev) => ({ ...prev, ...data.config }));
      setLoading(false);
    })();
  }, []);

  function set<K extends keyof ConfigState>(key: K, value: string) {
    setConfigState((prev) => ({ ...prev, [key]: value }));
  }

  async function save(keys: (keyof ConfigState)[], setSaving: (v: boolean) => void) {
    setSaving(true);
    try {
      const payload = Object.fromEntries(keys.map((k) => [k, config[k]]));
      const res = await fetch("/api/hr/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save configuration");
      toast.success("Configuration saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function handleContactSubmit(e: FormEvent) {
    e.preventDefault();
    save(["hrName", "hrEmail", "hrTicketLink"], setSavingContact);
  }

  function handlePolicySubmit(e: FormEvent) {
    e.preventDefault();
    save(["totalLeaveDaysPerYear", "maxLeaveDaysPerMonth", "lopCalculationBase"], setSavingPolicy);
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="System Config" subtitle="Global settings for the leave system" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleContactSubmit}
          className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5"
        >
          <h3 className="text-sm font-semibold text-foreground">HR Contact</h3>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hrName">HR Name</Label>
            <Input
              id="hrName"
              value={config.hrName}
              onChange={(e) => set("hrName", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hrEmail">HR Email</Label>
            <Input
              id="hrEmail"
              type="email"
              value={config.hrEmail}
              onChange={(e) => set("hrEmail", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hrTicketLink">HR Ticket Link</Label>
            <Input
              id="hrTicketLink"
              type="url"
              value={config.hrTicketLink}
              onChange={(e) => set("hrTicketLink", e.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="navy"
            disabled={savingContact}
            className="self-start"
          >
            {savingContact ? "Saving…" : "Save Changes"}
          </Button>
        </form>

        <form
          onSubmit={handlePolicySubmit}
          className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5"
        >
          <h3 className="text-sm font-semibold text-foreground">Leave Policy</h3>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="totalLeaveDaysPerYear">Total Leave Days / Year</Label>
            <Input
              id="totalLeaveDaysPerYear"
              type="number"
              min={0}
              value={config.totalLeaveDaysPerYear}
              onChange={(e) => set("totalLeaveDaysPerYear", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maxLeaveDaysPerMonth">Max Leave Days / Month</Label>
            <Input
              id="maxLeaveDaysPerMonth"
              type="number"
              min={0}
              value={config.maxLeaveDaysPerMonth}
              onChange={(e) => set("maxLeaveDaysPerMonth", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lopCalculationBase">LOP Calculation Base (days)</Label>
            <Input
              id="lopCalculationBase"
              type="number"
              min={1}
              value={config.lopCalculationBase}
              onChange={(e) => set("lopCalculationBase", e.target.value)}
            />
          </div>
          <Button type="submit" variant="navy" disabled={savingPolicy} className="self-start">
            {savingPolicy ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}
