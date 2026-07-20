import { auth } from "@/auth";
import { getUserById } from "@/lib/firestore";
import { ExtraLeaveForm } from "./extra-leave-form";

export default async function ApplyExtraLeavePage() {
  const session = await auth();
  const user = await getUserById(session!.user.id);
  const perDay = (user?.stipend ?? 0) / 30;

  return (
    <div className="max-w-2xl">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Apply for Extra Leave (LOP)</h2>
      <ExtraLeaveForm perDay={perDay} />
    </div>
  );
}
