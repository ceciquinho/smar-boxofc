import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "@/pages/Auth";
import DeliveryList from "@/pages/DeliveryList";
import DeliveryDetail from "@/pages/DeliveryDetail";
import GenerateQR from "@/pages/GenerateQR";
import BoxSimulator from "@/pages/BoxSimulator";
import AccessLogs from "@/pages/AccessLogs";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
                      <Route path="/generate" element={<GenerateQR />} />
                      <Route path="/box" element={<BoxSimulator />} />
                      <Route path="/logs" element={<AccessLogs />} />
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
  </QueryClientProvider>
);

export default App;
