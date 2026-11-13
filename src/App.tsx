import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider, useAuth, type UserInterfaceRole } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "@/pages/Auth";
import DeliveryList from "@/pages/DeliveryList";
import DeliveryDetail from "@/pages/DeliveryDetail";
import GenerateQR from "@/pages/GenerateQR";
import BoxSimulator from "@/pages/BoxSimulator";
import AccessLogs from "@/pages/AccessLogs";
import ScanQR from "@/pages/ScanQR";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="smart-delivery-theme">
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<DeliveryList />} />
                      <Route path="/delivery/:id" element={<DeliveryDetail />} />
                      <Route
                        path="/generate"
                        element={
                          <RoleRoute roles={["cliente", "admin"]}>
                            <GenerateQR />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/scan"
                        element={
                          <RoleRoute roles={["entregador", "admin"]}>
                            <ScanQR />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/box"
                        element={
                          <RoleRoute roles={["entregador", "admin"]}>
                            <BoxSimulator />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/logs"
                        element={
                          <RoleRoute roles={["admin"]}>
                            <AccessLogs />
                          </RoleRoute>
                        }
                      />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

function RoleRoute({ roles, children }: { roles: UserInterfaceRole[]; children: React.ReactNode }) {
  const { role, loading } = useAuth();
  if (loading) return <div className="py-20 text-center text-muted-foreground">Carregando...</div>;
  if (!role || !roles.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
