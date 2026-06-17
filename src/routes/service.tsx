import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy/typo path — always redirect to the real services menu.
export const Route = createFileRoute("/service")({
  beforeLoad: () => {
    throw redirect({ to: "/services" });
  },
  component: () => null,
});
