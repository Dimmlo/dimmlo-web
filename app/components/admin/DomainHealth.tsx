type Props = { status: string };

export default function DomainHealth({ status }: Props) {
  const cls =
    status === "green"
      ? "badge-green"
      : status === "amber"
      ? "badge-amber"
      : status === "red"
      ? "badge-red"
      : "badge-grey";
  return <span className={cls}>{status}</span>;
}
