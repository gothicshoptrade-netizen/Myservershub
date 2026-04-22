import AppLayout from "@/components/AppLayout";

export default function AppGroup({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
