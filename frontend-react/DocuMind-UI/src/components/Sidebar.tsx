type Props = {
  documents: string[];
  selectedDoc: string;
  onSelect: (doc: string) => void;
};

function Sidebar({ documents, selectedDoc, onSelect }: Props) {
  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 p-4">
      <h2 className="text-sm text-gray-400 mb-3">Documents</h2>

      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc}
            onClick={() => onSelect(doc)}
            className={`p-2 rounded-lg cursor-pointer transition 
              ${
                selectedDoc === doc
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-800"
              }`}
          >
            {doc}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;