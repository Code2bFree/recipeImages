import { VaultClient } from "./VaultClient";

export default async function VaultPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const nextParam = sp.next;
  const nextPath =
    typeof nextParam === "string"
      ? nextParam
      : Array.isArray(nextParam)
        ? nextParam[0]
        : "/";

  return <VaultClient nextPath={nextPath} />;
}
