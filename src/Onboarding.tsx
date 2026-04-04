"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  CreateOrganization,
  OrganizationSwitcher,
  RedirectToSignIn,
  useAuth,
  useOrganization,
  UserButton,
} from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  GitMerge,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchWithAuth } from "@/lib/api";
import {
  isOnboardingCompleteLocally,
  setOnboardingCompleteLocally,
} from "@/lib/onboarding-local";

type Repo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  default_branch: string;
  updated_at: string | null;
};

const clerkOnboardingAppearance = {
  baseTheme: dark,
  elements: {
    card: "bg-white/[0.03] border border-white/10 shadow-none",
    headerTitle: "text-foreground",
    headerSubtitle: "text-muted-foreground",
  },
} as const;

const steps = [
  { 
    id: 1, 
    title: "District / Team", 
    description: "Establish your workspace identity.",
    icon: <Building2 className="w-4 h-4" />,
    color: "from-blue-500/20 to-indigo-500/20"
  },
  { 
    id: 2, 
    title: "GitHub Sync", 
    description: "Bridge your development workflow.",
    icon: <GitMerge className="w-4 h-4" />,
    color: "from-slate-500/20 to-slate-800/20"
  },
  { 
    id: 3, 
    title: "Project Selection", 
    description: "Choose your starting point.",
    icon: <LayoutGrid className="w-4 h-4" />,
    color: "from-emerald-500/20 to-teal-500/20"
  },
] as const;

