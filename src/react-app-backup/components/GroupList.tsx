// Group list component (placeholder)
interface GroupListProps {
  refreshTrigger: number;
}

export default function GroupList({ refreshTrigger: _refreshTrigger }: GroupListProps) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Groups</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Group management coming soon...</p>
      </div>
    </div>
  );
}
