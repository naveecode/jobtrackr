export default async function HomePage() {
  if (process.env.NEXT_PUBLIC_DEMO === "1") {
    const { DemoTracker } = await import("@/components/demo-tracker");
    return <DemoTracker />;
  }
  const { Landing } = await import("@/components/landing");
  return <Landing />;
}
