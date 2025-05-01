export default function MaskInstructions() {
    return (
        <div className="bg-blue-50 mb-4 p-4 border border-blue-200 rounded-lg">
            <h3 className="mb-2 font-bold text-blue-800">How to Use the Mask Editor</h3>
            <ul className="space-y-1 pl-5 text-blue-900 list-disc">
                <li>Draw with the white brush to create your mask</li>
                <li>The white areas are what will be edited/replaced</li>
                <li>Black areas will remain unchanged</li>
                <li>Adjust brush size using the slider</li>
                <li>Click "Clear Mask" to start over</li>
                <li>When finished, click "Use This Mask"</li>
            </ul>
        </div>
    );
}