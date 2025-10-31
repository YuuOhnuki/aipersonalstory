export default function LiquidBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[60vh] w-[80vw] rounded-[50%] bg-gradient-to-br from-indigo-400/30 via-fuchsia-400/30 to-rose-400/30 blur-3xl"></div>
      <div className="absolute bottom-[-20%] right-[-10%] h-[50vh] w-[50vw] rounded-[50%] bg-gradient-to-tr from-cyan-300/25 to-blue-400/25 blur-3xl"></div>
      <div className="absolute inset-0 bg-[radial-gradient(1000px_500px_at_10%_-10%,rgba(255,255,255,0.25),transparent),radial-gradient(600px_300px_at_90%_110%,rgba(255,255,255,0.15),transparent)] dark:bg-[radial-gradient(1000px_500px_at_10%_-10%,rgba(255,255,255,0.06),transparent),radial-gradient(600px_300px_at_90%_110%,rgba(255,255,255,0.04),transparent)]"></div>
    </div>
  );
}
