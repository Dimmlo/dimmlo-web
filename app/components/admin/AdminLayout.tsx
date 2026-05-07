import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-off-white">
      <AdminSidebar />
      <main className="flex-1 px-4 pb-24 pt-6 sm:px-8 sm:pb-8">{children}</main>
    </div>
  );
}
