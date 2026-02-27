type AvailabilityProps = {
  total: number;
  available: number;
  checkedOut: number;
  archived: number;
};

export default function AvailabilityBadge({ total, available, checkedOut, archived }: AvailabilityProps) {
  return (
    <div className="pill">
      <strong>Availability</strong> {available}/{total} available · {checkedOut} out · {archived} archived
    </div>
  );
}
