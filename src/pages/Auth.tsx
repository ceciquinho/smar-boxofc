// Auth page — email/password + Google. Redirects authenticated users to home.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else navigate("/");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: name },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Conta criada! Verifique seu email para confirmar.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="glass-card w-full max-w-md p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold">Smart Delivery Box</h1>
            <p className="text-xs text-muted-foreground">Entre na sua conta</p>
          </div>
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Senha (mín. 6 caracteres)</Label>
                <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Criando..." : "Criar conta"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={() => signInWithGoogle().catch((e) => toast.error(e.message))}>
          Continuar com Google
        </Button>
      </div>
    </div>
  );
}