export default function Onboarding() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { organization } = useOrganization();
  const router = useRouter();

  const [profileLoaded, setProfileLoaded] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [step, setStep] = useState(1);
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [reposLoading, setReposLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const progress = useMemo(() => (step / steps.length) * 100, [step]);

  const persistStep = useCallback(
    async (next: number) => {
      setSaving(true);
      setSaveError(null);
      try {
        const res = await fetchWithAuth("/api/onboarding", getToken, {
          method: "PUT",
          body: JSON.stringify({ onboardingStep: next }),
        });
        if (!res.ok) {
          setSaveError("Could not save progress. Check DATABASE_URL and try again.");
          return;
        }
        setStep(next);
      } catch {
        setSaveError("Network error while saving.");
      } finally {
        setSaving(false);
      }
    },
    [getToken],
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    setProfileLoaded(false);
    setLoadError(null);
    (async () => {
      try {
        const res = await fetchWithAuth("/api/onboarding", getToken, {
          method: "GET",
        });
        if (cancelled) return;
        if (!res.ok) {
          if (isOnboardingCompleteLocally()) {
            setAlreadyDone(true);
          } else {
            setStep(1);
          }
          if (res.status >= 500) {
            setLoadError("Server could not load your profile (database may be unset).");
          }
          setProfileLoaded(true);
          return;
        }
        const data = (await res.json()) as {
          onboardingStep: number;
          onboardingCompletedAt: string | null;
        };
        if (data.onboardingCompletedAt) {
          setOnboardingCompleteLocally();
          setAlreadyDone(true);
        } else {
          const s = data.onboardingStep;
          setStep(
            typeof s === "number" && s >= 1 && s <= steps.length
              ? Math.floor(s)
              : 1,
          );
        }
        setProfileLoaded(true);
      } catch {
        if (cancelled) return;
        if (isOnboardingCompleteLocally()) {
          setAlreadyDone(true);
        } else {
          setStep(1);
        }
        setLoadError("Could not reach the server.");
        setProfileLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (alreadyDone) {
      router.replace("/dashboard");
    }
  }, [alreadyDone, router]);

  const loadRepos = useCallback(async () => {
    setReposLoading(true);
    try {
      const res = await fetchWithAuth("/api/repos", getToken);
      const data = (await res.json().catch(() => ({}))) as {
        repos?: Repo[];
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        if (res.status === 400 && data.code === "GITHUB_NOT_CONNECTED") {
          setRepoError(
            "GitHub is not connected. Open your profile → Connected accounts and link GitHub.",
          );
        } else {
          setRepoError(data.error ?? "Could not load repositories.");
        }
        setRepos([]);
        return;
      }
      setRepoError(null);
      setRepos(data.repos ?? []);
    } catch {
      setRepoError("Network error loading repositories.");
      setRepos([]);
    } finally {
      setReposLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (step !== 3 || !isSignedIn) return;
    void loadRepos();
  }, [step, isSignedIn, loadRepos]);

  const finish = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetchWithAuth("/api/onboarding", getToken, {
        method: "PUT",
        body: JSON.stringify({ onboardingCompleted: true }),
      });
      if (!res.ok) {
        setSaveError("Could not complete setup. Check DATABASE_URL and try again.");
        return;
      }
      setOnboardingCompleteLocally();
      router.replace("/dashboard");
    } catch {
      setSaveError("Network error while completing setup.");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

  if (alreadyDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="relative">
          <div className="absolute inset-0 blur-2xl bg-primary/20 animate-pulse rounded-full" />
          <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
        </div>
      </div>
    );
  }

  if (!profileLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="relative">
          <div className="absolute inset-0 blur-2xl bg-primary/20 animate-pulse rounded-full" />
          <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
        </div>
      </div>
    );
  }

  const currentStepData = steps[step - 1];

  return (
    <div className="min-h-screen bg-[#050505] text-foreground selection:bg-primary/30 selection:text-primary font-body overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b ${currentStepData.color} opacity-30 blur-[120px] transition-all duration-1000`} />
      </div>

      <header className="relative z-50 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 transition-all group-hover:scale-105 group-hover:border-primary/40">
                <GitBranch className="text-primary" size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase tracking-widest leading-none">GitLuminary</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-mono">Setup Protocol</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">System Online</span>
            </div>
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-9 w-9 ring-1 ring-white/10 hover:ring-primary/40 transition-all duration-300",
                },
              }}
            />
          </div>
        </div>
      </header>

      {(loadError ?? saveError) && (
        <div className="relative z-20 mx-auto w-full max-w-5xl px-8 pt-4">
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
            {loadError ?? saveError}
          </p>
        </div>
      )}

      <main className="relative z-10 mx-auto w-full max-w-5xl px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16 items-start">
          
          {/* Left Column: Content */}
          <div className="space-y-12 animate-fade-in">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
                <Sparkles size={12} />
                Step {step} of 3
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-display">
                {currentStepData.title}
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/10 to-transparent" />
              
              <div className="min-h-[400px] transition-all duration-500">
                {step === 1 && (
                  <div className="space-y-8 animate-fade-in">
                    <div className="glass-panel rounded-2xl p-8 space-y-6 border-primary/10 glow-primary">
                      <p className="text-sm text-muted-foreground text-center max-w-md mx-auto leading-relaxed">
                        Select your district or team, or create a new organization. You can continue without one and set this up later.
                      </p>
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                          <div className="h-px flex-1 bg-white/10" />
                          <span>Select district</span>
                          <div className="h-px flex-1 bg-white/10" />
                        </div>
                        <div className="flex justify-center">
                          <OrganizationSwitcher
                            appearance={clerkOnboardingAppearance}
                            afterSelectOrganizationUrl="/onboarding"
                            hidePersonal={false}
                          />
                        </div>
                        {organization ? (
                          <p className="text-center text-xs text-muted-foreground">
                            Active workspace:{" "}
                            <span className="font-medium text-foreground">
                              {organization.name}
                            </span>
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                          <div className="h-px flex-1 bg-white/10" />
                          <span>New organization</span>
                          <div className="h-px flex-1 bg-white/10" />
                        </div>
                        <div className="flex justify-center [&_.cl-card]:max-w-md [&_.cl-card]:w-full">
                          <CreateOrganization
                            appearance={clerkOnboardingAppearance}
                            afterCreateOrganizationUrl="/onboarding"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        size="lg"
                        className="rounded-xl px-8 h-12 font-bold uppercase tracking-widest group"
                        disabled={saving}
                        onClick={() => void persistStep(2)}
                      >
                        Initialize Sync
                        <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-8 animate-fade-in">
                    <div className="glass-panel rounded-2xl p-10 flex flex-col items-center text-center space-y-8 border-primary/10 glow-primary">
                      <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <GitMerge className="w-10 h-10 relative z-10" />
                      </div>
                      <div className="space-y-3 max-w-sm">
                        <h3 className="text-xl font-bold">Connect GitHub Account</h3>
                        <p className="text-sm text-muted-foreground">
                          Link your GitHub profile to synchronize your repositories and track your commit progress.
                        </p>
                      </div>
                      <div className="w-full max-w-md p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-blue-200/70 leading-relaxed">
                        Navigate to <strong>User Settings</strong> → <strong>Connected Accounts</strong> to authorize GitLuminary.
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Button variant="ghost" onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground">
                        Back
                      </Button>
                      <Button
                        size="lg"
                        className="rounded-xl px-8 h-12 font-bold uppercase tracking-widest group"
                        disabled={saving}
                        onClick={() => void persistStep(3)}
                      >
                        Verify Connection
                        <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-8 animate-fade-in">
                    <div className="glass-panel rounded-2xl p-8 space-y-6 border-primary/10 glow-primary">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-center sm:text-left">
                          Your repositories
                        </h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0 border-white/10 bg-white/5"
                          disabled={reposLoading}
                          onClick={() => void loadRepos()}
                        >
                          {reposLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Refresh list
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground text-center max-w-md mx-auto sm:mx-0 sm:text-left">
                        Repositories come from your linked GitHub account. Use{" "}
                        <strong className="text-foreground/90">Connected accounts</strong>{" "}
                        in your profile if the list is empty.
                      </p>
                      {reposLoading && repos === null ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : repoError ? (
                        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                          {repoError}
                        </p>
                      ) : repos && repos.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No repositories found for this account.
                        </p>
                      ) : (
                        <ScrollArea className="h-[min(360px,50vh)] pr-3">
                          <ul className="space-y-2">
                            {(repos ?? []).map((r) => (
                              <li
                                key={r.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm"
                              >
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium text-foreground truncate">
                                      {r.name}
                                    </span>
                                    {r.private ? (
                                      <Badge variant="secondary" className="text-[10px]">
                                        Private
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate font-mono">
                                    {r.full_name}
                                  </p>
                                </div>
                                <a
                                  href={r.html_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                                >
                                  Open
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </li>
                            ))}
                          </ul>
                        </ScrollArea>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <Button variant="ghost" onClick={() => setStep(2)} className="text-muted-foreground hover:text-foreground">
                        Back
                      </Button>
                      <Button
                        size="lg"
                        className="rounded-xl px-10 h-12 font-bold uppercase tracking-widest group bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(173,198,255,0.2)]"
                        disabled={saving}
                        onClick={() => void finish()}
                      >
                        Complete Setup
                        <Sparkles className="ml-2 w-4 h-4 transition-transform group-hover:scale-110" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar Stats */}
          <aside className="hidden lg:block space-y-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="glass-panel rounded-2xl p-8 space-y-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Onboarding Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
                    <span>Protocol Stage</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5 bg-white/5" />
                </div>
              </div>

              <div className="space-y-6">
                {steps.map((s) => (
                  <div key={s.id} className={`flex items-start gap-4 transition-all duration-500 ${step === s.id ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${step === s.id ? 'border-primary/40 bg-primary/10 text-primary shadow-[0_0_15px_rgba(173,198,255,0.1)]' : 'border-white/10 bg-white/5 text-muted-foreground'}`}>
                      {step > s.id ? <CheckCircle2 size={16} /> : s.icon}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-widest">{s.title}</h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    Your workspace is being provisioned in the <span className="text-foreground font-bold">Deep Space</span> cluster.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Latency</span>
              <span className="text-[9px] font-mono text-emerald-500">12ms</span>
            </div>
          </aside>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

