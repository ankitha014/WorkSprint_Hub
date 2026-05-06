import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, FolderKanban, CheckCircle2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there';

  const handleContinue = () => {
    setLeaving(true);
    setTimeout(() => navigate('/dashboard'), 350);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#121212] text-white flex items-center justify-center p-6">
      {/* Animated gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-indigo-600/25 blur-[120px] animate-blob" />
        <div className="absolute top-1/3 -right-32 h-[26rem] w-[26rem] rounded-full bg-purple-600/25 blur-[120px] animate-blob [animation-delay:3s]" />
        <div className="absolute -bottom-32 left-1/4 h-[24rem] w-[24rem] rounded-full bg-blue-500/20 blur-[120px] animate-blob [animation-delay:6s]" />
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Floating icon shapes */}
      <Sparkles className="absolute top-[18%] left-[14%] h-5 w-5 text-purple-300/40 animate-float" />
      <FolderKanban className="absolute top-[28%] right-[18%] h-6 w-6 text-indigo-300/40 animate-float [animation-delay:2s]" />
      <CheckCircle2 className="absolute bottom-[20%] left-[20%] h-5 w-5 text-blue-300/40 animate-float [animation-delay:4s]" />
      <Users className="absolute bottom-[26%] right-[16%] h-5 w-5 text-purple-300/40 animate-float [animation-delay:1s]" />

      {/* Card */}
      <div
        className={`relative z-10 w-full max-w-2xl transition-all duration-500 ${
          leaving ? 'opacity-0 scale-95 blur-sm' : 'animate-fade-in'
        }`}
      >
        <div className="group relative rounded-3xl bg-[#0A0A0A]/90 border border-white/10 backdrop-blur-xl p-10 md:p-14 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] transition-transform duration-500 hover:scale-[1.01]">
          {/* Gradient ring */}
          <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-indigo-500/30 via-purple-500/10 to-transparent opacity-60" style={{ mask: 'linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)', WebkitMask: 'linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', padding: 1 }} />

          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/70 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Signed in as {firstName}
            </div>

            <h1 className="font-heading text-4xl md:text-5xl font-semibold tracking-tight">
              Welcome to Your Workspace{' '}
              <span className="inline-block animate-float">🚀</span>
            </h1>

            <p className="mt-5 text-base md:text-lg text-white/65 leading-relaxed max-w-xl mx-auto">
              Plan, track, and manage your projects effortlessly. Stay organized,
              collaborate with your team, and get things done faster.
            </p>

            <div className="mt-9 flex items-center justify-center">
              <Button
                onClick={handleContinue}
                size="lg"
                className="group/btn relative h-12 px-7 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] text-white border-0 shadow-[0_10px_30px_-10px_rgba(124,58,237,0.6)] hover:bg-[position:100%_0] hover:scale-[1.03] transition-all duration-300"
              >
                Open Dashboard
                <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </Button>
            </div>

            {/* Quick stats */}
            <div className="mt-12 grid grid-cols-3 gap-3 md:gap-4">
              {[
                { icon: FolderKanban, label: 'Projects', hint: 'Organize work' },
                { icon: CheckCircle2, label: 'Tasks', hint: 'Track progress' },
                { icon: Users, label: 'Team', hint: 'Collaborate live' },
              ].map(({ icon: Icon, label, hint }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border border-white/10">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs text-white/50">{hint}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/40 mt-6">
          Tip: press <kbd className="px-1.5 py-0.5 rounded border border-white/15 bg-white/5">Enter</kbd> to continue
        </p>
      </div>
    </div>
  );
}
