// Import/Export component (placeholder)
interface ImportExportProps {
  onImportComplete: () => void;
}

export default function ImportExport({ onImportComplete: _onImportComplete }: ImportExportProps) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Import & Export</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Import/Export functionality coming soon...</p>
      </div>
    </div>
  );
}
