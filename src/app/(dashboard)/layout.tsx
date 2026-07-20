import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { AkamaiLogo } from "@/components/shared/akamai-logo";
import { Footer } from "@/components/shared/footer";
import { SidebarNav, type NavItem } from "./sidebar-nav";
import { Header } from "./header";
import {
  getAllExtraLeaveRequests,
  getLeaveRequestsByApprentice,
  getLeaveRequestsByManager,
  getPayrollForMonth,
  getStipendSlipsByApprentice,
} from "@/lib/firestore";
import { MONTH_NAMES, formatCurrency, formatDate } from "@/lib/utils";
import type { NotificationItem, Role } from "@/types/index";
import {
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  Clock,
  CreditCard,
  FileText,
  LayoutDashboard,
  Palmtree,
  Settings,
  TrendingDown,
  UserCog,
  Users,
} from "lucide-react";

const ICON_CLASS = "h-[18px] w-[18px] shrink-0";

async function getNavItems(
  role: Role,
  userId: string,
): Promise<{ items: NavItem[]; notifications: NotificationItem[] }> {
  if (role === "apprentice") {
    const now = new Date();
    const [requests, payroll, slips] = await Promise.all([
      getLeaveRequestsByApprentice(userId),
      getPayrollForMonth(now.getMonth() + 1, now.getFullYear()),
      getStipendSlipsByApprentice(userId),
    ]);

    const cutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const decisionNotifications: NotificationItem[] = requests
      .filter((r) => r.status !== "pending" && r.decidedAt && r.decidedAt >= cutoff)
      .sort((a, b) => b.decidedAt!.localeCompare(a.decidedAt!))
      .map((r) => ({
        id: r.id,
        message: `Your ${r.leaveType} request was ${r.status}`,
        meta: formatDate(r.decidedAt!),
        href: "/apprentice/history",
      }));

    const record = payroll.find((p) => p.apprenticeId === userId);
    const slip = slips.find((s) => s.month === now.getMonth() + 1 && s.year === now.getFullYear());
    const payslipNotifications: NotificationItem[] =
      record && !slip?.signedAt
        ? [
            {
              id: `payslip-${now.getFullYear()}-${now.getMonth() + 1}`,
              message: `Your ${MONTH_NAMES[now.getMonth()]} payslip is ready to sign`,
              meta: formatCurrency(record.finalPayment),
              href: "/apprentice/payslips",
            },
          ]
        : [];

    const notifications = [...payslipNotifications, ...decisionNotifications];

    return {
      notifications,
      items: [
        { label: "Dashboard", href: "/apprentice", icon: <LayoutDashboard className={ICON_CLASS} /> },
        {
          label: "Apply for Leave",
          href: "/apprentice/apply",
          icon: <CalendarPlus className={ICON_CLASS} />,
        },
        {
          label: "Leave History",
          href: "/apprentice/history",
          icon: <CalendarDays className={ICON_CLASS} />,
        },
        { label: "Payslips", href: "/apprentice/payslips", icon: <FileText className={ICON_CLASS} /> },
      ],
    };
  }

  if (role === "manager") {
    const requests = await getLeaveRequestsByManager(userId);
    const pendingRequests = requests.filter((r) => r.status === "pending");
    const notifications: NotificationItem[] = [...pendingRequests]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => ({
        id: r.id,
        message: `${r.apprenticeName} requested ${r.leaveType}`,
        meta: `${r.noOfDays}d · ${formatDate(r.startDate)}`,
        href: "/manager/approvals",
      }));

    return {
      notifications,
      items: [
        { label: "Dashboard", href: "/manager", icon: <LayoutDashboard className={ICON_CLASS} /> },
        {
          label: "Pending Approvals",
          href: "/manager/approvals",
          icon: <Clock className={ICON_CLASS} />,
          badge: pendingRequests.length || undefined,
        },
        { label: "My Apprentices", href: "/manager/team", icon: <Users className={ICON_CLASS} /> },
      ],
    };
  }

  // hr
  const lopRequests = await getAllExtraLeaveRequests();
  const pendingLopRequests = lopRequests.filter((r) => r.status === "pending");
  const notifications: NotificationItem[] = [...pendingLopRequests]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => ({
      id: r.id,
      message: `${r.apprenticeName} requested Extra Leave (LOP)`,
      meta: `${r.noOfDays}d · ${formatDate(r.startDate)}`,
      href: "/hr/lop",
    }));

  return {
    notifications,
    items: [
      { label: "Dashboard", href: "/hr", icon: <LayoutDashboard className={ICON_CLASS} /> },
      {
        label: "Leave Requests",
        href: "/hr/leave-requests",
        icon: <ClipboardList className={ICON_CLASS} />,
      },
      { label: "Apprentices", href: "/hr/apprentices", icon: <UserCog className={ICON_CLASS} /> },
      {
        label: "Extra Leave (LOP)",
        href: "/hr/lop",
        icon: <TrendingDown className={ICON_CLASS} />,
        badge: pendingLopRequests.length || undefined,
      },
      { label: "Payroll", href: "/hr/payroll", icon: <CreditCard className={ICON_CLASS} /> },
      { label: "Holiday List", href: "/hr/holidays", icon: <Palmtree className={ICON_CLASS} /> },
      { label: "HR Team", href: "/hr/team", icon: <Users className={ICON_CLASS} /> },
      { label: "System Config", href: "/hr/config", icon: <Settings className={ICON_CLASS} /> },
    ],
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const { role, name, email } = session.user;
  const { items: navItems, notifications } = await getNavItems(role, session.user.id);

  return (
    <div className="min-h-screen bg-background">
      <aside
        className="fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col bg-cover bg-center"
        style={{ backgroundImage: "url(/sidebar-bg.png)" }}
      >
        <div className="relative flex flex-col h-full">
          <div className="flex shrink-0 items-center border-b border-white/[0.08] px-4 py-5">
            <Link href={`/${role}`} aria-label="Go to dashboard">
              <AkamaiLogo width={110} priority />
            </Link>
          </div>

          <SidebarNav items={navItems} />

          <div className="mx-2 my-3 h-[150px] shrink-0 rounded-xl border border-white/10 p-4">
            <p className="text-sm font-semibold text-white">Simplify leaves.</p>
            <p className="text-[15px] font-bold text-[var(--orange)]">Empower people.</p>
            <p className="mt-2 text-xs text-white/55">
              A unified leave management experience for Akamai teams.
            </p>
          </div>

          <div className="shrink-0 border-t border-white/[0.08] p-2">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <Header
        name={name ?? ""}
        email={email ?? ""}
        role={role}
        notifications={notifications}
      />

      <main className="min-h-screen overflow-y-auto bg-background pl-[240px] pt-16">
        <div className="flex min-h-[calc(100vh-4rem)] flex-col">
          <div className="flex-1 p-7">{children}</div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
